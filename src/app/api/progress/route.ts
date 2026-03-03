import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { progressCreateSchema, progressQuerySchema, idSchema } from '@/lib/validation'
import { createErrorResponse, handleZodError, logError, logWarning } from '@/lib/error-handler'
import { ZodError } from 'zod'

// GET /api/progress - Récupère la progression de l'utilisateur connecté
async function getHandler(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session) {
      logWarning('GET /api/progress', 'Tentative d\'accès non autorisé', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    // Validation des paramètres de requête
    const { searchParams } = new URL(request.url)
    const queryParams = {
      techniqueId: searchParams.get('techniqueId') ?? undefined,
      beltId: searchParams.get('beltId') ?? undefined,
    }
    
    const validatedParams = progressQuerySchema.parse(queryParams)

    const where: { 
      userId: string
      techniqueId?: string 
    } = { userId: session.user.id }
    
    if (validatedParams.techniqueId) {
      where.techniqueId = validatedParams.techniqueId
    }

    // Si on demande la progression par ceinture
    if (validatedParams.beltId) {
      // Validation de l'ID de ceinture
      idSchema.parse(validatedParams.beltId)
      
      const progress = await prisma.userTechniqueProgress.findMany({
        where: {
          userId: session.user.id,
          technique: {
            module: {
              beltId: validatedParams.beltId,
            },
          },
        },
        include: {
          technique: {
            select: { 
              id: true, 
              name: true, 
              category: true, 
              moduleId: true,
              module: {
                select: {
                  code: true,
                  belt: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    }
                  }
                }
              }
            },
          },
        },
      })

      // Calculer les statistiques
      const stats = {
        total: progress.length,
        nonAcquis: progress.filter((p: typeof progress[0]) => p.level === 'NON_ACQUIS').length,
        enCours: progress.filter((p: typeof progress[0]) => p.level === 'EN_COURS_DAPPRENTISSAGE').length,
        acquis: progress.filter((p: typeof progress[0]) => p.level === 'ACQUIS').length,
        maitrise: progress.filter((p: typeof progress[0]) => p.level === 'MAITRISE').length,
      }

      return NextResponse.json({ progress, stats })
    }

    const progress = await prisma.userTechniqueProgress.findMany({
      where,
      include: {
        technique: {
          select: { 
            id: true, 
            name: true, 
            category: true,
            module: {
              select: {
                code: true,
                belt: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  }
                }
              }
            }
          },
        },
      },
    })

    return NextResponse.json(progress)
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('GET /api/progress', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// POST /api/progress - Met à jour ou crée une progression
async function postHandler(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session) {
      logWarning('POST /api/progress', 'Tentative d\'accès non autorisé', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const body = await request.json()
    const validatedData = progressCreateSchema.parse(body)

    const progress = await prisma.userTechniqueProgress.upsert({
      where: {
        userId_techniqueId: {
          userId: session.user.id,
          techniqueId: validatedData.techniqueId,
        },
      },
      update: {
        level: validatedData.level,
        notes: validatedData.notes,
      },
      create: {
        userId: session.user.id,
        techniqueId: validatedData.techniqueId,
        level: validatedData.level,
        notes: validatedData.notes,
      },
    })

    return NextResponse.json(progress)
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('POST /api/progress', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting
// GET: 100 requêtes/minute, POST: 20 requêtes/minute
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })
export const POST = withRateLimit(postHandler, { method: 'POST', max: 20 })

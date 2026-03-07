import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { idSchema } from '@/lib/validation'
import { createErrorResponse, handleZodError, logError, logWarning } from '@/lib/error-handler'
import { ZodError } from 'zod'

// GET /api/modules/[id] - Détail d'un module avec ses techniques
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let moduleId = 'unknown'
  
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session) {
      logWarning('GET /api/modules/[id]', 'Tentative d\'accès non autorisé', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { id } = await params
    moduleId = id
    
    // Validation de l'ID
    const validatedId = idSchema.parse(id)

    const module = await prisma.module.findUnique({
      where: { id: validatedId },
      include: {
        belt: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        techniques: {
          orderBy: { order: 'asc' },
          include: {
            videos: {
              select: { id: true }
            }
          }
        },
      },
    });

    if (!module) {
      return createErrorResponse('NOT_FOUND', 404)
    }

    // Transformer les données pour matcher le format attendu par le client
    const formattedModule = {
      ...module,
      techniques: module.techniques.map(tech => ({
        ...tech,
        _count: {
          videos: tech.videos.length
        }
      }))
    }

    return NextResponse.json(formattedModule);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('GET /api/modules/[id]', error, { moduleId })
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting: 100 requêtes/minute pour GET
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })

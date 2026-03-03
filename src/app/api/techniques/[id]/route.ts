import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { idSchema } from '@/lib/validation'
import { createErrorResponse, handleZodError, logError, logWarning } from '@/lib/error-handler'
import { ZodError } from 'zod'

// GET /api/techniques/[id] - Détail d'une technique
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions)
    if (!session) {
      logWarning('GET /api/techniques/[id]', 'Tentative d\'accès non autorisé', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { id } = await params
    
    // Validation de l'ID
    const validatedId = idSchema.parse(id)
    const userId = session.user.id

    const technique = await prisma.technique.findUnique({
      where: { id: validatedId },
      include: {
        module: {
          include: {
            belt: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        videos: {
          include: {
            video: true,
          },
        },
        progress: {
          where: { userId },
        },
      },
    })

    if (!technique) {
      return createErrorResponse('NOT_FOUND', 404)
    }

    // Récupérer les vidéos personnelles de l'utilisateur
    const userVideos = await prisma.userTechniqueVideo.findMany({
      where: {
        userId,
        techniqueId: validatedId,
      },
      include: {
        video: true,
      },
    })

    return NextResponse.json({
      ...technique,
      userVideos,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('GET /api/techniques/[id]', error, { params: await params.catch(() => 'unknown') })
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting: 100 requêtes/minute pour GET
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })

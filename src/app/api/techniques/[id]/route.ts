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

    // Récupérer TOUTES les vidéos personnelles de cette technique (pour debug)
    const userVideos = await prisma.userTechniqueVideo.findMany({
      where: {
        techniqueId: validatedId,
      },
      include: {
        video: true,
      },
    })
    
    console.log('API - Vidéos trouvées:', userVideos.length, 'pour technique:', validatedId)
    console.log('API - Détail vidéos:', JSON.stringify(userVideos.map(v => ({ id: v.id, slot: v.slot, userId: v.userId, videoId: v.videoId })), null, 2))

    // Ajouter l'URL de streaming aux vidéos
    const userVideosWithUrl = userVideos.map(uv => ({
      ...uv,
      video: {
        ...uv.video,
        url: `/api/videos/${uv.video.id}/stream`,
      }
    }))

    return NextResponse.json({
      ...technique,
      userVideos: userVideosWithUrl,
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

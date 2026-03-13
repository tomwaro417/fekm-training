import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'
import { idSchema } from '@/lib/validation'
import { ZodError } from 'zod'

// GET /api/techniques/[id]/note - Récupérer la note de l'utilisateur sur une technique spécifique
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let techniqueId = 'unknown'

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      logWarning('GET /api/techniques/[id]/note', 'Tentative d\'accès non autorisé', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const userId = session.user.id
    const { id } = await params
    techniqueId = id

    // Validation de l'ID
    const validatedId = idSchema.parse(id)

    // Vérifier que la technique existe
    const technique = await prisma.technique.findUnique({
      where: { id: validatedId },
      select: { id: true, name: true },
    })

    if (!technique) {
      return createErrorResponse('NOT_FOUND', 404, 'Technique non trouvée')
    }

    // Récupérer la note de l'utilisateur pour cette technique
    const note = await prisma.userNote.findUnique({
      where: {
        userId_techniqueId: {
          userId,
          techniqueId: validatedId,
        },
      },
      include: {
        technique: {
          select: {
            id: true,
            name: true,
            category: true,
            module: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    })

    if (!note) {
      return NextResponse.json({
        note: null,
        hasNote: false,
        technique: {
          id: technique.id,
          name: technique.name,
        },
      })
    }

    return NextResponse.json({
      note,
      hasNote: true,
    })

  } catch (error) {
    if (error instanceof ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 400, 'ID de technique invalide')
    }

    logError('GET /api/techniques/[id]/note', error, { techniqueId })
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting: 100 requêtes/minute pour GET
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })

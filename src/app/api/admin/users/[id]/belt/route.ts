import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'
import { z } from 'zod'

// PATCH /api/admin/users/[id]/belt - Assigner une ceinture à un utilisateur
async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR')) {
      logWarning('PATCH /api/admin/users/[id]/belt', 'Accès non autorisé', {
        userId: session?.user?.id,
        role: session?.user?.role,
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { id } = await params
    const body = await request.json()

    // Validation
    const schema = z.object({
      beltId: z.string().uuid().nullable(),
    })

    const validation = schema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('BAD_REQUEST', 400, 'Données invalides', validation.error)
    }

    const { beltId } = validation.data

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id },
      include: { belt: true },
    })

    if (!user) {
      return createErrorResponse('NOT_FOUND', 404, 'Utilisateur non trouvé')
    }

    // Si beltId est fourni, vérifier qu'il existe
    if (beltId) {
      const beltExists = await prisma.belt.findUnique({
        where: { id: beltId },
      })
      if (!beltExists) {
        return createErrorResponse('NOT_FOUND', 404, 'Ceinture non trouvée')
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { beltId },
      include: {
        belt: {
          select: { id: true, name: true, color: true },
        },
      },
    })

    logWarning('PATCH /api/admin/users/[id]/belt', 'Ceinture assignée', {
      adminId: session.user.id,
      userId: id,
      oldBeltId: user.belt?.id,
      newBeltId: beltId,
    })

    return NextResponse.json({
      success: true,
      message: beltId ? 'Ceinture assignée avec succès' : 'Ceinture retirée',
      user: updatedUser,
    })
  } catch (error) {
    logError('PATCH /api/admin/users/[id]/belt', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

export const PATCH = withRateLimit(patchHandler, { method: 'PATCH', max: 20 })

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'
import { z } from 'zod'

// ============================================
// Schémas de validation Zod
// ============================================

const beltAssignmentSchema = z.object({
  beltId: z.string().uuid().nullable(),
  promotionDate: z.string().datetime().optional(),
  notes: z.string().max(1000, 'Notes trop longues').optional(),
})

// Ordre des ceintures pour validation
const BELT_ORDER = ['WHITE', 'YELLOW', 'ORANGE', 'GREEN', 'BLUE', 'BROWN', 'BLACK']

// ============================================
// Helpers
// ============================================

/**
 * Valide la progression de ceinture
 * Retourne un objet avec valid et message d'erreur si invalide
 */
function validateBeltProgression(
  currentBeltName: string | null | undefined,
  newBeltName: string
): { valid: boolean; message?: string } {
  const currentIndex = currentBeltName ? BELT_ORDER.indexOf(currentBeltName) : -1
  const newIndex = BELT_ORDER.indexOf(newBeltName)

  if (newIndex === -1) {
    return { valid: false, message: 'Niveau de ceinture invalide' }
  }

  // Si pas de ceinture actuelle, tout est valide
  if (currentIndex === -1) {
    return { valid: true }
  }

  // Vérifier la rétrogradation
  if (newIndex < currentIndex) {
    return { valid: false, message: 'Impossible de rétrograder la ceinture' }
  }

  // Vérifier les sauts de niveau (max 1 niveau à la fois)
  if (newIndex - currentIndex > 1) {
    return { valid: false, message: 'Progression trop rapide (max 1 niveau à la fois)' }
  }

  return { valid: true }
}

// ============================================
// Handlers
// ============================================

// GET /api/admin/users/[id]/belt - Récupérer l'historique des ceintures
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR')) {
      logWarning('GET /api/admin/users/[id]/belt', 'Accès non autorisé', {
        userId: session?.user?.id,
        role: session?.user?.role,
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { id } = await params

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        belt: true,
        beltHistory: {
          include: {
            belt: {
              select: { id: true, name: true, color: true, order: true },
            },
            promotedByUser: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { promotionDate: 'desc' },
        },
      },
    })

    if (!user) {
      return createErrorResponse('NOT_FOUND', 404, 'Utilisateur non trouvé')
    }

    return NextResponse.json({
      success: true,
      data: {
        currentBelt: user.belt,
        history: user.beltHistory,
      },
    })
  } catch (error) {
    logError('GET /api/admin/users/[id]/belt', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

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
    const validation = beltAssignmentSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 400, validation.error.issues)
    }

    const { beltId, promotionDate, notes } = validation.data

    // Vérifier que l'utilisateur existe avec sa ceinture actuelle
    const user = await prisma.user.findUnique({
      where: { id },
      include: { belt: true },
    })

    if (!user) {
      return createErrorResponse('NOT_FOUND', 404, 'Utilisateur non trouvé')
    }

    // Si on retire la ceinture (beltId = null)
    if (!beltId) {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { beltId: null },
        include: {
          belt: true,
        },
      })

      logWarning('PATCH /api/admin/users/[id]/belt', 'Ceinture retirée', {
        adminId: session.user.id,
        userId: id,
        oldBeltId: user.beltId,
      })

      return NextResponse.json({
        success: true,
        message: 'Ceinture retirée avec succès',
        data: {
          user: updatedUser,
          historyEntry: null,
        },
      })
    }

    // Vérifier que la nouvelle ceinture existe
    const newBelt = await prisma.belt.findUnique({
      where: { id: beltId },
    })

    if (!newBelt) {
      return createErrorResponse('NOT_FOUND', 404, 'Ceinture non trouvée')
    }

    // Valider la progression de ceinture
    const progressionCheck = validateBeltProgression(user.belt?.name, newBelt.name)
    if (!progressionCheck.valid) {
      return createErrorResponse('BAD_REQUEST', 400, progressionCheck.message)
    }

    // Empêcher d'assigner la même ceinture
    if (user.beltId === beltId) {
      return createErrorResponse('BAD_REQUEST', 400, 'L\'utilisateur a déjà cette ceinture')
    }

    // Transaction: mettre à jour l'utilisateur ET créer l'historique
    const [updatedUser, historyEntry] = await prisma.$transaction([
      // Mettre à jour l'utilisateur
      prisma.user.update({
        where: { id },
        data: { beltId },
        include: {
          belt: {
            select: { id: true, name: true, color: true, order: true },
          },
        },
      }),
      // Créer l'entrée dans l'historique
      prisma.beltHistory.create({
        data: {
          userId: id,
          beltId,
          promotedBy: session.user.id,
          promotionDate: promotionDate ? new Date(promotionDate) : new Date(),
          notes: notes || `Passage de ${user.belt?.name || 'aucune'} à ${newBelt.name}`,
        },
        include: {
          belt: {
            select: { id: true, name: true, color: true, order: true },
          },
        },
      }),
    ])

    logWarning('PATCH /api/admin/users/[id]/belt', 'Ceinture assignée', {
      adminId: session.user.id,
      userId: id,
      oldBeltId: user.beltId,
      newBeltId: beltId,
      oldBeltName: user.belt?.name,
      newBeltName: newBelt.name,
    })

    return NextResponse.json({
      success: true,
      message: `Ceinture ${newBelt.name} assignée avec succès`,
      data: {
        user: updatedUser,
        historyEntry,
      },
    })
  } catch (error) {
    logError('PATCH /api/admin/users/[id]/belt', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

export const GET = withRateLimit(getHandler, { method: 'GET', max: 50 })
export const PATCH = withRateLimit(patchHandler, { method: 'PATCH', max: 20 })

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'

// GET /api/admin/users - Liste des utilisateurs avec leur ceinture
async function getHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR')) {
      logWarning('GET /api/admin/users', 'Accès non autorisé', {
        userId: session?.user?.id,
        role: session?.user?.role,
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const beltId = searchParams.get('beltId') || undefined

    const users = await prisma.user.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          } : {},
          beltId ? { beltId } : {},
        ],
      },
      include: {
        belt: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    logError('GET /api/admin/users', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// PATCH /api/admin/users - Mettre à jour un utilisateur (assigner ceinture)
async function patchHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR')) {
      logWarning('PATCH /api/admin/users', 'Accès non autorisé', {
        userId: session?.user?.id,
        role: session?.user?.role,
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const body = await request.json()
    const { userId, beltId, role } = body

    if (!userId) {
      return createErrorResponse('BAD_REQUEST', 400, 'userId est requis')
    }

    // Vérifier que l'utilisateur existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userExists) {
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

    const updateData: any = {}
    if (beltId !== undefined) updateData.beltId = beltId || null
    if (role && session.user.role === 'ADMIN') updateData.role = role

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        belt: {
          select: { id: true, name: true, color: true },
        },
      },
    })

    logWarning('PATCH /api/admin/users', 'Utilisateur mis à jour', {
      adminId: session.user.id,
      userId,
      changes: updateData,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    logError('PATCH /api/admin/users', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })
export const PATCH = withRateLimit(patchHandler, { method: 'PATCH', max: 50 })

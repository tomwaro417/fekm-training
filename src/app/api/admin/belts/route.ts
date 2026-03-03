import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError } from '@/lib/error-handler'

// GET /api/admin/belts - Liste toutes les ceintures (admin)
async function getHandler(request: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const belts = await prisma.belt.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { modules: true, users: true },
        },
      },
    })

    return NextResponse.json(belts)
  } catch (error) {
    logError('GET /api/admin/belts', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// POST /api/admin/belts - Crée une nouvelle ceinture
async function postHandler(request: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()
    const { name, color, order, description } = body

    if (!name || !color || order === undefined) {
      return createErrorResponse('BAD_REQUEST', 400, {
        message: 'Nom, couleur et ordre sont requis'
      })
    }

    const belt = await prisma.belt.create({
      data: {
        name,
        color,
        order: parseInt(order),
        description,
      },
    })

    return NextResponse.json(belt, { status: 201 })
  } catch (error) {
    logError('POST /api/admin/belts', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })
export const POST = withRateLimit(postHandler, { method: 'POST', max: 20 })

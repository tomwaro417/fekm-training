import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError } from '@/lib/error-handler'

// GET /api/admin/stats - Statistiques du dashboard
async function getHandler(request: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const [beltsCount, modulesCount, techniquesCount, usersCount, adminsCount, instructorsCount] = await Promise.all([
      prisma.belt.count(),
      prisma.module.count(),
      prisma.technique.count(),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
    ])

    return NextResponse.json({
      belts: beltsCount,
      modules: modulesCount,
      techniques: techniquesCount,
      users: usersCount,
      admins: adminsCount,
      instructors: instructorsCount,
    })
  } catch (error) {
    logError('GET /api/admin/stats', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })

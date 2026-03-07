import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'

// GET /api/instructor/students - Liste des élèves avec progression
async function getHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN')) {
      logWarning('GET /api/instructor/students', 'Accès non autorisé', {
        userId: session?.user?.id,
        role: session?.user?.role,
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const beltId = searchParams.get('beltId') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Récupérer les élèves (STUDENT uniquement)
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
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
        progress: {
          select: {
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    // Calculer les stats pour chaque élève
    const studentsWithStats = students.map((student) => {
      const totalTechniques = student.progress.length
      const acquired = student.progress.filter((p) => p.level === 'ACQUIS' || p.level === 'MAITRISE').length
      const inProgress = student.progress.filter((p) => p.level === 'EN_COURS_DAPPRENTISSAGE').length
      const globalProgress = totalTechniques > 0 ? Math.round((acquired / totalTechniques) * 100) : 0

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        belt: student.belt,
        createdAt: student.createdAt,
        stats: {
          totalTechniques,
          acquired,
          inProgress,
          globalProgress,
        },
      }
    })

    // Compter le total
    const total = await prisma.user.count({
      where: {
        role: 'STUDENT',
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
    })

    return NextResponse.json({
      students: studentsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logError('GET /api/instructor/students', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

export const GET = withRateLimit(getHandler, { method: 'GET', max: 30 })

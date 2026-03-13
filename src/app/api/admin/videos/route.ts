import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'
import { z } from 'zod'

// ============================================
// Schémas de validation
// ============================================

const querySchema = z.object({
  page: z.string().optional().transform(v => parseInt(v || '1')),
  limit: z.string().optional().transform(v => parseInt(v || '20')),
  search: z.string().optional(),
  status: z.enum(['PROCESSING', 'READY', 'ERROR']).optional(),
  unlinked: z.string().optional().transform(v => v === 'true'),
})

// ============================================
// GET /api/admin/videos - Liste toutes les vidéos
// ============================================
async function getHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR')) {
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { searchParams } = new URL(request.url)
    
    const validation = querySchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      unlinked: searchParams.get('unlinked') || undefined,
    })

    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 400, validation.error.issues)
    }

    const { page, limit, search, status, unlinked } = validation.data
    const skip = (page - 1) * limit

    // Construction du where
    const where: any = {}
    
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    // Requête avec pagination
    const [videos, totalCount] = await Promise.all([
      prisma.videoAsset.findMany({
        where,
        include: {
          techniqueLinks: {
            include: {
              technique: {
                select: {
                  id: true,
                  name: true,
                  module: {
                    select: {
                      code: true,
                      belt: {
                        select: {
                          name: true,
                          color: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          uploadedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.videoAsset.count({ where }),
    ])

    // Filtrer les vidéos non liées si demandé
    let filteredVideos = videos
    if (unlinked) {
      filteredVideos = videos.filter(v => v.techniqueLinks.length === 0)
    }

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        videos: filteredVideos.map(video => ({
          id: video.id,
          filename: video.filename,
          title: video.title,
          description: video.description,
          duration: video.duration,
          size: video.size,
          createdAt: video.createdAt,
          status: video.status,
          thumbnailUrl: video.thumbnailPath,
          tags: video.tags || [],
          technique: video.techniqueLinks[0]?.technique || null,
          uploadedBy: video.uploadedBy || { name: 'Inconnu' },
          viewCount: video.viewCount || 0,
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    logError('GET /api/admin/videos', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })

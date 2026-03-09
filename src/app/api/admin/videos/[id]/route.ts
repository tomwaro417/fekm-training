import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { z } from 'zod'

// ============================================
// Schémas de validation
// ============================================

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
})

// ============================================
// GET /api/admin/videos/[id] - Détail d'une vidéo
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR')) {
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { id } = await params

    const video = await prisma.videoAsset.findUnique({
      where: { id },
      include: {
        techniqueLinks: {
          include: {
            technique: {
              select: {
                id: true,
                name: true,
                category: true,
                module: {
                  select: {
                    code: true,
                    name: true,
                    belt: {
                      select: {
                        id: true,
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
    })

    if (!video) {
      return createErrorResponse('NOT_FOUND', 404, 'Vidéo non trouvée')
    }

    return NextResponse.json({
      success: true,
      data: {
        video: {
          id: video.id,
          filename: video.filename,
          originalName: video.originalName,
          title: video.title,
          description: video.description,
          duration: video.duration,
          size: video.size,
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
          type: video.techniqueLinks[0]?.type || 'COACH',
          status: video.status,
          thumbnailUrl: video.thumbnailPath,
          tags: video.tags || [],
          technique: video.techniqueLinks[0]?.technique || null,
          uploadedBy: video.uploadedBy || { name: 'Inconnu' },
          viewCount: video.viewCount || 0,
        },
      },
    })
  } catch (error) {
    logError('GET /api/admin/videos/[id]', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// ============================================
// PATCH /api/admin/videos/[id] - Modifier une vidéo
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { id } = await params

    // Vérifier que la vidéo existe
    const existingVideo = await prisma.videoAsset.findUnique({
      where: { id },
    })

    if (!existingVideo) {
      return createErrorResponse('NOT_FOUND', 404, 'Vidéo non trouvée')
    }

    // Parser et valider le body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createErrorResponse('BAD_REQUEST', 400, 'JSON invalide')
    }

    const validation = updateSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 400, validation.error.issues)
    }

    const { title, description, tags } = validation.data

    // Mettre à jour la vidéo
    const updatedVideo = await prisma.videoAsset.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
      },
      include: {
        techniqueLinks: {
          include: {
            technique: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        uploadedBy: {
          select: {
            name: true,
          },
        },
      },
    })

    logWarning('PATCH /api/admin/videos/[id]', 'Vidéo modifiée', {
      userId: session.user.id,
      videoId: id,
      changes: validation.data,
    })

    return NextResponse.json({
      success: true,
      message: 'Vidéo modifiée avec succès',
      data: {
        video: {
          id: updatedVideo.id,
          filename: updatedVideo.filename,
          title: updatedVideo.title,
          description: updatedVideo.description,
          tags: updatedVideo.tags || [],
          technique: updatedVideo.techniqueLinks[0]?.technique || null,
        },
      },
    })
  } catch (error) {
    logError('PATCH /api/admin/videos/[id]', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// ============================================
// DELETE /api/admin/videos/[id] - Supprimer une vidéo
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { id } = await params

    // Vérifier que la vidéo existe
    const video = await prisma.videoAsset.findUnique({
      where: { id },
      include: {
        techniqueLinks: true,
      },
    })

    if (!video) {
      return createErrorResponse('NOT_FOUND', 404, 'Vidéo non trouvée')
    }

    // Supprimer les liens avec les techniques
    if (video.techniqueLinks.length > 0) {
      await prisma.techniqueVideoLink.deleteMany({
        where: { videoId: id },
      })
    }

    // Supprimer le fichier physique
    try {
      const filepath = join(process.cwd(), video.path)
      await unlink(filepath)
    } catch (fileError) {
      // Log mais ne pas bloquer si le fichier n'existe pas déjà
      logWarning('DELETE /api/admin/videos/[id]', 'Fichier non trouvé ou déjà supprimé', {
        videoId: id,
        path: video.path,
        error: fileError,
      })
    }

    // Supprimer l'entrée en base
    await prisma.videoAsset.delete({
      where: { id },
    })

    logWarning('DELETE /api/admin/videos/[id]', 'Vidéo supprimée', {
      userId: session.user.id,
      videoId: id,
      filename: video.filename,
    })

    return NextResponse.json({
      success: true,
      message: 'Vidéo supprimée avec succès',
    })
  } catch (error) {
    logError('DELETE /api/admin/videos/[id]', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'
import { z } from 'zod'

// ============================================
// Schémas de validation
// ============================================

const linkSchema = z.object({
  techniqueId: z.string().uuid('ID technique invalide'),
})

// ============================================
// POST /api/admin/videos/[id]/link - Lier une vidéo à une technique
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { id: videoId } = await params

    // Vérifier que la vidéo existe
    const video = await prisma.videoAsset.findUnique({
      where: { id: videoId },
      include: {
        techniqueLinks: true,
      },
    })

    if (!video) {
      return createErrorResponse('NOT_FOUND', 404, 'Vidéo non trouvée')
    }

    // Parser et valider le body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return createErrorResponse('BAD_REQUEST', 400, 'JSON invalide')
    }

    const validation = linkSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 400, validation.error.issues)
    }

    const { techniqueId } = validation.data

    // Vérifier que la technique existe
    const technique = await prisma.technique.findUnique({
      where: { id: techniqueId },
    })

    if (!technique) {
      return createErrorResponse('NOT_FOUND', 404, 'Technique non trouvée')
    }

    // Vérifier si la vidéo est déjà liée à cette technique
    const existingLink = video.techniqueLinks.find(
      link => link.techniqueId === techniqueId
    )

    if (existingLink) {
      return createErrorResponse('CONFLICT', 409, 'Cette vidéo est déjà liée à cette technique')
    }

    // Déterminer l'ordre pour cette technique
    const existingLinks = await prisma.techniqueVideoLink.count({
      where: { techniqueId },
    })

    // Créer le lien
    const link = await prisma.techniqueVideoLink.create({
      data: {
        videoId,
        techniqueId,
        order: existingLinks,
      },
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
        video: {
          select: {
            id: true,
            filename: true,
            title: true,
          },
        },
      },
    })

    logWarning('POST /api/admin/videos/[id]/link', 'Vidéo liée à une technique', {
      userId: session.user.id,
      videoId,
      techniqueId,
      type,
    })

    return NextResponse.json({
      success: true,
      message: 'Vidéo liée avec succès',
      data: {
        link,
      },
    }, { status: 201 })
  } catch (error) {
    logError('POST /api/admin/videos/[id]/link', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// ============================================
// DELETE /api/admin/videos/[id]/link - Délier une vidéo d'une technique
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

    const { id: videoId } = await params

    // Vérifier que la vidéo existe
    const video = await prisma.videoAsset.findUnique({
      where: { id: videoId },
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
      },
    })

    if (!video) {
      return createErrorResponse('NOT_FOUND', 404, 'Vidéo non trouvée')
    }

    // Vérifier s'il y a des liens à supprimer
    if (video.techniqueLinks.length === 0) {
      return createErrorResponse('BAD_REQUEST', 400, 'Cette vidéo n\'est liée à aucune technique')
    }

    // Supprimer tous les liens (ou on pourrait filtrer par techniqueId si fourni)
    const { searchParams } = new URL(request.url)
    const techniqueId = searchParams.get('techniqueId')

    if (techniqueId) {
      // Supprimer un lien spécifique
      const linkToDelete = video.techniqueLinks.find(
        link => link.techniqueId === techniqueId
      )

      if (!linkToDelete) {
        return createErrorResponse('NOT_FOUND', 404, 'Lien non trouvé')
      }

      await prisma.techniqueVideoLink.delete({
        where: { id: linkToDelete.id },
      })

      logWarning('DELETE /api/admin/videos/[id]/link', 'Vidéo déliée d\'une technique', {
        userId: session.user.id,
        videoId,
        techniqueId,
      })
    } else {
      // Supprimer tous les liens
      await prisma.techniqueVideoLink.deleteMany({
        where: { videoId },
      })

      logWarning('DELETE /api/admin/videos/[id]/link', 'Vidéo déliée de toutes les techniques', {
        userId: session.user.id,
        videoId,
        techniquesCount: video.techniqueLinks.length,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Vidéo déliée avec succès',
    })
  } catch (error) {
    logError('DELETE /api/admin/videos/[id]/link', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// ============================================
// GET /api/admin/videos/[id]/link - Liste des techniques liées
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR')) {
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const links = await prisma.techniqueVideoLink.findMany({
      where: { videoId },
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
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        links,
        count: links.length,
      },
    })
  } catch (error) {
    logError('GET /api/admin/videos/[id]/link', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteVideoAsset } from '@/lib/video-delete'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'

// ============================================
// DELETE /api/videos/[id] - Supprimer une vidéo
//
// Matrice des droits :
// - ADMIN / INSTRUCTOR : toutes les vidéos
// - STUDENT : uniquement ses propres vidéos (uploadedById)
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { id } = await params

    const video = await prisma.videoAsset.findUnique({
      where: { id },
      select: { id: true, uploadedById: true, filename: true },
    })

    if (!video) {
      return createErrorResponse('NOT_FOUND', 404, 'Vidéo non trouvée')
    }

    const role = session.user.role
    const isPrivileged = role === 'ADMIN' || role === 'INSTRUCTOR'

    // Propriétaire = uploader OU élève lié à cette vidéo via UserTechniqueVideo
    // (certaines anciennes vidéos élèves ont uploadedById NULL)
    const isOwner =
      video.uploadedById === session.user.id ||
      (await prisma.userTechniqueVideo.count({
        where: { videoId: id, userId: session.user.id },
      })) > 0

    if (!isPrivileged && !isOwner) {
      return createErrorResponse(
        'FORBIDDEN',
        403,
        'Vous ne pouvez supprimer que vos propres vidéos'
      )
    }

    await deleteVideoAsset(id)

    logWarning('DELETE /api/videos/[id]', 'Vidéo supprimée', {
      userId: session.user.id,
      role,
      videoId: id,
      filename: video.filename,
    })

    return NextResponse.json({
      success: true,
      message: 'Vidéo supprimée avec succès',
    })
  } catch (error) {
    logError('DELETE /api/videos/[id]', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

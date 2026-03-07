import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createErrorResponse, logWarning } from '@/lib/error-handler'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { stat } from 'fs/promises'

// GET /api/videos/[id]/download - Télécharger une vidéo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      logWarning('GET /api/videos/[id]/download', 'Accès non autorisé')
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { id } = await params

    // Récupérer la vidéo
    const video = await prisma.videoAsset.findUnique({
      where: { id },
    })

    if (!video) {
      return createErrorResponse('NOT_FOUND', 404, 'Vidéo non trouvée')
    }

    // Construire le chemin complet
    const filepath = join(process.cwd(), video.path)

    // Vérifier que le fichier existe
    try {
      await stat(filepath)
    } catch {
      return createErrorResponse('NOT_FOUND', 404, 'Fichier non trouvé')
    }

    // Lire le fichier
    const fileBuffer = await readFile(filepath)

    // Retourner le fichier avec les bons headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': video.mimeType,
        'Content-Disposition': `attachment; filename="${video.originalName || video.filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

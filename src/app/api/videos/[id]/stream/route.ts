import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createErrorResponse, logWarning } from '@/lib/error-handler'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { stat } from 'fs/promises'

// GET /api/videos/[id]/stream - Streaming vidéo avec range requests
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      logWarning('GET /api/videos/[id]/stream', 'Accès non autorisé')
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const range = request.headers.get('range')

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
    let stats
    try {
      stats = await stat(filepath)
    } catch {
      return createErrorResponse('NOT_FOUND', 404, 'Fichier non trouvé')
    }

    const fileSize = stats.size

    // Si pas de range, envoyer tout le fichier
    if (!range) {
      const fileBuffer = await readFile(filepath)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': video.mimeType,
          'Content-Length': fileSize.toString(),
          'Accept-Ranges': 'bytes',
        },
      })
    }

    // Parser le range (format: bytes=start-end)
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunkSize = end - start + 1

    // Lire seulement la portion demandée
    const file = await readFile(filepath)
    const chunk = file.slice(start, end + 1)

    return new NextResponse(chunk, {
      status: 206,
      headers: {
        'Content-Type': video.mimeType,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunkSize.toString(),
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (error) {
    console.error('Erreur lors du streaming:', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'

// POST /api/admin/videos/upload - Upload d'une vidéo (coach ou démo)
async function postHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR')) {
      logWarning('POST /api/admin/videos/upload', 'Accès non autorisé', {
        userId: session?.user?.id,
        role: session?.user?.role,
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const techniqueId = formData.get('techniqueId') as string
    const type = formData.get('type') as 'COACH' | 'DEMONSTRATION'

    if (!file || !techniqueId || !type) {
      return createErrorResponse('BAD_REQUEST', 400, 'Fichier, techniqueId et type sont requis')
    }

    // Vérifier que la technique existe
    const technique = await prisma.technique.findUnique({
      where: { id: techniqueId },
    })

    if (!technique) {
      return createErrorResponse('NOT_FOUND', 404, 'Technique non trouvée')
    }

    // Vérifier le type de fichier
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      return createErrorResponse('BAD_REQUEST', 400, 'Type de fichier non supporté. Utilisez MP4, MOV, AVI ou WebM')
    }

    // Vérifier la taille (max 500MB)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      return createErrorResponse('BAD_REQUEST', 400, 'Fichier trop volumineux (max 500MB)')
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = join(process.cwd(), 'uploads', 'videos')
    await mkdir(uploadDir, { recursive: true })

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop() || 'mp4'
    const filename = `${randomUUID()}.${fileExtension}`
    const filepath = join(uploadDir, filename)

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    // Créer l'entrée dans VideoAsset
    const videoAsset = await prisma.videoAsset.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: `/uploads/videos/${filename}`,
      },
    })

    // Créer le lien avec la technique
    const techniqueVideoLink = await prisma.techniqueVideoLink.create({
      data: {
        techniqueId,
        videoId: videoAsset.id,
        type,
        order: 0,
      },
      include: {
        video: true,
      },
    })

    logWarning('POST /api/admin/videos/upload', 'Vidéo uploadée', {
      userId: session.user.id,
      techniqueId,
      videoId: videoAsset.id,
      type,
      filename: file.name,
    })

    return NextResponse.json({
      success: true,
      video: techniqueVideoLink,
    })
  } catch (error) {
    logError('POST /api/admin/videos/upload', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Configurer la route pour accepter les gros fichiers
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = withRateLimit(postHandler, { method: 'POST', max: 10 })

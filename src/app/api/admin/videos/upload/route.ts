import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'
import { writeFile, stat, access } from 'fs/promises'
import { join } from 'path'
import { mkdir } from 'fs/promises'
import { constants } from 'fs'
import { randomUUID } from 'crypto'
import { z } from 'zod'

// ============================================
// Configuration
// ============================================

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // MOV
  'video/x-msvideo', // AVI
  'video/webm',
  'video/x-matroska', // MKV
]

const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv']

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'videos')

// ============================================
// Schémas de validation
// ============================================

const videoMetadataSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200, 'Titre trop long'),
  description: z.string().max(2000, 'Description trop longue').optional(),
  techniqueId: z.string().uuid('ID technique invalide').optional(),
  beltId: z.string().uuid('ID ceinture invalide').optional(),
  moduleId: z.string().uuid('ID module invalide').optional(),
  type: z.enum(['COACH', 'DEMONSTRATION']).default('COACH'),
  isPublic: z.boolean().default(false),
  tags: z.string().optional(), // JSON stringifié
})

// ============================================
// Helpers
// ============================================

/**
 * Vérifie si le type de fichier est autorisé
 */
function isValidVideoType(mimeType: string, filename: string): boolean {
  // Vérifier le MIME type
  if (!ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    // Fallback sur l'extension
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return false
    }
  }
  return true
}

/**
 * Génère un nom de fichier sécurisé
 */
function generateSecureFilename(originalName: string): string {
  const ext = originalName.slice(originalName.lastIndexOf('.')).toLowerCase()
  const uuid = randomUUID()
  return `${uuid}${ext}`
}

/**
 * Parse les tags JSON
 */
function parseTags(tagsJson: string | undefined): string[] {
  if (!tagsJson) return []
  try {
    const parsed = JSON.parse(tagsJson)
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is string => typeof t === 'string')
    }
  } catch {
    // Si ce n'est pas du JSON, traiter comme une chaîne simple
    return tagsJson.split(',').map(t => t.trim()).filter(Boolean)
  }
  return []
}

/**
 * Formate la taille du fichier pour l'affichage
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ============================================
// Handlers
// ============================================

// POST /api/admin/videos/upload - Upload d'une vidéo
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

    // Parser le FormData
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      return createErrorResponse('BAD_REQUEST', 400, 'Format de requête invalide')
    }

    const file = formData.get('file') as File

    // Validation du fichier
    if (!file) {
      return createErrorResponse('BAD_REQUEST', 400, 'Aucun fichier fourni')
    }

    // Vérifier le type de fichier
    if (!isValidVideoType(file.type, file.name)) {
      return createErrorResponse(
        'BAD_REQUEST',
        400,
        `Type de fichier non supporté. Formats acceptés: ${ALLOWED_EXTENSIONS.join(', ')}`
      )
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return createErrorResponse(
        'BAD_REQUEST',
        400,
        `Fichier trop volumineux. Taille maximum: ${formatFileSize(MAX_FILE_SIZE)}`
      )
    }

    // Validation des métadonnées
    const metadataValidation = videoMetadataSchema.safeParse({
      title: formData.get('title') || file.name,
      description: formData.get('description') || undefined,
      techniqueId: formData.get('techniqueId') || undefined,
      beltId: formData.get('beltId') || undefined,
      moduleId: formData.get('moduleId') || undefined,
      type: formData.get('type') || 'COACH',
      isPublic: formData.get('isPublic') === 'true',
      tags: formData.get('tags') || undefined,
    })

    if (!metadataValidation.success) {
      return createErrorResponse('VALIDATION_ERROR', 400, metadataValidation.error.issues)
    }

    const metadata = metadataValidation.data

    // Vérifier les relations si fournies
    if (metadata.techniqueId) {
      const technique = await prisma.technique.findUnique({
        where: { id: metadata.techniqueId },
      })
      if (!technique) {
        return createErrorResponse('NOT_FOUND', 404, 'Technique non trouvée')
      }
    }

    if (metadata.beltId) {
      const belt = await prisma.belt.findUnique({
        where: { id: metadata.beltId },
      })
      if (!belt) {
        return createErrorResponse('NOT_FOUND', 404, 'Ceinture non trouvée')
      }
    }

    if (metadata.moduleId) {
      const module = await prisma.module.findUnique({
        where: { id: metadata.moduleId },
      })
      if (!module) {
        return createErrorResponse('NOT_FOUND', 404, 'Module non trouvé')
      }
    }

    // Créer le dossier uploads s'il n'existe pas
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Générer un nom de fichier unique
    const filename = generateSecureFilename(file.name)
    const filepath = join(UPLOAD_DIR, filename)

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    if (buffer.length === 0) {
      throw new Error('Fichier vide reçu')
    }
    
    await writeFile(filepath, buffer)
    
    // Vérifier que le fichier a bien été écrit
    try {
      const { access, constants } = await import('fs/promises')
      await access(filepath, constants.F_OK)
      const stats = await stat(filepath)
      if (stats.size !== file.size) {
        throw new Error(`Taille du fichier incohérence: attendu ${file.size}, écrit ${stats.size}`)
      }
    } catch (verifyError) {
      throw new Error(`Erreur vérification fichier: ${verifyError}`)
    }

    // Créer l'entrée dans VideoAsset
    const videoAsset = await prisma.videoAsset.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: `uploads/videos/${filename}`,
        // La durée sera extraite plus tard par un job de traitement
      },
    })

    // Créer le lien avec la technique si techniqueId est fourni
    let techniqueVideoLink = null
    if (metadata.techniqueId) {
      // Déterminer l'ordre pour cette technique
      const existingLinks = await prisma.techniqueVideoLink.count({
        where: { techniqueId: metadata.techniqueId },
      })

      techniqueVideoLink = await prisma.techniqueVideoLink.create({
        data: {
          techniqueId: metadata.techniqueId,
          videoId: videoAsset.id,
          type: metadata.type,
          order: existingLinks,
        },
        include: {
          technique: {
            select: { id: true, name: true },
          },
        },
      })
    }

    // TODO: Créer une entrée VideoMetadata si nécessaire
    // Cela pourrait être une table séparée pour les métadonnées enrichies

    logWarning('POST /api/admin/videos/upload', 'Vidéo uploadée', {
      userId: session.user.id,
      videoId: videoAsset.id,
      techniqueId: metadata.techniqueId,
      type: metadata.type,
      filename: file.name,
      size: formatFileSize(file.size),
    })

    return NextResponse.json({
      success: true,
      message: 'Vidéo uploadée avec succès',
      data: {
        video: {
          id: videoAsset.id,
          filename: videoAsset.filename,
          originalName: videoAsset.originalName,
          mimeType: videoAsset.mimeType,
          size: videoAsset.size,
          sizeFormatted: formatFileSize(videoAsset.size),
          path: videoAsset.path,
          createdAt: videoAsset.createdAt,
        },
        techniqueLink: techniqueVideoLink,
        metadata: {
          title: metadata.title,
          description: metadata.description,
          type: metadata.type,
          isPublic: metadata.isPublic,
          tags: parseTags(metadata.tags),
        },
      },
    }, { status: 201 })

  } catch (error) {
    logError('POST /api/admin/videos/upload', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// GET /api/admin/videos/upload - Liste des vidéos uploadées
async function getHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR')) {
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined

    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [videos, totalCount] = await Promise.all([
      prisma.videoAsset.findMany({
        where,
        include: {
          techniqueLinks: {
            include: {
              technique: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.videoAsset.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        videos,
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
    logError('GET /api/admin/videos/upload', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Configurer la route pour accepter les gros fichiers
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = withRateLimit(postHandler, { method: 'POST', max: 10 })
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })

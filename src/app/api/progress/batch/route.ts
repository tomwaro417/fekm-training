import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'
import { z } from 'zod'

// Schéma pour une entrée de progression individuelle
const progressItemSchema = z.object({
  videoId: z.string().uuid(),
  progress: z.number().min(0).max(100),
  completed: z.boolean(),
  watchedDuration: z.number().min(0).optional(),
  totalDuration: z.number().min(0).optional(),
  lastPosition: z.number().min(0).optional(),
})

// Schéma de validation pour la mise à jour batch
const batchProgressSchema = z.object({
  items: z.array(progressItemSchema).min(1).max(100),
  syncTimestamp: z.string().datetime().optional(),
})

// POST /api/progress/batch - Mise à jour batch de la progression
async function postHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      logWarning('POST /api/progress/batch', 'Accès non autorisé')
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    // Validation des données
    const body = await request.json()
    const validation = batchProgressSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse('BAD_REQUEST', 400, 'Données invalides', validation.error)
    }

    const { items, syncTimestamp } = validation.data
    const syncTime = syncTimestamp ? new Date(syncTimestamp) : new Date()
    const userId = session.user.id

    // Traiter les mises à jour en batch
    const results = await prisma.$transaction(async (tx) => {
      const upsertResults = []

      for (const item of items) {
        // Upsert de la progression
        const progress = await tx.userTechniqueProgress.upsert({
          where: {
            userId_techniqueId: {
              userId,
              techniqueId: item.videoId,
            },
          },
          update: {
            level: item.completed ? 'ACQUIS' : 'EN_COURS_DAPPRENTISSAGE',
            notes: `Progression: ${item.progress}%, Durée: ${item.watchedDuration || 0}s`,
            lastUpdated: syncTime,
          },
          create: {
            userId,
            techniqueId: item.videoId,
            level: item.completed ? 'ACQUIS' : 'EN_COURS_DAPPRENTISSAGE',
            notes: `Progression: ${item.progress}%, Durée: ${item.watchedDuration || 0}s`,
            createdAt: syncTime,
            lastUpdated: syncTime,
          },
        })

        upsertResults.push({
          videoId: item.videoId,
          progressId: progress.id,
          status: 'updated',
        })
      }

      return upsertResults
    })

    // Calculer les statistiques
    const completedCount = items.filter((i) => i.completed).length
    const inProgressCount = items.length - completedCount

    return NextResponse.json({
      success: true,
      message: 'Progression mise à jour avec succès',
      data: {
        processed: results.length,
        completed: completedCount,
        inProgress: inProgressCount,
        items: results,
        syncTimestamp: syncTime.toISOString(),
      },
    })
  } catch (error) {
    logError('POST /api/progress/batch', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

export const POST = withRateLimit(postHandler, { method: 'POST', max: 50 })

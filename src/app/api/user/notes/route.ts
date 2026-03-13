import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'
import { z } from 'zod'

// Schémas de validation
const createNoteSchema = z.object({
  techniqueId: z.string().cuid(),
  content: z.string().min(1).max(5000),
})

const updateNoteSchema = z.object({
  id: z.string().cuid(),
  content: z.string().min(1).max(5000),
})

const deleteNoteSchema = z.object({
  id: z.string().cuid(),
})

// GET /api/user/notes - Récupérer toutes les notes de l'utilisateur connecté
async function getHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      logWarning('GET /api/user/notes', 'Tentative d\'accès non autorisé', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const userId = session.user.id

    const notes = await prisma.userNote.findMany({
      where: { userId },
      include: {
        technique: {
          select: {
            id: true,
            name: true,
            category: true,
            module: {
              select: {
                id: true,
                name: true,
                code: true,
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
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({
      notes,
      count: notes.length,
    })

  } catch (error) {
    logError('GET /api/user/notes', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// POST /api/user/notes - Créer une nouvelle note
async function postHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      logWarning('POST /api/user/notes', 'Tentative d\'accès non autorisé', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const userId = session.user.id

    // Parsing et validation du body
    let body
    try {
      body = await request.json()
    } catch {
      return createErrorResponse('VALIDATION_ERROR', 400, 'Body JSON invalide')
    }

    const validationResult = createNoteSchema.safeParse(body)
    if (!validationResult.success) {
      return createErrorResponse('VALIDATION_ERROR', 400, 'Données invalides', validationResult.error)
    }

    const { techniqueId, content } = validationResult.data

    // Vérifier que la technique existe
    const technique = await prisma.technique.findUnique({
      where: { id: techniqueId },
      select: { id: true },
    })

    if (!technique) {
      return createErrorResponse('NOT_FOUND', 404, 'Technique non trouvée')
    }

    // Vérifier si une note existe déjà pour cette technique
    const existingNote = await prisma.userNote.findUnique({
      where: {
        userId_techniqueId: {
          userId,
          techniqueId,
        },
      },
    })

    if (existingNote) {
      return createErrorResponse('VALIDATION_ERROR', 409, 'Une note existe déjà pour cette technique. Utilisez PATCH pour la modifier.')
    }

    // Créer la note
    const note = await prisma.userNote.create({
      data: {
        userId,
        techniqueId,
        content,
      },
      include: {
        technique: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      note,
      message: 'Note créée avec succès',
    }, { status: 201 })

  } catch (error) {
    logError('POST /api/user/notes', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// PATCH /api/user/notes - Modifier une note existante
async function patchHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      logWarning('PATCH /api/user/notes', 'Tentative d\'accès non autorisé', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const userId = session.user.id

    // Parsing et validation du body
    let body
    try {
      body = await request.json()
    } catch {
      return createErrorResponse('VALIDATION_ERROR', 400, 'Body JSON invalide')
    }

    const validationResult = updateNoteSchema.safeParse(body)
    if (!validationResult.success) {
      return createErrorResponse('VALIDATION_ERROR', 400, 'Données invalides', validationResult.error)
    }

    const { id, content } = validationResult.data

    // Vérifier que la note existe et appartient à l'utilisateur
    const existingNote = await prisma.userNote.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existingNote) {
      return createErrorResponse('NOT_FOUND', 404, 'Note non trouvée ou vous n\'avez pas les droits pour la modifier')
    }

    // Mettre à jour la note
    const updatedNote = await prisma.userNote.update({
      where: { id },
      data: { content },
      include: {
        technique: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      note: updatedNote,
      message: 'Note mise à jour avec succès',
    })

  } catch (error) {
    logError('PATCH /api/user/notes', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// DELETE /api/user/notes - Supprimer une note
async function deleteHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      logWarning('DELETE /api/user/notes', 'Tentative d\'accès non autorisé', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const userId = session.user.id

    // Extraction de l'ID depuis les search params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return createErrorResponse('VALIDATION_ERROR', 400, 'L\'identifiant de la note est requis')
    }

    const validationResult = deleteNoteSchema.safeParse({ id })
    if (!validationResult.success) {
      return createErrorResponse('VALIDATION_ERROR', 400, 'Identifiant invalide')
    }

    // Vérifier que la note existe et appartient à l'utilisateur
    const existingNote = await prisma.userNote.findFirst({
      where: {
        id: validationResult.data.id,
        userId,
      },
    })

    if (!existingNote) {
      return createErrorResponse('NOT_FOUND', 404, 'Note non trouvée ou vous n\'avez pas les droits pour la supprimer')
    }

    // Supprimer la note
    await prisma.userNote.delete({
      where: { id: validationResult.data.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Note supprimée avec succès',
    })

  } catch (error) {
    logError('DELETE /api/user/notes', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Exports avec rate limiting
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })
export const POST = withRateLimit(postHandler, { method: 'POST', max: 30 })
export const PATCH = withRateLimit(patchHandler, { method: 'PATCH', max: 30 })
export const DELETE = withRateLimit(deleteHandler, { method: 'DELETE', max: 30 })

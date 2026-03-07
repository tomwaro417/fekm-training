import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'
import { createErrorResponse, logError, logWarning } from '@/lib/error-handler'
import { sendWelcomeEmail } from '@/lib/email'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import type { Prisma } from '@prisma/client'

// ============================================
// Schémas de validation Zod
// ============================================

const createUserSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Nom trop long'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères').optional(),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).default('STUDENT'),
  beltId: z.string().uuid().optional().nullable(),
  sendWelcomeEmail: z.boolean().default(true),
})

const updateUserSchema = z.object({
  userId: z.string().uuid('ID utilisateur invalide'),
  beltId: z.string().uuid().optional().nullable(),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).optional(),
  name: z.string().min(1).max(100).optional(),
})

const querySchema = z.object({
  search: z.string().optional(),
  beltId: z.string().uuid().optional(),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).optional(),
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(20),
})

// ============================================
// Helpers
// ============================================

/**
 * Génère un mot de passe temporaire sécurisé
 */
function generateTempPassword(length: number = 12): string {
  return randomBytes(length).toString('base64').slice(0, length)
}

/**
 * Hash un mot de passe avec bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Envoie un email de bienvenue à un nouvel utilisateur
 * Utilise le service email configuré (SMTP/SendGrid)
 */
async function sendWelcomeEmailToUser(
  email: string,
  name: string,
  tempPassword: string
): Promise<{ success: boolean; error?: string }> {
  const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`

  const result = await sendWelcomeEmail({
    email,
    name,
    tempPassword,
    loginUrl,
  })

  if (!result.success) {
    logError('sendWelcomeEmailToUser', new Error(result.error || 'Échec envoi email'))
  }

  return result
}

// ============================================
// Handlers
// ============================================

// GET /api/admin/users - Liste des utilisateurs avec pagination et filtres
async function getHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR')) {
      logWarning('GET /api/admin/users', 'Accès non autorisé', {
        userId: session?.user?.id,
        role: session?.user?.role,
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const { searchParams } = new URL(request.url)
    
    // Validation des paramètres de requête
    const queryValidation = querySchema.safeParse({
      search: searchParams.get('search') || undefined,
      beltId: searchParams.get('beltId') || undefined,
      role: searchParams.get('role') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    })

    if (!queryValidation.success) {
      return createErrorResponse('VALIDATION_ERROR', 400, queryValidation.error.issues)
    }

    const { search, beltId, role, page, limit } = queryValidation.data
    const skip = (page - 1) * limit

    // Construction de la clause WHERE
    const where: Prisma.UserWhereInput = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        beltId ? { beltId } : {},
        role ? { role } : {},
      ],
    }

    // Récupération des utilisateurs avec pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          belt: {
            select: { id: true, name: true, color: true, order: true },
          },
          _count: {
            select: {
              progress: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        users,
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
    logError('GET /api/admin/users', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// POST /api/admin/users - Créer un nouvel utilisateur
async function postHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      logWarning('POST /api/admin/users', 'Accès non autorisé - Admin requis', {
        userId: session?.user?.id,
        role: session?.user?.role,
      })
      return createErrorResponse('FORBIDDEN', 403)
    }

    const body = await request.json()

    // Validation des données
    const validation = createUserSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 400, validation.error.issues)
    }

    const { name, email, password, role, beltId, sendWelcomeEmail: shouldSendEmail } = validation.data

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return createErrorResponse('BAD_REQUEST', 400, 'Un utilisateur avec cet email existe déjà')
    }

    // Vérifier que la ceinture existe si fournie
    if (beltId) {
      const beltExists = await prisma.belt.findUnique({
        where: { id: beltId },
      })
      if (!beltExists) {
        return createErrorResponse('NOT_FOUND', 404, 'Ceinture non trouvée')
      }
    }

    // Utiliser le mot de passe fourni ou générer un temporaire
    const tempPassword = password || generateTempPassword()
    const hashedPassword = await hashPassword(tempPassword)

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        beltId: beltId || null,
        password: hashedPassword,
      },
      include: {
        belt: {
          select: { id: true, name: true, color: true },
        },
      },
    })

    // Si une ceinture est assignée, créer l'entrée dans l'historique
    if (beltId) {
      await prisma.beltHistory.create({
        data: {
          userId: newUser.id,
          beltId,
          promotedBy: session.user.id,
          notes: 'Ceinture assignée lors de la création du compte',
        },
      })
    }

    // Envoyer l'email de bienvenue
    let emailResult: { success: boolean; error?: string } | null = null
    if (shouldSendEmail) {
      emailResult = await sendWelcomeEmailToUser(email, name, tempPassword)
      if (!emailResult.success) {
        logWarning('POST /api/admin/users', 'Échec envoi email de bienvenue', {
          userId: newUser.id,
          email: newUser.email,
          error: emailResult.error,
        })
        // On continue quand même, l'utilisateur est créé
      }
    }

    logWarning('POST /api/admin/users', 'Utilisateur créé', {
      adminId: session.user.id,
      newUserId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    })

    return NextResponse.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: newUser,
        tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined,
        emailSent: emailResult?.success ?? false,
        emailPreviewUrl: undefined,
        emailError: emailResult?.error,
      },
    }, { status: 201 })
  } catch (error) {
    logError('POST /api/admin/users', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// PATCH /api/admin/users - Mettre à jour un utilisateur
async function patchHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'INSTRUCTOR')) {
      logWarning('PATCH /api/admin/users', 'Accès non autorisé', {
        userId: session?.user?.id,
        role: session?.user?.role,
      })
      return createErrorResponse('UNAUTHORIZED', 401)
    }

    const body = await request.json()

    // Validation
    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('VALIDATION_ERROR', 400, validation.error.issues)
    }

    const { userId, beltId, role, name } = validation.data

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { belt: true },
    })

    if (!user) {
      return createErrorResponse('NOT_FOUND', 404, 'Utilisateur non trouvé')
    }

    // Seul un admin peut changer le rôle
    if (role && session.user.role !== 'ADMIN') {
      return createErrorResponse('FORBIDDEN', 403, 'Seul un admin peut modifier le rôle')
    }

    // Si beltId est fourni, vérifier qu'il existe
    if (beltId) {
      const beltExists = await prisma.belt.findUnique({
        where: { id: beltId },
      })
      if (!beltExists) {
        return createErrorResponse('NOT_FOUND', 404, 'Ceinture non trouvée')
      }
    }

    const updateData: Prisma.UserUpdateInput = {}
    if (beltId !== undefined) updateData.belt = beltId ? { connect: { id: beltId } } : { disconnect: true }
    if (role && session.user.role === 'ADMIN') updateData.role = role
    if (name) updateData.name = name

    // Si la ceinture change, ajouter à l'historique
    if (beltId !== undefined && beltId !== user.beltId) {
      if (beltId) {
        await prisma.beltHistory.create({
          data: {
            userId,
            beltId,
            promotedBy: session.user.id,
            notes: 'Changement de ceinture',
          },
        })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        belt: {
          select: { id: true, name: true, color: true },
        },
      },
    })

    logWarning('PATCH /api/admin/users', 'Utilisateur mis à jour', {
      adminId: session.user.id,
      userId,
      changes: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: updatedUser,
    })
  } catch (error) {
    logError('PATCH /api/admin/users', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// DELETE /api/admin/users/[id] - Supprimer un utilisateur
async function deleteHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      logWarning('DELETE /api/admin/users', 'Accès non autorisé - Admin requis', {
        userId: session?.user?.id,
        role: session?.user?.role,
      })
      return createErrorResponse('FORBIDDEN', 403)
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return createErrorResponse('BAD_REQUEST', 400, 'ID utilisateur requis')
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return createErrorResponse('NOT_FOUND', 404, 'Utilisateur non trouvé')
    }

    // Empêcher la suppression de son propre compte
    if (userId === session.user.id) {
      return createErrorResponse('BAD_REQUEST', 400, 'Vous ne pouvez pas supprimer votre propre compte')
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    logWarning('DELETE /api/admin/users', 'Utilisateur supprimé', {
      adminId: session.user.id,
      deletedUserId: userId,
      deletedUserEmail: user.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    })
  } catch (error) {
    logError('DELETE /api/admin/users', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })
export const POST = withRateLimit(postHandler, { method: 'POST', max: 20 })
export const PATCH = withRateLimit(patchHandler, { method: 'PATCH', max: 50 })
export const DELETE = withRateLimit(deleteHandler, { method: 'DELETE', max: 20 })

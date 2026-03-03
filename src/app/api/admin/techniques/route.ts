import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { idSchema } from '@/lib/validation'
import { createErrorResponse, handleZodError, logError } from '@/lib/error-handler'
import { ZodError } from 'zod'

// GET /api/admin/techniques - Liste toutes les techniques (admin)
async function getHandler(request: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const beltId = searchParams.get('beltId')
    const moduleId = searchParams.get('moduleId')
    const category = searchParams.get('category')

    // Construction du where de manière conditionnelle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {}
    
    if (moduleId) {
      const validatedModuleId = idSchema.parse(moduleId)
      where.moduleId = validatedModuleId
    }
    
    if (category) {
      where.category = category
    }
    
    if (beltId) {
      const validatedBeltId = idSchema.parse(beltId)
      where.module = { beltId: validatedBeltId }
    }

    const techniques = await prisma.technique.findMany({
      where,
      orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
      include: {
        module: {
          select: { id: true, code: true, name: true, belt: { select: { name: true, color: true } } },
        },
      },
    })

    return NextResponse.json(techniques)
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('GET /api/admin/techniques', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// POST /api/admin/techniques - Crée une nouvelle technique
async function postHandler(request: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()
    const { moduleId, name, category, subCategory, description, instructions, keyPoints, order } = body

    if (!moduleId || !name || !category || order === undefined) {
      return createErrorResponse('BAD_REQUEST', 400, {
        message: 'Module, nom, catégorie et ordre sont requis'
      })
    }

    // Validation de l'ID du module
    const validatedModuleId = idSchema.parse(moduleId)

    const technique = await prisma.technique.create({
      data: {
        moduleId: validatedModuleId,
        name,
        category,
        subCategory,
        description,
        instructions,
        keyPoints: keyPoints || [],
        order: parseInt(order),
      },
    })

    return NextResponse.json(technique, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('POST /api/admin/techniques', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })
export const POST = withRateLimit(postHandler, { method: 'POST', max: 20 })

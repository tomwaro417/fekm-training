import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { idSchema } from '@/lib/validation'
import { createErrorResponse, handleZodError, logError } from '@/lib/error-handler'
import { ZodError } from 'zod'

// GET /api/admin/modules - Liste tous les modules (admin)
async function getHandler(request: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const beltId = searchParams.get('beltId')

    const where: { beltId?: string } = {}
    
    if (beltId) {
      const validatedBeltId = idSchema.parse(beltId)
      where.beltId = validatedBeltId
    }

    const modules = await prisma.module.findMany({
      where,
      orderBy: [{ belt: { order: 'asc' } }, { order: 'asc' }],
      include: {
        belt: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { techniques: true },
        },
      },
    })

    return NextResponse.json(modules)
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('GET /api/admin/modules', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// POST /api/admin/modules - Crée un nouveau module
async function postHandler(request: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()
    const { beltId, code, name, description, order } = body

    if (!beltId || !code || !name || order === undefined) {
      return createErrorResponse('BAD_REQUEST', 400, {
        message: 'Ceinture, code, nom et ordre sont requis'
      })
    }

    // Validation de l'ID de la ceinture
    const validatedBeltId = idSchema.parse(beltId)

    const module = await prisma.module.create({
      data: {
        beltId: validatedBeltId,
        code,
        name,
        description,
        order: parseInt(order),
      },
    })

    return NextResponse.json(module, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('POST /api/admin/modules', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })
export const POST = withRateLimit(postHandler, { method: 'POST', max: 20 })

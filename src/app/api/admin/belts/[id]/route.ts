import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { idSchema } from '@/lib/validation'
import { createErrorResponse, handleZodError, logError } from '@/lib/error-handler'
import { ZodError } from 'zod'

// PUT /api/admin/belts/[id] - Met à jour une ceinture
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const validatedId = idSchema.parse(id)
    
    const body = await request.json()
    const { name, color, order, description } = body

    const belt = await prisma.belt.update({
      where: { id: validatedId },
      data: {
        name,
        color,
        order: order !== undefined ? parseInt(order) : undefined,
        description,
      },
    })

    return NextResponse.json(belt)
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('PUT /api/admin/belts/[id]', error, { params: await params.catch(() => 'unknown') })
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// DELETE /api/admin/belts/[id] - Supprime une ceinture
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const validatedId = idSchema.parse(id)

    await prisma.belt.delete({
      where: { id: validatedId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('DELETE /api/admin/belts/[id]', error, { params: await params.catch(() => 'unknown') })
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting
export const PUT = withRateLimit(putHandler, { method: 'PUT', max: 20 })
export const DELETE = withRateLimit(deleteHandler, { method: 'DELETE', max: 10 })

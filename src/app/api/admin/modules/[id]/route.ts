import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { idSchema } from '@/lib/validation'
import { createErrorResponse, handleZodError, logError } from '@/lib/error-handler'
import { ZodError } from 'zod'

// PUT /api/admin/modules/[id] - Met à jour un module
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
    const { beltId, code, name, description, order } = body

    const data: {
      beltId?: string
      code?: string
      name?: string
      description?: string
      order?: number
    } = {}
    
    if (beltId !== undefined) data.beltId = idSchema.parse(beltId)
    if (code !== undefined) data.code = code
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description
    if (order !== undefined) data.order = parseInt(order)

    const module = await prisma.module.update({
      where: { id: validatedId },
      data,
    })

    return NextResponse.json(module)
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('PUT /api/admin/modules/[id]', error, { params: await params.catch(() => 'unknown') })
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// DELETE /api/admin/modules/[id] - Supprime un module
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const validatedId = idSchema.parse(id)

    await prisma.module.delete({
      where: { id: validatedId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('DELETE /api/admin/modules/[id]', error, { params: await params.catch(() => 'unknown') })
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting
export const PUT = withRateLimit(putHandler, { method: 'PUT', max: 20 })
export const DELETE = withRateLimit(deleteHandler, { method: 'DELETE', max: 10 })

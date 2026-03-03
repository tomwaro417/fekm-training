import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { idSchema } from '@/lib/validation'
import { createErrorResponse, handleZodError, logError } from '@/lib/error-handler'
import { ZodError } from 'zod'

// PUT /api/admin/techniques/[id] - Met à jour une technique
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
    const { moduleId, name, category, subCategory, description, instructions, keyPoints, order } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {}
    
    if (moduleId !== undefined) data.moduleId = idSchema.parse(moduleId)
    if (name !== undefined) data.name = name
    if (category !== undefined) data.category = category
    if (subCategory !== undefined) data.subCategory = subCategory
    if (description !== undefined) data.description = description
    if (instructions !== undefined) data.instructions = instructions
    if (keyPoints !== undefined) data.keyPoints = keyPoints
    if (order !== undefined) data.order = parseInt(order)

    const technique = await prisma.technique.update({
      where: { id: validatedId },
      data,
    })

    return NextResponse.json(technique)
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('PUT /api/admin/techniques/[id]', error, { params: await params.catch(() => 'unknown') })
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// DELETE /api/admin/techniques/[id] - Supprime une technique
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const validatedId = idSchema.parse(id)

    await prisma.technique.delete({
      where: { id: validatedId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('DELETE /api/admin/techniques/[id]', error, { params: await params.catch(() => 'unknown') })
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting
export const PUT = withRateLimit(putHandler, { method: 'PUT', max: 20 })
export const DELETE = withRateLimit(deleteHandler, { method: 'DELETE', max: 10 })

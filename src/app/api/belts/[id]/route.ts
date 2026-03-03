import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/rate-limit'
import { idSchema } from '@/lib/validation'
import { createErrorResponse, handleZodError, logError } from '@/lib/error-handler'
import { ZodError } from 'zod'

// GET /api/belts/[id] - Détail d'une ceinture avec ses modules (public)
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Validation de l'ID
    const validatedId = idSchema.parse(id)

    const belt = await prisma.belt.findUnique({
      where: { id: validatedId },
      include: {
        content: true,
        modules: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { techniques: true },
            },
          },
        },
      },
    })

    if (!belt) {
      return createErrorResponse('NOT_FOUND', 404)
    }

    return NextResponse.json(belt)
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('GET /api/belts/[id]', error, { params: await params.catch(() => 'unknown') })
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting: 100 requêtes/minute pour GET
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })

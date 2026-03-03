import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRateLimit } from '@/lib/rate-limit'
import { beltsQuerySchema } from '@/lib/validation'
import { createErrorResponse, handleZodError, logError } from '@/lib/error-handler'
import { ZodError } from 'zod'

// GET /api/belts - Liste toutes les ceintures (public)
async function getHandler(request: NextRequest) {
  try {
    // Validation des paramètres de requête
    const { searchParams } = new URL(request.url)
    const queryParams = {
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      includeModules: searchParams.get('includeModules') ?? undefined,
    }
    
    const validatedParams = beltsQuerySchema.parse(queryParams)
    const limit = validatedParams.limit ?? 50
    const offset = validatedParams.offset ?? 0

    const belts = await prisma.belt.findMany({
      skip: offset,
      take: limit,
      orderBy: { order: 'asc' },
      include: {
        content: true,
        modules: {
          orderBy: { order: 'asc' },
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { modules: true },
        },
      },
    })

    return NextResponse.json(belts)
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error)
    }
    
    logError('GET /api/belts', error)
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error)
  }
}

// Export avec rate limiting: 100 requêtes/minute pour GET
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 })

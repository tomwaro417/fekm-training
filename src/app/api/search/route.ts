import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit';
import { searchQuerySchema } from '@/lib/validation';
import { createErrorResponse, handleZodError, logError } from '@/lib/error-handler';
import { ZodError } from 'zod';

// GET /api/search - Recherche globale
async function getHandler(request: NextRequest) {
  try {
    // Pas d'authentification requise pour la recherche (accessible depuis la landing page)

    // Validation des paramètres
    const { searchParams } = new URL(request.url);
    const queryParams = {
      q: searchParams.get('q') ?? '',
    };
    
    const validatedParams = searchQuerySchema.parse(queryParams);
    const query = validatedParams.q.toLowerCase().trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Recherche parallèle dans les différentes entités
    const [techniques, modules, belts] = await Promise.all([
      // Recherche de techniques
      prisma.technique.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { subCategory: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        include: {
          module: {
            include: {
              belt: {
                select: { name: true, color: true },
              },
            },
          },
        },
      }),

      // Recherche de modules
      prisma.module.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 3,
        include: {
          belt: {
            select: { name: true, color: true },
          },
        },
      }),

      // Recherche de ceintures
      prisma.belt.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 3,
      }),
    ]);

    // Formater les résultats
    const results = [
      // Techniques
      ...techniques.map((technique) => ({
        id: technique.id,
        name: technique.name,
        type: 'technique' as const,
        description: technique.description?.slice(0, 100) + (technique.description && technique.description.length > 100 ? '...' : ''),
        beltColor: technique.module.belt.color,
        moduleCode: technique.module.code,
        beltName: technique.module.belt.name,
        url: `/techniques/${technique.id}`,
      })),

      // Modules
      ...modules.map((module) => ({
        id: module.id,
        name: `${module.code} - ${module.name}`,
        type: 'module' as const,
        description: module.description?.slice(0, 100) + (module.description && module.description.length > 100 ? '...' : ''),
        beltColor: module.belt.color,
        beltName: module.belt.name,
        url: `/modules/${module.id}`,
      })),

      // Ceintures
      ...belts.map((belt) => ({
        id: belt.id,
        name: belt.name,
        type: 'belt' as const,
        description: belt.description?.slice(0, 100) + (belt.description && belt.description.length > 100 ? '...' : ''),
        beltColor: belt.color,
        url: `/ceintures/${belt.id}`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    
    logError('GET /api/search', error);
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error);
  }
}

// Export avec rate limiting: 30 requêtes/minute pour GET
export const GET = withRateLimit(getHandler, { method: 'GET', max: 30 });

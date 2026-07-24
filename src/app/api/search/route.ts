import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';
import { searchQuerySchema } from '@/lib/validation';
import { createErrorResponse, handleZodError, logError } from '@/lib/error-handler';
import { calculateRelevanceScore, sortByRelevance } from '@/lib/search';
import { ZodError } from 'zod';

// Nombre maximum de résultats par type
const LIMITS = {
  technique: 8,
  module: 4,
  belt: 3,
} as const;

// Types de résultats
interface SearchResultItem {
  id: string;
  name: string;
  type: 'technique' | 'module' | 'belt';
  description: string;
  beltColor?: string;
  moduleCode?: string;
  beltName?: string;
  url: string;
  score: number;
}

// GET /api/search - Recherche globale avec scoring de pertinence
async function getHandler(request: NextRequest) {
  try {
    // Pas d'authentification requise pour la recherche (accessible depuis la landing page)

    // Validation des paramètres
    const { searchParams } = new URL(request.url);
    const queryParams = {
      q: searchParams.get('q') ?? '',
    };
    
    const validatedParams = searchQuerySchema.parse(queryParams);
    const query = validatedParams.q.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Recherche parallèle dans les différentes entités
    const [techniques, modules, belts] = await Promise.all([
      prisma.technique.findMany({
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

      prisma.module.findMany({
        include: {
          belt: {
            select: { name: true, color: true },
          },
        },
      }),

      prisma.belt.findMany(),
    ]);

    const results: SearchResultItem[] = [];

    // Scoring des techniques
    techniques.forEach((technique) => {
      const score = calculateRelevanceScore(
        query,
        technique.name,
        [
          technique.description ?? '',
          technique.instructions ?? '',
          technique.subCategory ?? '',
          technique.module.code,
          technique.module.belt.name,
        ],
        technique.keyPoints
      );

      if (score > 0) {
        results.push({
          id: technique.id,
          name: technique.name,
          type: 'technique',
          description: truncate(technique.description, 100),
          beltColor: technique.module.belt.color,
          moduleCode: technique.module.code,
          beltName: technique.module.belt.name,
          url: `/techniques/${technique.id}`,
          score,
        });
      }
    });

    // Scoring des modules
    modules.forEach((module) => {
      const score = calculateRelevanceScore(
        query,
        `${module.code} - ${module.name}`,
        [
          module.description ?? '',
          module.belt.name,
        ]
      );

      if (score > 0) {
        results.push({
          id: module.id,
          name: `${module.code} - ${module.name}`,
          type: 'module',
          description: truncate(module.description, 100),
          beltColor: module.belt.color,
          beltName: module.belt.name,
          url: `/modules/${module.id}`,
          score,
        });
      }
    });

    // Scoring des ceintures
    belts.forEach((belt) => {
      const score = calculateRelevanceScore(
        query,
        belt.name,
        [
          belt.description ?? '',
        ]
      );

      if (score > 0) {
        results.push({
          id: belt.id,
          name: belt.name,
          type: 'belt',
          description: truncate(belt.description, 100),
          beltColor: belt.color,
          url: `/ceintures/${belt.id}`,
          score,
        });
      }
    });

    // Trier tous les résultats par score décroissant
    const sortedResults = sortByRelevance(results);

    // Appliquer les limites par type tout en gardant le tri global
    const limitedResults = applyTypeLimits(sortedResults, LIMITS);

    // Retirer le score de la réponse (inutile pour le client)
    const cleanResults = limitedResults.map(({ score: _score, ...rest }) => rest);

    return NextResponse.json({ results: cleanResults });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    
    logError('GET /api/search', error);
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error);
  }
}

/**
 * Applique les limites par type en conservant l'ordre global par score.
 */
function applyTypeLimits(
  results: SearchResultItem[],
  limits: Record<string, number>
): SearchResultItem[] {
  const counts: Record<string, number> = {};

  return results.filter((result) => {
    const type = result.type;
    counts[type] = (counts[type] || 0) + 1;
    return counts[type] <= limits[type];
  });
}

/**
 * Tronque une chaîne avec une ellipse si nécessaire.
 */
function truncate(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Export avec rate limiting: 30 requêtes/minute pour GET
export const GET = withRateLimit(getHandler, { method: 'GET', max: 30 });

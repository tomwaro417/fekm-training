import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit';
import { noteSchema, idSchema } from '@/lib/validation';
import { createErrorResponse, handleZodError, logError, logWarning } from '@/lib/error-handler';
import { ZodError } from 'zod';

// GET /api/notes - Liste toutes les notes de l'utilisateur ou récupère une note spécifique
async function getHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      logWarning('GET /api/notes', 'Tentative d\'accès non autorisé');
      return createErrorResponse('UNAUTHORIZED', 401);
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const techniqueId = searchParams.get('techniqueId');

    // Si techniqueId est fourni, retourner la note spécifique
    if (techniqueId) {
      const validatedTechniqueId = idSchema.parse(techniqueId);

      const note = await prisma.userNote.findUnique({
        where: {
          userId_techniqueId: {
            userId,
            techniqueId: validatedTechniqueId,
          },
        },
        include: {
          technique: {
            include: {
              module: {
                include: {
                  belt: {
                    select: { name: true, color: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!note) {
        return NextResponse.json({ note: null });
      }

      return NextResponse.json({
        note: formatNote(note),
      });
    }

    // Sinon, retourner toutes les notes de l'utilisateur
    const notes = await prisma.userNote.findMany({
      where: { userId },
      include: {
        technique: {
          include: {
            module: {
              include: {
                belt: {
                  select: { name: true, color: true },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      notes: notes.map(formatNote),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }

    logError('GET /api/notes', error);
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error);
  }
}

// POST /api/notes - Créer ou mettre à jour une note personnelle
async function postHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      logWarning('POST /api/notes', 'Tentative d\'accès non autorisé');
      return createErrorResponse('UNAUTHORIZED', 401);
    }

    const userId = session.user.id;
    const body = await request.json();

    const validatedData = noteSchema.parse(body);
    const { techniqueId, content } = validatedData;

    // Vérifier que la technique existe
    const technique = await prisma.technique.findUnique({
      where: { id: techniqueId },
      include: {
        module: {
          include: {
            belt: {
              select: { name: true, color: true },
            },
          },
        },
      },
    });

    if (!technique) {
      return createErrorResponse('NOT_FOUND', 404, 'Technique non trouvée');
    }

    // Upsert dans la table UserNote (séparée de la progression)
    const note = await prisma.userNote.upsert({
      where: {
        userId_techniqueId: {
          userId,
          techniqueId,
        },
      },
      update: {
        content,
      },
      create: {
        userId,
        techniqueId,
        content,
      },
      include: {
        technique: {
          include: {
            module: {
              include: {
                belt: {
                  select: { name: true, color: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(formatNote(note));
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }

    logError('POST /api/notes', error);
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error);
  }
}

/**
 * Formate une UserNote pour le client.
 */
function formatNote(note: {
  id: string;
  userId: string;
  techniqueId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  technique: {
    name: string;
    module: {
      code: string;
      belt: {
        name: string;
        color: string;
      };
    };
  };
}) {
  return {
    id: note.id,
    techniqueId: note.techniqueId,
    techniqueName: note.technique.name,
    moduleCode: note.technique.module.code,
    beltName: note.technique.module.belt.name,
    beltColor: note.technique.module.belt.color,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

// Export avec rate limiting
export const GET = withRateLimit(getHandler, { method: 'GET', max: 100 });
export const POST = withRateLimit(postHandler, { method: 'POST', max: 50 });

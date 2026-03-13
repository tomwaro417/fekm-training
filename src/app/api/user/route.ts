import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit';
import { createErrorResponse, logError } from '@/lib/error-handler';
import { z } from 'zod';

// GET /api/user - Obtenir les informations de l'utilisateur connecté
async function getHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('UNAUTHORIZED', 401);
    }

    const userId = session.user.id;

    // Récupérer les informations utilisateur avec ses ceintures
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        belt: {
          select: {
            id: true,
            name: true,
            color: true,
            order: true,
          },
        },
        beltHistory: {
          take: 5,
          orderBy: { promotionDate: 'desc' },
          select: {
            id: true,
            belt: {
              select: {
                name: true,
                color: true,
              },
            },
            promotionDate: true,
            notes: true,
          },
        },
        _count: {
          select: {
            progress: true,
            videos: true,
          },
        },
      },
    });

    if (!user) {
      return createErrorResponse('NOT_FOUND', 404, 'Utilisateur non trouvé');
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      belt: user.belt,
      beltHistory: user.beltHistory,
      stats: {
        totalTechniquesProgress: user._count.progress,
        totalVideosUploaded: user._count.videos,
      },
    });
  } catch (error) {
    logError('GET /api/user', error);
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error);
  }
}

// PATCH /api/user - Mettre à jour les informations de l'utilisateur
async function patchHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createErrorResponse('UNAUTHORIZED', 401);
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validation des données
    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
    });

    const validatedData = updateSchema.parse(body);
    const { name, email } = validatedData;

    // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return createErrorResponse('BAD_REQUEST', 409, 'Cet email est déjà utilisé');
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        belt: {
          select: {
            id: true,
            name: true,
            color: true,
            order: true,
          },
        },
        beltHistory: {
          take: 5,
          orderBy: { promotionDate: 'desc' },
          select: {
            id: true,
            belt: {
              select: {
                name: true,
                color: true,
              },
            },
            promotionDate: true,
            notes: true,
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 400, undefined, error);
    }
    logError('PATCH /api/user', error);
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error);
  }
}

// Export avec rate limiting
export const GET = withRateLimit(getHandler, { method: 'GET', max: 60 });
export const PATCH = withRateLimit(patchHandler, { method: 'PATCH', max: 30 });

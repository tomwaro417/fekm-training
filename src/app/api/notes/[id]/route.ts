import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit';
import { idSchema } from '@/lib/validation';
import { createErrorResponse, handleZodError, logError, logWarning } from '@/lib/error-handler';
import { ZodError } from 'zod';

// DELETE /api/notes/[id] - Supprimer une note
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      logWarning('DELETE /api/notes/[id]', 'Tentative d\'accès non autorisé');
      return createErrorResponse('UNAUTHORIZED', 401);
    }

    const userId = session.user.id;
    const { id } = await params;
    
    const validatedId = idSchema.parse(id);

    // Vérifier que la note appartient bien à l'utilisateur
    const note = await prisma.userTechniqueProgress.findFirst({
      where: {
        id: validatedId,
        userId,
      },
    });

    if (!note) {
      return createErrorResponse('NOT_FOUND', 404, 'Note non trouvée');
    }

    // Supprimer la note
    await prisma.userTechniqueProgress.delete({
      where: { id: validatedId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    
    logError('DELETE /api/notes/[id]', error);
    return createErrorResponse('INTERNAL_ERROR', 500, undefined, error as Error);
  }
}

// Export avec rate limiting: 50 requêtes/minute pour DELETE
export const DELETE = withRateLimit(deleteHandler, { method: 'DELETE', max: 50 });

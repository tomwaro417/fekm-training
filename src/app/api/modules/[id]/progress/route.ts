import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/modules/[id]/progress - Récupérer la progression de l'utilisateur pour ce module
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: moduleId } = await params;

    // Récupérer toutes les techniques du module
    const moduleData = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        techniques: {
          select: { id: true },
        },
      },
    });

    if (!moduleData) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 });
    }

    const techniqueIds = moduleData.techniques.map(t => t.id);

    // Récupérer la progression de l'utilisateur pour ces techniques
    const progress = await prisma.userTechniqueProgress.findMany({
      where: {
        userId: session.user.id,
        techniqueId: { in: techniqueIds },
      },
    });

    // Créer un map techniqueId -> level
    const progressMap = progress.reduce((acc, p) => {
      acc[p.techniqueId] = p.level;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(progressMap);
  } catch (error) {
    console.error('Erreur GET progress:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/modules/[id]/progress - Mettre à jour la progression d'une technique
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { techniqueId, level } = await request.json();

    if (!techniqueId || !level) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Vérifier que la technique existe
    const technique = await prisma.technique.findUnique({
      where: { id: techniqueId },
      include: { module: true },
    });

    if (!technique) {
      return NextResponse.json({ error: 'Technique non trouvée' }, { status: 404 });
    }

    // Upsert la progression
    const progress = await prisma.userTechniqueProgress.upsert({
      where: {
        userId_techniqueId: {
          userId: session.user.id,
          techniqueId: techniqueId,
        },
      },
      update: { level },
      create: {
        userId: session.user.id,
        techniqueId: techniqueId,
        level,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Erreur POST progress:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

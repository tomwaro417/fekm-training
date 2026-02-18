import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const techniqueId = formData.get('techniqueId') as string;
    const slot = formData.get('slot') as 'DEBUTANT' | 'PROGRESSION';

    if (!videoFile || !techniqueId || !slot) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (videoFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 100MB)' },
        { status: 400 }
      );
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'uploads', 'videos');
    await mkdir(uploadsDir, { recursive: true });

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const originalName = videoFile.name;
    const extension = originalName.split('.').pop() || 'mp4';
    const filename = `${session.user.id}_${techniqueId}_${slot}_${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Sauvegarder le fichier
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Créer l'entrée dans VideoAsset
    const videoAsset = await prisma.videoAsset.create({
      data: {
        filename,
        originalName,
        mimeType: videoFile.type,
        size: videoFile.size,
        path: `uploads/videos/${filename}`,
      },
    });

    // Créer le lien avec la technique
    await prisma.userTechniqueVideo.create({
      data: {
        userId: session.user.id,
        techniqueId: techniqueId,
        videoId: videoAsset.id,
        slot: slot,
      },
    });

    return NextResponse.json({
      success: true,
      video: {
        id: videoAsset.id,
        filename: videoAsset.filename,
      },
    });
  } catch (error) {
    console.error('Erreur upload vidéo:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}

// GET /api/videos/upload - Liste des vidéos d'une technique
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const techniqueId = searchParams.get('techniqueId');

    if (!techniqueId) {
      return NextResponse.json(
        { error: 'Technique ID requis' },
        { status: 400 }
      );
    }

    const videos = await prisma.userTechniqueVideo.findMany({
      where: {
        userId: session.user.id,
        techniqueId: techniqueId,
      },
      include: {
        video: true,
      },
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Erreur GET vidéos:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

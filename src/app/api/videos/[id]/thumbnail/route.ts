import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { existsSync } from 'fs';
import { join } from 'path';
import { readFile, mkdir } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { constants } from 'fs';

const execPromise = promisify(exec);

// GET /api/videos/[id]/thumbnail - Récupère la miniature d'une vidéo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que la vidéo existe et que l'utilisateur y a accès
    const video = await prisma.videoAsset.findUnique({
      where: { id },
      include: {
        userVideos: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Vidéo non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur a le droit de voir cette vidéo
    const hasAccess = video.userVideos.length > 0 || video.uploadedById === session.user.id;
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Utiliser le chemin de la miniature depuis la DB ou construire le chemin par défaut
    let thumbnailPath: string;
    if (video.thumbnailPath) {
      thumbnailPath = join(process.cwd(), video.thumbnailPath);
    } else {
      // Fallback: essayer de trouver la miniature avec l'ancienne convention de nommage
      thumbnailPath = join(process.cwd(), 'uploads', 'thumbnails', `${id}.jpg`);
    }
    
    // Vérifier si la miniature existe
    if (existsSync(thumbnailPath)) {
      const thumbnailBuffer = await readFile(thumbnailPath);
      return new NextResponse(thumbnailBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // Si pas de miniature, essayer de la générer à la volée
    try {
      const videoPath = join(process.cwd(), video.path);
      const thumbnailsDir = join(process.cwd(), 'uploads', 'thumbnails');
      
      // S'assurer que le dossier existe
      try {
        await mkdir(thumbnailsDir, { recursive: true });
      } catch {}
      
      const newThumbnailPath = join(thumbnailsDir, `${id}.jpg`);
      
      // Générer la miniature avec ffmpeg
      const command = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -q:v 2 -vf "scale=480:-1" "${newThumbnailPath}"`;
      await execPromise(command);
      
      // Vérifier que la miniature a été créée
      if (existsSync(newThumbnailPath)) {
        // Mettre à jour la DB avec le chemin de la miniature
        await prisma.videoAsset.update({
          where: { id },
          data: { thumbnailPath: `uploads/thumbnails/${id}.jpg` },
        });
        
        const thumbnailBuffer = await readFile(newThumbnailPath);
        return new NextResponse(thumbnailBuffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    } catch (genError) {
      console.error('[Thumbnail] Erreur génération à la volée:', genError);
    }

    // Si la génération échoue, retourner une image par défaut
    return NextResponse.json(
      { error: 'Miniature non disponible' },
      { status: 404 }
    );

  } catch (error) {
    console.error('[Thumbnail] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

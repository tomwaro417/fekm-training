import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, access, mkdir } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

// Types de vidéos acceptés
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/x-matroska',
  'video/3gpp',
  'video/3gpp2',
];

const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.3gp', '.3g2'];

// Vérifier si le type de fichier est valide
function isValidVideoType(mimeType: string, filename: string): boolean {
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    return true;
  }
  // Fallback sur l'extension
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
}

// Vérifier que le dossier uploads existe et est accessible
async function ensureUploadsDirectory(): Promise<string> {
  const uploadsDir = join(process.cwd(), 'uploads', 'videos');
  
  try {
    // Vérifier si le dossier existe
    await access(uploadsDir, constants.W_OK);
  } catch {
    // Créer le dossier s'il n'existe pas
    try {
      await mkdir(uploadsDir, { recursive: true });
      console.log('[Upload] Dossier créé:', uploadsDir);
    } catch (mkdirError) {
      console.error('[Upload] Erreur création dossier:', mkdirError);
      throw new Error('Impossible de créer le dossier de stockage');
    }
  }
  
  return uploadsDir;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      console.error('[Upload] Erreur parsing FormData:', parseError);
      return NextResponse.json(
        { error: 'Format de requête invalide' },
        { status: 400 }
      );
    }

    const videoFile = formData.get('video') as File;
    const techniqueId = formData.get('techniqueId') as string;
    const slot = formData.get('slot') as 'DEBUTANT' | 'PROGRESSION';

    // Validation des champs requis
    if (!videoFile) {
      return NextResponse.json(
        { error: 'Fichier vidéo requis' },
        { status: 400 }
      );
    }

    if (!techniqueId) {
      return NextResponse.json(
        { error: 'ID de technique requis' },
        { status: 400 }
      );
    }

    if (!slot || !['DEBUTANT', 'PROGRESSION'].includes(slot)) {
      return NextResponse.json(
        { error: 'Slot invalide (DEBUTANT ou PROGRESSION)' },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    if (!isValidVideoType(videoFile.type, videoFile.name)) {
      return NextResponse.json(
        { 
          error: 'Type de fichier non supporté',
          allowedTypes: ALLOWED_EXTENSIONS,
          received: videoFile.type
        },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (videoFile.size > maxSize) {
      return NextResponse.json(
        { 
          error: `Fichier trop volumineux (max 500MB, reçu ${Math.round(videoFile.size / 1024 / 1024)}MB)` 
        },
        { status: 400 }
      );
    }

    // Vérifier que la technique existe
    const technique = await prisma.technique.findUnique({
      where: { id: techniqueId },
    });

    if (!technique) {
      return NextResponse.json(
        { error: 'Technique non trouvée' },
        { status: 404 }
      );
    }

    console.log('[Upload] Démarrage upload:', {
      userId: session.user.id,
      name: videoFile.name,
      type: videoFile.type,
      size: `${Math.round(videoFile.size / 1024 / 1024)}MB`,
      techniqueId,
      slot
    });

    // S'assurer que le dossier existe
    const uploadsDir = await ensureUploadsDirectory();

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const originalName = videoFile.name;
    const extension = originalName.split('.').pop() || 'mp4';
    const filename = `${session.user.id}_${techniqueId}_${slot}_${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Lire et sauvegarder le fichier
    let buffer: Buffer;
    try {
      const bytes = await videoFile.arrayBuffer();
      buffer = Buffer.from(bytes);
      
      if (buffer.length === 0) {
        throw new Error('Fichier vide');
      }
      
      await writeFile(filepath, buffer);
      console.log('[Upload] Fichier sauvegardé:', filepath, `(${buffer.length} bytes)`);
    } catch (fileError) {
      console.error('[Upload] Erreur sauvegarde fichier:', fileError);
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde du fichier' },
        { status: 500 }
      );
    }

    // Vérifier que le fichier a bien été écrit
    try {
      await access(filepath, constants.F_OK);
    } catch {
      throw new Error('Le fichier n\'a pas été créé correctement');
    }

    // Créer l'entrée dans VideoAsset
    let videoAsset;
    try {
      videoAsset = await prisma.videoAsset.create({
        data: {
          filename,
          originalName,
          mimeType: videoFile.type || 'video/mp4',
          size: videoFile.size,
          path: `uploads/videos/${filename}`,
        },
      });
      console.log('[Upload] Entrée DB créée:', videoAsset.id);
    } catch (dbError) {
      console.error('[Upload] Erreur création DB:', dbError);
      // Supprimer le fichier si la DB échoue
      try {
        const { unlink } = await import('fs/promises');
        await unlink(filepath);
      } catch {}
      throw new Error('Erreur lors de l\'enregistrement en base de données');
    }

    // Créer ou mettre à jour le lien avec la technique
    try {
      await prisma.userTechniqueVideo.upsert({
        where: {
          userId_techniqueId_slot: {
            userId: session.user.id,
            techniqueId: techniqueId,
            slot: slot,
          }
        },
        update: {
          videoId: videoAsset.id,
          updatedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          techniqueId: techniqueId,
          videoId: videoAsset.id,
          slot: slot,
        },
      });
      console.log('[Upload] Lien technique créé/mis à jour');
    } catch (linkError) {
      console.error('[Upload] Erreur création lien:', linkError);
      // On continue quand même, l'asset est créé
    }

    return NextResponse.json({
      success: true,
      message: 'Vidéo uploadée avec succès',
      video: {
        id: videoAsset.id,
        filename: videoAsset.filename,
        originalName: videoAsset.originalName,
        size: videoAsset.size,
        path: videoAsset.path,
      },
    });

  } catch (error) {
    console.error('[Upload] Erreur générale:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'upload',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      videos,
    });
  } catch (error) {
    console.error('[Upload] Erreur GET vidéos:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

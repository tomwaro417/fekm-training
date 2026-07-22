import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { logWarning } from '@/lib/error-handler'

/**
 * Suppression complète d'une vidéo :
 * 1. Liens techniques (vidéos coach)
 * 2. Vidéos personnelles des élèves (UserTechniqueVideo)
 * 3. Fichier physique + vignette (tolérant si déjà absents)
 * 4. Ligne VideoAsset
 *
 * Le contrôle des permissions (propriétaire / rôle) est fait par l'appelant.
 * Retourne false si la vidéo n'existe pas.
 */
export async function deleteVideoAsset(videoId: string): Promise<boolean> {
  const video = await prisma.videoAsset.findUnique({
    where: { id: videoId },
  })

  if (!video) {
    return false
  }

  // 1-2. Liens (la cascade Prisma existe aussi, mais explicite = sûr)
  await prisma.techniqueVideoLink.deleteMany({ where: { videoId } })
  await prisma.userTechniqueVideo.deleteMany({ where: { videoId } })

  // 3. Fichiers physiques
  for (const relativePath of [video.path, video.thumbnailPath]) {
    if (!relativePath) continue
    try {
      await unlink(join(process.cwd(), relativePath))
    } catch {
      logWarning('deleteVideoAsset', 'Fichier physique introuvable (ignoré)', {
        videoId,
        path: relativePath,
      })
    }
  }

  // 4. Base de données
  await prisma.videoAsset.delete({ where: { id: videoId } })

  return true
}

-- ============================================
-- MIGRATION: Ajout des fonctionnalités Mobile & Vidéo
-- Date: 2026-03-05
-- Auteur: Morpheus (Tech Lead)
-- ============================================

-- ============================================
-- 1. MISE À JOUR DE LA TABLE VideoAsset
-- ============================================

-- Ajout des colonnes pour les métadonnées vidéo
ALTER TABLE "VideoAsset" 
ADD COLUMN IF NOT EXISTS "width" INTEGER,
ADD COLUMN IF NOT EXISTS "height" INTEGER,
ADD COLUMN IF NOT EXISTS "fps" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "bitrate" INTEGER,
ADD COLUMN IF NOT EXISTS "codec" TEXT,
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;

-- Création du type enum VideoStatus
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'videostatus') THEN
    CREATE TYPE "VideoStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'ERROR');
  END IF;
END $$;

-- Mettre à jour les vidéos existantes comme READY
UPDATE "VideoAsset" SET "status" = 'READY' WHERE "status" = 'PENDING';

-- ============================================
-- 2. CRÉATION DE LA TABLE VideoVariant
-- ============================================

-- Création du type enum VideoQuality
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'videoquality') THEN
    CREATE TYPE "VideoQuality" AS ENUM ('P360', 'P480', 'P720', 'P1080');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "VideoVariant" (
  "id" TEXT NOT NULL,
  "videoId" TEXT NOT NULL,
  "quality" "VideoQuality" NOT NULL,
  "filename" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "bitrate" INTEGER NOT NULL,
  "size" INTEGER NOT NULL,
  "hlsPath" TEXT,
  "dashPath" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "VideoVariant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VideoVariant_videoId_quality_key" UNIQUE ("videoId", "quality")
);

-- Index pour les recherches par vidéo
CREATE INDEX IF NOT EXISTS "VideoVariant_videoId_idx" ON "VideoVariant"("videoId");

-- Clé étrangère
ALTER TABLE "VideoVariant" 
ADD CONSTRAINT "VideoVariant_videoId_fkey" 
FOREIGN KEY ("videoId") REFERENCES "VideoAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 3. CRÉATION DE LA TABLE UserOfflineVideo
-- ============================================

-- Création du type enum SyncStatus
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'syncstatus') THEN
    CREATE TYPE "SyncStatus" AS ENUM ('SYNCED', 'PENDING_DELETE', 'ERROR');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "UserOfflineVideo" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "videoId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "quality" "VideoQuality" NOT NULL,
  "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accessCount" INTEGER NOT NULL DEFAULT 0,
  "syncStatus" "SyncStatus" NOT NULL DEFAULT 'SYNCED',
  
  CONSTRAINT "UserOfflineVideo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserOfflineVideo_userId_videoId_key" UNIQUE ("userId", "videoId")
);

-- Index
CREATE INDEX IF NOT EXISTS "UserOfflineVideo_userId_idx" ON "UserOfflineVideo"("userId");
CREATE INDEX IF NOT EXISTS "UserOfflineVideo_videoId_idx" ON "UserOfflineVideo"("videoId");

-- Clés étrangères
ALTER TABLE "UserOfflineVideo" 
ADD CONSTRAINT "UserOfflineVideo_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserOfflineVideo" 
ADD CONSTRAINT "UserOfflineVideo_videoId_fkey" 
FOREIGN KEY ("videoId") REFERENCES "VideoAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 4. CRÉATION DE LA TABLE OfflineProgressQueue
-- ============================================

CREATE TABLE IF NOT EXISTS "OfflineProgressQueue" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "techniqueId" TEXT NOT NULL,
  "level" "ProgressLevel" NOT NULL DEFAULT 'NON_ACQUIS',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "syncedAt" TIMESTAMP(3),
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  
  CONSTRAINT "OfflineProgressQueue_pkey" PRIMARY KEY ("id")
);

-- Index pour les recherches efficaces
CREATE INDEX IF NOT EXISTS "OfflineProgressQueue_userId_idx" ON "OfflineProgressQueue"("userId");
CREATE INDEX IF NOT EXISTS "OfflineProgressQueue_userId_syncedAt_idx" ON "OfflineProgressQueue"("userId", "syncedAt");

-- Clé étrangère
ALTER TABLE "OfflineProgressQueue" 
ADD CONSTRAINT "OfflineProgressQueue_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 5. CRÉATION DE LA TABLE PushSubscription
-- ============================================

CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "deviceInfo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PushSubscription_endpoint_key" UNIQUE ("endpoint")
);

-- Index
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- Clé étrangère
ALTER TABLE "PushSubscription" 
ADD CONSTRAINT "PushSubscription_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 6. CRÉATION DE LA TABLE UserDevice
-- ============================================

-- Création du type enum DeviceType
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'devicetype') THEN
    CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "UserDevice" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "deviceName" TEXT,
  "deviceType" "DeviceType" NOT NULL,
  "platform" TEXT,
  "maxOfflineStorage" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserDevice_deviceId_key" UNIQUE ("deviceId")
);

-- Index
CREATE INDEX IF NOT EXISTS "UserDevice_userId_idx" ON "UserDevice"("userId");

-- Clé étrangère
ALTER TABLE "UserDevice" 
ADD CONSTRAINT "UserDevice_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 7. CRÉATION DE LA TABLE ActivityLog
-- ============================================

CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- Index pour les recherches efficaces
CREATE INDEX IF NOT EXISTS "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_action_createdAt_idx" ON "ActivityLog"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- ============================================
-- 8. MISE À JOUR DES VIDÉOS EXISTANTES
-- ============================================

-- Créer des variants par défaut pour les vidéos existantes
-- (à exécuter après migration des fichiers)

INSERT INTO "VideoVariant" ("id", "videoId", "quality", "filename", "path", "width", "height", "bitrate", "size")
SELECT 
  gen_random_uuid()::text,
  va."id",
  'P720'::"VideoQuality",
  va."filename",
  va."path",
  1280,
  720,
  2500,
  va."size"
FROM "VideoAsset" va
WHERE va."status" = 'READY'
AND NOT EXISTS (
  SELECT 1 FROM "VideoVariant" vv WHERE vv."videoId" = va."id"
);

-- ============================================
-- 9. FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour nettoyer les vieilles entrées de sync
CREATE OR REPLACE FUNCTION cleanup_old_sync_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM "OfflineProgressQueue" 
  WHERE "syncedAt" IS NOT NULL 
  AND "syncedAt" < NOW() - INTERVAL '30 days';
  
  DELETE FROM "ActivityLog" 
  WHERE "createdAt" < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. VÉRIFICATION DE LA MIGRATION
-- ============================================

-- Vue récapitulative
SELECT 
  'VideoAsset avec métadonnées' as check_item,
  COUNT(*) as count
FROM "VideoAsset"
WHERE "status" IS NOT NULL

UNION ALL

SELECT 
  'VideoVariant créés' as check_item,
  COUNT(*) as count
FROM "VideoVariant"

UNION ALL

SELECT 
  'Tables nouvelles créées' as check_item,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('VideoVariant', 'UserOfflineVideo', 'OfflineProgressQueue', 'PushSubscription', 'UserDevice', 'ActivityLog');

-- ============================================
-- MIGRATION: Ajout de l'historique des ceintures
-- Date: 2026-03-07
-- ============================================

-- Création de la table BeltHistory
CREATE TABLE IF NOT EXISTS "BeltHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "beltId" TEXT NOT NULL,
  "promotedBy" TEXT,
  "promotionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BeltHistory_pkey" PRIMARY KEY ("id")
);

-- Index pour les recherches efficaces
CREATE INDEX IF NOT EXISTS "BeltHistory_userId_idx" ON "BeltHistory"("userId");
CREATE INDEX IF NOT EXISTS "BeltHistory_beltId_idx" ON "BeltHistory"("beltId");
CREATE INDEX IF NOT EXISTS "BeltHistory_promotedBy_idx" ON "BeltHistory"("promotedBy");

-- Clés étrangères
ALTER TABLE "BeltHistory" 
ADD CONSTRAINT "BeltHistory_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BeltHistory" 
ADD CONSTRAINT "BeltHistory_beltId_fkey" 
FOREIGN KEY ("beltId") REFERENCES "Belt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BeltHistory" 
ADD CONSTRAINT "BeltHistory_promotedBy_fkey" 
FOREIGN KEY ("promotedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migration des données existantes: créer un historique pour les utilisateurs ayant déjà une ceinture
INSERT INTO "BeltHistory" ("id", "userId", "beltId", "promotionDate", "notes")
SELECT 
  gen_random_uuid()::text,
  u."id",
  u."beltId",
  u."createdAt",
  'Ceinture assignée lors de la migration'
FROM "User" u
WHERE u."beltId" IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM "BeltHistory" bh WHERE bh."userId" = u."id"
);

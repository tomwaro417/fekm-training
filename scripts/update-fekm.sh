#!/bin/bash
# =============================================================================
# FEKM Training — Mise à jour à chaud (hot update)
# =============================================================================
# Usage : ./scripts/update-fekm.sh
#
# Chaîne : git pull → install conditionnel → db push conditionnel (avec backup)
#          → build → reload PM2 → health check → rollback auto si KO
#
# Prérequis : PM2 avec l'app démarrée via ecosystem.config.js
# Coupure : ~2-5 s en mode fork (pm2 reload). Pour du zéro-coupure réel,
#           passer PM2 en mode cluster (voir docs/DEPLOIEMENT-HOTFIX.md).
# =============================================================================

set -euo pipefail

APP_DIR="/home/tomwaro/.openclaw/workspace/fekm-training"
APP_NAME="fekm-training"
HEALTH_URL="http://localhost:3000/"
export PATH="$HOME/.npm-global/bin:$PATH"

cd "$APP_DIR"

log()  { echo -e "\033[0;32m[$(date +%H:%M:%S)]\033[0m $1"; }
warn() { echo -e "\033[1;33m[$(date +%H:%M:%S)]\033[0m $1"; }
err()  { echo -e "\033[0;31m[$(date +%H:%M:%S)]\033[0m $1"; }

# --- 0. Snapshot pour rollback ------------------------------------------------
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups/update-$STAMP"
mkdir -p "$BACKUP_DIR"
PREV_COMMIT=$(git rev-parse HEAD)
[ -d .next ] && cp -r .next "$BACKUP_DIR/.next" || true
echo "$PREV_COMMIT" > "$BACKUP_DIR/commit.txt"
log "Snapshot créé : $BACKUP_DIR (commit ${PREV_COMMIT:0:8})"

# --- 1. Code ------------------------------------------------------------------
log "git pull..."
git pull --ff-only
NEW_COMMIT=$(git rev-parse HEAD)

if [ "$PREV_COMMIT" = "$NEW_COMMIT" ]; then
  log "Déjà à jour (${NEW_COMMIT:0:8}) — rien à déployer."
  exit 0
fi
log "Nouveau commit : ${NEW_COMMIT:0:8}"
CHANGED=$(git diff --name-only "$PREV_COMMIT" "$NEW_COMMIT")

# --- 2. Dépendances (seulement si nécessaire) ---------------------------------
if echo "$CHANGED" | grep -q "pnpm-lock.yaml"; then
  log "Lockfile modifié → pnpm install"
  pnpm install --frozen-lockfile
else
  log "Dépendances inchangées — install sauté."
fi

# --- 3. Schéma BDD (seulement si nécessaire) ----------------------------------
if echo "$CHANGED" | grep -q "prisma/schema.prisma"; then
  warn "Schéma Prisma modifié → backup BDD puis db push"
  set -a; source .env; set +a
  pg_dump "$DATABASE_URL" -Fc > "$BACKUP_DIR/db.dump"
  log "Backup BDD : $BACKUP_DIR/db.dump ($(du -h "$BACKUP_DIR/db.dump" | cut -f1))"
  pnpm prisma generate
  pnpm prisma db push
else
  log "Schéma BDD inchangé — db push sauté."
fi

# --- 4. Build -----------------------------------------------------------------
log "Build Next.js..."
if ! pnpm build; then
  err "Build échoué — le .next précédent est restauré, l'app n'est pas touchée."
  rm -rf .next
  [ -d "$BACKUP_DIR/.next" ] && cp -r "$BACKUP_DIR/.next" .next
  exit 1
fi

# --- 5. Reload à chaud ---------------------------------------------------------
log "Reload PM2..."
pm2 reload "$APP_NAME" --update-env 2>/dev/null || pm2 start ecosystem.config.js

# --- 6. Health check ------------------------------------------------------------
log "Health check ($HEALTH_URL)..."
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "$HEALTH_URL" || echo "000")
  if [[ "$code" =~ ^(200|301|302|307|308)$ ]]; then
    log "✅ Déploiement OK — HTTP $code (${NEW_COMMIT:0:8})"
    pm2 save > /dev/null 2>&1 || true
    exit 0
  fi
  sleep 2
done

# --- 7. Rollback auto ------------------------------------------------------------
err "Health check KO après 60 s → ROLLBACK"
git reset --hard "$PREV_COMMIT"
rm -rf .next
[ -d "$BACKUP_DIR/.next" ] && cp -r "$BACKUP_DIR/.next" .next
pm2 restart "$APP_NAME" --update-env
err "Rollback sur ${PREV_COMMIT:0:8} effectué. Vérifie les logs : pm2 logs $APP_NAME"
exit 1

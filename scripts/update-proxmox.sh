#!/bin/bash
# =============================================================================
# FEKM Training - Mise à jour d'un déploiement Proxmox LXC existant
# =============================================================================
# Usage: ./scripts/update-proxmox.sh <VMID> <IP_ADDRESS>
# Exemple: ./scripts/update-proxmox.sh 101 192.168.1.101
#
# Ce script met à jour une instance déjà déployée par deploy-proxmox.sh :
# - backup PostgreSQL
# - snapshot du build actuel
# - git pull
# - restore des liens symboliques vers le stockage persistant
# - install dépendances (si lockfile changé)
# - prisma generate + db push (si schéma changé)
# - build
# - restart systemd
# - health check
# - rollback auto si KO
# =============================================================================

set -euo pipefail

VMID=${1:-}
IP_ADDRESS=${2:-}

if [[ -z "$VMID" || -z "$IP_ADDRESS" ]]; then
  echo "Usage: $0 <VMID> <IP_ADDRESS>"
  echo "Exemple: $0 101 192.168.1.101"
  exit 1
fi

APP_DIR="/home/fekm/app"
PERSIST_DIR="/var/lib/fekm-training"
SERVICE="fekm-training"
HEALTH_URL="http://${IP_ADDRESS}:3000/"

log()  { echo -e "\033[0;32m[$(date +%H:%M:%S)]\033[0m $1"; }
warn() { echo -e "\033[1;33m[$(date +%H:%M:%S)]\033[0m $1"; }
err()  { echo -e "\033[0;31m[$(date +%H:%M:%S)]\033[0m $1"; }

# Exécute une commande à l'intérieur du conteneur LXC
lxc_run() {
  pct exec "$VMID" -- bash -c "$1"
}

# Exécute une commande en tant qu'utilisateur fekm dans le conteneur
lxc_fekm() {
  pct exec "$VMID" -- su - fekm -c "$1"
}

log "=== Mise à jour du conteneur $VMID ($IP_ADDRESS) ==="

# -----------------------------------------------------------------------------
# 1. Vérifications préliminaires
# -----------------------------------------------------------------------------
if ! pct status "$VMID" &>/dev/null; then
  err "Le conteneur $VMID n'existe pas ou n'est pas accessible"
  exit 1
fi

if ! lxc_run "test -d ${APP_DIR}"; then
  err "Répertoire applicatif ${APP_DIR} introuvable. Déployez d'abord avec deploy-proxmox.sh"
  exit 1
fi

# -----------------------------------------------------------------------------
# 2. Backup base de données
# -----------------------------------------------------------------------------
log "Backup PostgreSQL..."
DB_URL=$(lxc_run "grep '^DATABASE_URL=' ${APP_DIR}/.env.production | cut -d= -f2-" | tr -d '[:space:]')
if [[ -z "$DB_URL" ]]; then
  err "Impossible de lire DATABASE_URL dans ${APP_DIR}/.env.production"
  exit 1
fi

BACKUP_FILE="${PERSIST_DIR}/backup-pre-update-$(date +%Y%m%d-%H%M%S).sql"
lxc_run "su - postgres -c \"pg_dump '${DB_URL}'\" > ${BACKUP_FILE}"
log "Backup DB créé : ${BACKUP_FILE} ($(lxc_run "du -h ${BACKUP_FILE} | cut -f1"))"

# -----------------------------------------------------------------------------
# 3. Snapshot du build actuel (rollback rapide)
# -----------------------------------------------------------------------------
log "Snapshot du build actuel..."
lxc_run "rm -rf ${APP_DIR}/.next.bak && cp -r ${APP_DIR}/.next ${APP_DIR}/.next.bak 2>/dev/null || true"

# -----------------------------------------------------------------------------
# 4. git pull
# -----------------------------------------------------------------------------
log "git pull..."
PREV_COMMIT=$(lxc_fekm "cd ${APP_DIR} && git rev-parse HEAD")
lxc_fekm "cd ${APP_DIR} && git pull --ff-only"
NEW_COMMIT=$(lxc_fekm "cd ${APP_DIR} && git rev-parse HEAD")

if [[ "$PREV_COMMIT" == "$NEW_COMMIT" ]]; then
  log "Déjà à jour (${NEW_COMMIT:0:8}) — rien à déployer."
  exit 0
fi

log "Nouveau commit : ${NEW_COMMIT:0:8}"
CHANGED=$(lxc_fekm "cd ${APP_DIR} && git diff --name-only ${PREV_COMMIT} ${NEW_COMMIT}")

# -----------------------------------------------------------------------------
# 5. Restaurer les liens symboliques vers le stockage persistant
# -----------------------------------------------------------------------------
log "Restauration des liens symboliques vers ${PERSIST_DIR}..."
lxc_run "
  mkdir -p ${APP_DIR}/uploads
  rm -rf ${APP_DIR}/uploads/videos ${APP_DIR}/uploads/thumbnails
  ln -sf ${PERSIST_DIR}/videos ${APP_DIR}/uploads/videos
  ln -sf ${PERSIST_DIR}/thumbnails ${APP_DIR}/uploads/thumbnails
  chown -R fekm:fekm ${APP_DIR}/uploads
"

# -----------------------------------------------------------------------------
# 6. Dépendances Node.js
# -----------------------------------------------------------------------------
if echo "$CHANGED" | grep -q "pnpm-lock.yaml"; then
  log "Lockfile modifié → pnpm install --frozen-lockfile"
  lxc_fekm "export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH && cd ${APP_DIR} && pnpm install --frozen-lockfile"
else
  log "Dépendances inchangées — install sauté"
fi

# -----------------------------------------------------------------------------
# 7. Prisma (generate + migrate deploy si schéma modifié)
# -----------------------------------------------------------------------------
if echo "$CHANGED" | grep -q "prisma/schema.prisma\|prisma/migrations"; then
  log "Schéma Prisma ou migrations modifiés → generate + migrate deploy"
  if ! lxc_fekm "export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH && export DATABASE_URL='${DB_URL}' && cd ${APP_DIR} && pnpm prisma generate && pnpm prisma migrate deploy"; then
    err "❌ Échec des migrations Prisma → rollback"
    lxc_run "
      rm -rf ${APP_DIR}/.next
      mv ${APP_DIR}/.next.bak ${APP_DIR}/.next
      systemctl restart ${SERVICE}
    "
    err "Rollback effectué sur le build précédent."
    err "Backup DB disponible : ${BACKUP_FILE}"
    exit 1
  fi
else
  log "Schéma Prisma inchangé — migrate deploy sauté"
fi

# -----------------------------------------------------------------------------
# 8. Build
# -----------------------------------------------------------------------------
log "Build Next.js..."
lxc_fekm "export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH && cd ${APP_DIR} && NODE_ENV=production pnpm build"

# -----------------------------------------------------------------------------
# 9. Redémarrage du service
# -----------------------------------------------------------------------------
log "Redémarrage du service ${SERVICE}..."
lxc_run "systemctl restart ${SERVICE}"

# -----------------------------------------------------------------------------
# 10. Health check
# -----------------------------------------------------------------------------
log "Health check (${HEALTH_URL})..."
for i in $(seq 1 30); do
  if curl -sf --connect-timeout 2 "$HEALTH_URL" >/dev/null 2>&1; then
    log "✅ Application à jour et opérationnelle (${NEW_COMMIT:0:8})"
    lxc_run "rm -rf ${APP_DIR}/.next.bak"
    exit 0
  fi
  sleep 2
done

# -----------------------------------------------------------------------------
# 11. Rollback auto
# -----------------------------------------------------------------------------
err "❌ Health check KO après 60s → rollback"
lxc_run "
  rm -rf ${APP_DIR}/.next
  mv ${APP_DIR}/.next.bak ${APP_DIR}/.next
  systemctl restart ${SERVICE}
"
err "Rollback effectué sur le build précédent."
err "Backup DB disponible : ${BACKUP_FILE}"
exit 1

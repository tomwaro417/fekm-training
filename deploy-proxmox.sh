#!/bin/bash
# =============================================================================
# FEKM Training - Script de déploiement sur Proxmox LXC
# =============================================================================
# Usage: ./deploy-proxmox.sh [VMID] [IP_ADDRESS] [GATEWAY] [DOMAIN]
# Exemple: ./deploy-proxmox.sh 101 192.168.1.101 192.168.1.1 fekm.example.com
# =============================================================================

set -euo pipefail

# Configuration par défaut
VMID=${1:-101}
IP_ADDRESS=${2:-192.168.1.101}
GATEWAY=${3:-192.168.1.1}
DOMAIN=${4:-""}
CONTAINER_NAME="fekm-training"
MEMORY=2048
CORES=2
DISK_SIZE=20
DB_PASSWORD="fekm_secure_password_$(openssl rand -hex 8)"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="/tmp/fekm-deploy-$(date +%Y%m%d-%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') - $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $(date '+%H:%M:%S') - $1"
}

# Fonction de nettoyage en cas d'erreur
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Déploiement échoué avec le code d'erreur $exit_code"
        log_error "Consultez les logs: $LOG_FILE"
        echo ""
        echo "Pour déboguer:"
        echo "  pct exec $VMID -- journalctl -xe"
        echo "  pct exec $VMID -- cat /var/log/fekm-install.log"
    fi
}
trap cleanup EXIT

# =============================================================================
# VÉRIFICATIONS PRÉLIMINAIRES
# =============================================================================
log_step "Vérifications préliminaires..."

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then
    log_error "Ce script doit être exécuté en root (sudo)"
    exit 1
fi

# Vérification que nous sommes sur un nœud Proxmox
if ! command -v pct &> /dev/null; then
    log_error "pct (Proxmox Container Toolkit) non trouvé. Êtes-vous sur un nœud Proxmox?"
    exit 1
fi

# Vérification de l'IP
if [[ ! "$IP_ADDRESS" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    log_error "Adresse IP invalide: $IP_ADDRESS"
    exit 1
fi

log_info "Déploiement FEKM Training sur Proxmox"
log_info "VMID: $VMID"
log_info "IP: $IP_ADDRESS"
log_info "Gateway: $GATEWAY"
log_info "Domaine: ${DOMAIN:-'(aucun)'}"
log_info "Log: $LOG_FILE"
echo ""

# =============================================================================
# ÉTAPE 1: TÉLÉCHARGEMENT DU TEMPLATE DEBIAN 12
# =============================================================================
log_step "Étape 1/8: Vérification du template Debian 12..."

TEMPLATE="debian-12-standard_12.7-1_amd64.tar.zst"
TEMPLATE_PATH="/var/lib/vz/template/cache/$TEMPLATE"

if [ ! -f "$TEMPLATE_PATH" ]; then
    log_warn "Template non trouvé, téléchargement..."
    pveam update || log_warn "pveam update a échoué, on continue..."
    pveam download local $TEMPLATE || {
        log_warn "Échec du téléchargement via pveam, tentative directe..."
        wget --timeout=60 --tries=3 -O "$TEMPLATE_PATH" "http://download.proxmox.com/images/system/$TEMPLATE" || {
            log_error "Impossible de télécharger le template"
            exit 1
        }
    }
    log_info "Template téléchargé avec succès"
else
    log_info "Template déjà présent"
fi

# =============================================================================
# ÉTAPE 2: DESTRUCTION DU CONTENEUR EXISTANT
# =============================================================================
log_step "Étape 2/8: Vérification du conteneur existant..."

if pct status $VMID &> /dev/null; then
    log_warn "Le conteneur $VMID existe déjà, suppression..."
    pct stop $VMID 2>/dev/null || true
    sleep 3
    pct destroy $VMID || {
        log_error "Impossible de détruire le conteneur existant"
        exit 1
    }
    log_info "Conteneur $VMID supprimé"
fi

# =============================================================================
# ÉTAPE 3: CRÉATION DU CONTENEUR LXC
# =============================================================================
log_step "Étape 3/8: Création du conteneur LXC..."

pct create $VMID "$TEMPLATE_PATH" \
    --hostname "$CONTAINER_NAME" \
    --memory $MEMORY \
    --cores $CORES \
    --rootfs local-lvm:${DISK_SIZE}G \
    --net0 name=eth0,bridge=vmbr0,ip=${IP_ADDRESS}/24,gw=$GATEWAY \
    --unprivileged 1 \
    --features nesting=1,keyctl=1 \
    --ostype debian || {
    log_error "Échec de la création du conteneur"
    exit 1
}

log_info "Conteneur créé avec succès"

# =============================================================================
# ÉTAPE 4: DÉMARRAGE ET CONFIGURATION INITIALE
# =============================================================================
log_step "Étape 4/8: Démarrage et configuration initiale..."

pct start $VMID || {
    log_error "Impossible de démarrer le conteneur"
    exit 1
}

# Attente que le conteneur soit prêt
log_info "Attente du démarrage du conteneur (peut prendre 30-60s)..."
for i in {1..60}; do
    if pct exec $VMID -- systemctl is-system-running &> /dev/null; then
        log_info "Conteneur prêt!"
        break
    fi
    if [ $i -eq 60 ]; then
        log_warn "Timeout d'attente, on continue quand même..."
    fi
    sleep 2
done

# Configuration DNS
log_info "Configuration DNS..."
pct exec $VMID -- bash -c "echo 'nameserver 8.8.8.8' > /etc/resolv.conf" || true
pct exec $VMID -- bash -c "echo 'nameserver 1.1.1.1' >> /etc/resolv.conf" || true

# Configuration locale
log_info "Configuration des locales..."
pct exec $VMID -- bash -c "apt-get update -qq && apt-get install -y -qq locales" || true
pct exec $VMID -- bash -c "echo 'en_US.UTF-8 UTF-8' > /etc/locale.gen" || true
pct exec $VMID -- bash -c "echo 'LANG=en_US.UTF-8' > /etc/default/locale" || true
pct exec $VMID -- locale-gen en_US.UTF-8 2>/dev/null || true

# =============================================================================
# ÉTAPE 5: INSTALLATION DES DÉPENDANCES SYSTÈME
# =============================================================================
log_step "Étape 5/8: Installation des dépendances système..."

log_info "Mise à jour du système..."
pct exec $VMID -- apt-get update
pct exec $VMID -- apt-get upgrade -y

log_info "Installation des paquets essentiels..."
pct exec $VMID -- apt-get install -y \
    curl \
    wget \
    git \
    sudo \
    ca-certificates \
    gnupg \
    nginx \
    postgresql \
    postgresql-contrib \
    redis-server \
    ufw \
    fail2ban \
    htop \
    ncdu \
    net-tools \
    build-essential \
    python3 \
    python3-pip \
    openssl \
    ffmpeg \
    2>&1 | tee -a /tmp/apt-install.log || {
    log_error "Échec de l'installation des paquets"
    exit 1
}

log_info "Installation de Node.js 22..."
# Installation propre de Node.js 22
pct exec $VMID -- bash -c "
    # Nettoyer les anciennes installations
    rm -f /etc/apt/sources.list.d/nodesource*
    
    # Installer NodeSource
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    
    # Installer Node.js
    apt-get install -y nodejs
    
    # Vérifier l'installation
    node --version
    npm --version
" || {
    log_error "Échec de l'installation de Node.js"
    exit 1
}

log_info "Installation de pnpm..."
# Installation de pnpm via le script officiel (plus fiable)
pct exec $VMID -- bash -c "
    # Installer pnpm via le script officiel
    curl -fsSL https://get.pnpm.io/install.sh | env PNPM_HOME=/usr/local/share/pnpm sh -
    
    # Créer les liens symboliques
    ln -sf /usr/local/share/pnpm/pnpm /usr/local/bin/pnpm
    ln -sf /usr/local/share/pnpm/pnpm /usr/bin/pnpm
    
    # Vérifier l'installation
    pnpm --version
" || {
    log_error "Échec de l'installation de pnpm"
    exit 1
}

# Configuration du PATH global
pct exec $VMID -- bash -c "echo 'export PATH=/usr/local/bin:/usr/local/share/pnpm:\$PATH' > /etc/profile.d/custom-path.sh"

log_info "Installation de tsx (TypeScript executor)..."
pct exec $VMID -- npm install -g tsx || log_warn "tsx installation peut avoir échoué, on continue..."

# =============================================================================
# ÉTAPE 6: CONFIGURATION DE POSTGRESQL ET REDIS
# =============================================================================
log_step "Étape 6/8: Configuration de PostgreSQL et Redis..."

log_info "Configuration PostgreSQL..."
pct exec $VMID -- systemctl start postgresql
pct exec $VMID -- systemctl enable postgresql

# Création de la base de données et de l'utilisateur
log_info "Création de la base de données..."
pct exec $VMID -- su - postgres -c "psql -c \"CREATE DATABASE fekm_training;\"" || log_warn "La base existe peut-être déjà"
pct exec $VMID -- su - postgres -c "psql -c \"CREATE USER fekm_user WITH PASSWORD '${DB_PASSWORD}';\"" || log_warn "L'utilisateur existe peut-être déjà"
pct exec $VMID -- su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE fekm_training TO fekm_user;\""
pct exec $VMID -- su - postgres -c "psql -c \"ALTER DATABASE fekm_training OWNER TO fekm_user;\""
pct exec $VMID -- su - postgres -c "psql -c \"ALTER USER fekm_user WITH SUPERUSER;\"" || true

# Configuration de Redis
log_info "Configuration Redis..."
pct exec $VMID -- systemctl start redis-server
pct exec $VMID -- systemctl enable redis-server
pct exec $VMID -- redis-cli ping || {
    log_error "Redis ne répond pas"
    exit 1
}

log_info "Configuration du firewall..."
pct exec $VMID -- ufw default deny incoming
pct exec $VMID -- ufw default allow outgoing
pct exec $VMID -- ufw allow 22/tcp
pct exec $VMID -- ufw allow 80/tcp
pct exec $VMID -- ufw allow 443/tcp
pct exec $VMID -- ufw --force enable

# =============================================================================
# ÉTAPE 7: DÉPLOIEMENT DE L'APPLICATION
# =============================================================================
log_step "Étape 7/8: Déploiement de l'application..."

# Création de l'utilisateur applicatif
log_info "Création de l'utilisateur fekm..."
pct exec $VMID -- id -u fekm &>/dev/null || pct exec $VMID -- useradd -m -s /bin/bash fekm

# Clonage du repo
log_info "Clonage du repository..."
pct exec $VMID -- rm -rf /home/fekm/app
pct exec $VMID -- su - fekm -c "git clone https://github.com/tomwaro417/fekm-training.git /home/fekm/app" || {
    # Fallback: copier depuis le dossier local si git échoue
    log_warn "Git clone échoué, tentative de copie locale..."
    pct exec $VMID -- mkdir -p /home/fekm/app
    tar czf - -C /home/tomwaro/.openclaw/workspace/fekm-training . 2>/dev/null | pct exec $VMID -- tar xzf - -C /home/fekm/app
    pct exec $VMID -- chown -R fekm:fekm /home/fekm/app
}

# Liaison du stockage persistant (vidéos et miniatures)
# Le code de l'application utilise uploads/videos et uploads/thumbnails.
# Sans ces liens, les fichiers seraient stockés dans /home/fekm/app et perdus
# à chaque redéploiement (rm -rf /home/fekm/app).
log_info "Configuration du stockage persistant pour les uploads..."
pct exec $VMID -- mkdir -p /var/lib/fekm-training/videos /var/lib/fekm-training/thumbnails
pct exec $VMID -- chown -R fekm:fekm /var/lib/fekm-training
pct exec $VMID -- bash -c "
    mkdir -p /home/fekm/app/uploads
    rm -rf /home/fekm/app/uploads/videos /home/fekm/app/uploads/thumbnails
    ln -sf /var/lib/fekm-training/videos /home/fekm/app/uploads/videos
    ln -sf /var/lib/fekm-training/thumbnails /home/fekm/app/uploads/thumbnails
    chown -R fekm:fekm /home/fekm/app/uploads
"

# Création du fichier .env.production
log_info "Configuration des variables d'environnement..."
pct exec $VMID -- bash -c "cat > /home/fekm/app/.env.production << ENVFILE
# Environnement
NODE_ENV=production
PORT=3000

# Base de données
DATABASE_URL=postgresql://fekm_user:${DB_PASSWORD}@localhost:5432/fekm_training

# Redis
REDIS_URL=redis://localhost:6379

# Authentification
NEXTAUTH_URL=http://${DOMAIN:-$IP_ADDRESS}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Upload vidéo
VIDEO_UPLOAD_DIR=/var/lib/fekm-training/videos
MAX_VIDEO_SIZE=524288000

# Logging
LOG_LEVEL=info
ENVFILE
"

pct exec $VMID -- chown fekm:fekm /home/fekm/app/.env.production
pct exec $VMID -- chmod 600 /home/fekm/app/.env.production

# Installation des dépendances Node.js
log_info "Installation des dépendances Node.js (peut prendre plusieurs minutes)..."
pct exec $VMID -- bash -c "
    export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH
    export HOME=/home/fekm
    cd /home/fekm/app
    su - fekm -c 'cd /home/fekm/app && pnpm install --frozen-lockfile' 2>&1
" || {
    log_warn "Installation avec frozen-lockfile échouée, tentative sans..."
    pct exec $VMID -- bash -c "
        export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH
        su - fekm -c 'cd /home/fekm/app && pnpm install' 2>&1
    "
}

# Génération Prisma
log_info "Génération du client Prisma..."
pct exec $VMID -- bash -c "
    export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH
    export HOME=/home/fekm
    cd /home/fekm/app
    su - fekm -c 'export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH && pnpm prisma generate'
" || {
    log_error "Échec de la génération Prisma"
    exit 1
}

# Application des migrations Prisma
log_info "Application des migrations Prisma..."
pct exec $VMID -- bash -c "
    export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH
    export DATABASE_URL=postgresql://fekm_user:${DB_PASSWORD}@localhost:5432/fekm_training
    cd /home/fekm/app
    su - fekm -c 'export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH && export DATABASE_URL=postgresql://fekm_user:${DB_PASSWORD}@localhost:5432/fekm_training && pnpm prisma migrate deploy'
" || {
    log_error "Échec de l'application des migrations Prisma"
    exit 1
}

# Seed de la base de données
log_info "Seed de la base de données..."
pct exec $VMID -- bash -c "
    export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH
    export DATABASE_URL=postgresql://fekm_user:${DB_PASSWORD}@localhost:5432/fekm_training
    cd /home/fekm/app
    su - fekm -c 'export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH && export DATABASE_URL=postgresql://fekm_user:${DB_PASSWORD}@localhost:5432/fekm_training && pnpm db:seed' 2>&1
" || log_warn "Seed échoué ou déjà effectué"

# Création du dossier d'upload
log_info "Configuration du stockage vidéo..."
pct exec $VMID -- mkdir -p /var/lib/fekm-training/videos
pct exec $VMID -- chown -R fekm:fekm /var/lib/fekm-training
pct exec $VMID -- chmod 755 /var/lib/fekm-training

# Build de l'application
log_info "Build de l'application (peut prendre 2-5 minutes)..."
pct exec $VMID -- bash -c "
    export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH
    export HOME=/home/fekm
    cd /home/fekm/app
    su - fekm -c 'export PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:\$PATH && NODE_ENV=production pnpm build' 2>&1
" || {
    log_error "Échec du build"
    exit 1
}

# =============================================================================
# ÉTAPE 8: CONFIGURATION NGINX ET DÉMARRAGE
# =============================================================================
log_step "Étape 8/8: Configuration Nginx et démarrage..."

# Configuration Nginx
log_info "Configuration Nginx..."
pct exec $VMID -- bash -c "cat > /etc/nginx/sites-available/fekm-training << 'NGINXCONF'
server {
    listen 80;
    server_name _;
    client_max_body_size 500M;
    
    # Logs
    access_log /var/log/nginx/fekm-access.log;
    error_log /var/log/nginx/fekm-error.log;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 60;
        proxy_send_timeout 60;
    }
    
    # Sécurité
    location ~ /\. {
        deny all;
    }
}
NGINXCONF
"

pct exec $VMID -- ln -sf /etc/nginx/sites-available/fekm-training /etc/nginx/sites-enabled/
pct exec $VMID -- rm -f /etc/nginx/sites-enabled/default
pct exec $VMID -- nginx -t || {
    log_error "Configuration Nginx invalide"
    exit 1
}
pct exec $VMID -- systemctl restart nginx

# Création du service systemd
log_info "Création du service systemd..."
pct exec $VMID -- bash -c "cat > /etc/systemd/system/fekm-training.service << SYSTEMD
[Unit]
Description=FEKM Training Application
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=fekm
WorkingDirectory=/home/fekm/app
Environment=PATH=/usr/local/bin:/usr/local/share/pnpm:/usr/bin:/bin
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATABASE_URL=postgresql://fekm_user:${DB_PASSWORD}@localhost:5432/fekm_training
Environment=REDIS_URL=redis://localhost:6379
Environment=NEXTAUTH_URL=http://${DOMAIN:-$IP_ADDRESS}
Environment=NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
Environment=VIDEO_UPLOAD_DIR=/var/lib/fekm-training/videos
ExecStart=/usr/local/bin/pnpm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=fekm-training

[Install]
WantedBy=multi-user.target
SYSTEMD
"

pct exec $VMID -- systemctl daemon-reload
pct exec $VMID -- systemctl enable fekm-training

# Démarrage de l'application
log_info "Démarrage de l'application..."
pct exec $VMID -- systemctl start fekm-training

# Vérification
log_info "Vérification du démarrage..."
sleep 5
for i in {1..12}; do
    if pct exec $VMID -- systemctl is-active --quiet fekm-training; then
        log_info "✅ Application démarrée avec succès!"
        break
    fi
    if [ $i -eq 12 ]; then
        log_error "❌ L'application n'a pas démarré dans le temps imparti"
        pct exec $VMID -- journalctl -u fekm-training -n 30 --no-pager
        exit 1
    fi
    log_info "Attente du démarrage... ($i/12)"
    sleep 5
done

# Test de connectivité
log_info "Test de connectivité..."
if pct exec $VMID -- curl -sf http://localhost:3000/api/belts > /dev/null 2>&1; then
    log_info "✅ API répond correctement!"
else
    log_warn "⚠️ API ne répond pas encore (peut être normal au premier démarrage)"
fi

# =============================================================================
# RÉSUMÉ
# =============================================================================
echo ""
echo "=========================================="
echo "  🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!"
echo "=========================================="
echo ""
echo "📋 Informations du conteneur:"
echo "   - VMID: $VMID"
echo "   - Nom: $CONTAINER_NAME"
echo "   - IP: $IP_ADDRESS"
echo "   - URL: http://${DOMAIN:-$IP_ADDRESS}"
echo ""
echo "🔧 Commandes utiles:"
echo "   - Voir les logs:    pct exec $VMID -- journalctl -u fekm-training -f"
echo "   - Redémarrer app:   pct exec $VMID -- systemctl restart fekm-training"
echo "   - Status app:       pct exec $VMID -- systemctl status fekm-training"
echo "   - Shell conteneur:  pct exec $VMID -- bash"
echo "   - Arrêter CT:       pct stop $VMID"
echo "   - Démarrer CT:      pct start $VMID"
echo ""
echo "🗄️  Base de données:"
echo "   - Database: fekm_training"
echo "   - User: fekm_user"
echo "   - Password: ${DB_PASSWORD}"
echo ""
echo "📁 Fichiers importants:"
echo "   - Application: /home/fekm/app"
echo "   - Vidéos: /var/lib/fekm-training/videos"
echo "   - Logs: /var/log/nginx/fekm-*.log"
echo "   - Env: /home/fekm/app/.env.production"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Changez le mot de passe PostgreSQL en production"
echo "   - Configurez un certificat SSL avec: certbot --nginx"
echo "   - Sauvegardez ce résumé (le mot de passe ne sera plus affiché)"
echo ""
echo "📄 Log complet: $LOG_FILE"
echo ""

# Sauvegarde du résumé
pct exec $VMID -- bash -c "cat > /root/DEPLOYMENT_INFO.txt << 'EOF'
FEKM Training - Informations de déploiement
============================================
Date: $(date)
VMID: $VMID
IP: $IP_ADDRESS
Domaine: ${DOMAIN:-'(aucun)'}
URL: http://${DOMAIN:-$IP_ADDRESS}

Base de données:
  - Database: fekm_training
  - User: fekm_user
  - Password: $DB_PASSWORD

NextAuth Secret: $NEXTAUTH_SECRET

Commandes utiles:
  journalctl -u fekm-training -f
  systemctl status fekm-training
  systemctl restart fekm-training
EOF
"

log_info "Résumé sauvegardé dans /root/DEPLOYMENT_INFO.txt du conteneur"

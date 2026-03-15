#!/bin/bash
# =============================================================================
# FEKM Training - Script de déploiement sur Proxmox LXC
# =============================================================================
# Usage: ./deploy-proxmox.sh [VMID] [IP_ADDRESS]
# Exemple: ./deploy-proxmox.sh 101 192.168.1.101
# =============================================================================

set -e

# Configuration
VMID=${1:-101}
IP_ADDRESS=${2:-192.168.1.101}
GATEWAY=${3:-192.168.1.1}
CONTAINER_NAME="fekm-training"
MEMORY=2048
CORES=2
DISK_SIZE=20

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

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

log_info "Déploiement FEKM Training sur Proxmox"
log_info "VMID: $VMID"
log_info "IP: $IP_ADDRESS"
log_info "Gateway: $GATEWAY"
echo ""

# =============================================================================
# Étape 1: Téléchargement du template Debian 12
# =============================================================================
log_info "Étape 1/7: Vérification du template Debian 12..."

TEMPLATE="debian-12-standard_12.7-1_amd64.tar.zst"
TEMPLATE_PATH="/var/lib/vz/template/cache/$TEMPLATE"

if [ ! -f "$TEMPLATE_PATH" ]; then
    log_warn "Template non trouvé, téléchargement..."
    pveam update
    pveam download local $TEMPLATE || {
        log_error "Échec du téléchargement du template"
        log_info "Tentative avec l'URL directe..."
        wget -O "$TEMPLATE_PATH" "http://download.proxmox.com/images/system/$TEMPLATE" || {
            log_error "Impossible de télécharger le template"
            exit 1
        }
    }
else
    log_info "Template déjà présent"
fi

# =============================================================================
# Étape 2: Destruction du conteneur existant (si présent)
# =============================================================================
log_info "Étape 2/7: Vérification du conteneur existant..."

if pct status $VMID &> /dev/null; then
    log_warn "Le conteneur $VMID existe déjà, suppression..."
    pct stop $VMID 2>/dev/null || true
    sleep 2
    pct destroy $VMID
    log_info "Conteneur $VMID supprimé"
fi

# =============================================================================
# Étape 3: Création du conteneur LXC
# =============================================================================
log_info "Étape 3/7: Création du conteneur LXC..."

pct create $VMID $TEMPLATE_PATH \
    --hostname $CONTAINER_NAME \
    --memory $MEMORY \
    --cores $CORES \
    --rootfs local-lvm:$DISK_SIZE \
    --net0 name=eth0,bridge=vmbr0,ip=$IP_ADDRESS/24,gw=$GATEWAY \
    --unprivileged 1 \
    --features nesting=1,keyctl=1 \
    --ostype debian

log_info "Conteneur créé avec succès"

# =============================================================================
# Étape 4: Configuration du conteneur
# =============================================================================
log_info "Étape 4/7: Configuration du conteneur..."

# Démarrage du conteneur
pct start $VMID
sleep 5

# Attente que le conteneur soit prêt
log_info "Attente du démarrage du conteneur..."
for i in {1..30}; do
    if pct exec $VMID -- systemctl is-system-running &> /dev/null; then
        break
    fi
    sleep 2
done

# Configuration DNS
pct exec $VMID -- bash -c "echo 'nameserver 8.8.8.8' > /etc/resolv.conf"
pct exec $VMID -- bash -c "echo 'nameserver 1.1.1.1' >> /etc/resolv.conf"

# Configuration locale pour éviter les warnings Perl
log_info "Configuration des locales..."
pct exec $VMID -- bash -c "echo 'en_US.UTF-8 UTF-8' > /etc/locale.gen"
pct exec $VMID -- bash -c "echo 'LANG=en_US.UTF-8' > /etc/default/locale"
pct exec $VMID -- locale-gen en_US.UTF-8 2>/dev/null || true
pct exec $VMID -- bash -c "export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8"

# Mise à jour du système
log_info "Mise à jour du système..."
pct exec $VMID -- apt-get update
pct exec $VMID -- apt-get upgrade -y

# Installation des dépendances système
log_info "Installation des dépendances système..."
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
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban

# Vérifier que sudo est bien installé et configurer le PATH
log_info "Vérification de sudo..."
pct exec $VMID -- bash -c "which sudo || apt-get install -y sudo"
pct exec $VMID -- bash -c "export PATH=\$PATH:/usr/bin:/bin:/usr/sbin:/sbin"

# Installation de Node.js 22 via NodeSource
log_info "Installation de Node.js 22..."
pct exec $VMID -- bash -c "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -"
pct exec $VMID -- apt-get install -y nodejs

# Installation de pnpm
log_info "Installation de pnpm..."
pct exec $VMID -- npm install -g pnpm

# Vérifier où pnpm est installé et créer des liens symboliques
pct exec $VMID -- bash -c "PNPM_PATH=\$(which pnpm); ln -sf \$PNPM_PATH /usr/bin/pnpm || true; ln -sf \$PNPM_PATH /bin/pnpm || true; echo \"pnpm installé à: \$PNPM_PATH\""

# =============================================================================
# Étape 5: Configuration de PostgreSQL
# =============================================================================
log_info "Étape 5/7: Configuration de PostgreSQL..."

pct exec $VMID -- systemctl start postgresql
pct exec $VMID -- systemctl enable postgresql

# Création de la base de données et de l'utilisateur
log_info "Configuration PostgreSQL..."

# Créer un fichier SQL temporaire
pct exec $VMID -- bash -c "cat > /tmp/setup_db.sql << 'SQLEOF'
CREATE DATABASE fekm_training;
CREATE USER fekm_user WITH PASSWORD 'fekm_secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE fekm_training TO fekm_user;
ALTER DATABASE fekm_training OWNER TO fekm_user;
SQLEOF"

# Exécuter le fichier SQL
pct exec $VMID -- bash -c "export LANG=en_US.UTF-8; export LC_ALL=en_US.UTF-8; su - postgres -c 'psql -f /tmp/setup_db.sql'"

# Configuration de Redis
pct exec $VMID -- systemctl start redis-server
pct exec $VMID -- systemctl enable redis-server

# =============================================================================
# Étape 6: Déploiement de l'application
# =============================================================================
log_info "Étape 6/7: Déploiement de l'application..."

# Création de l'utilisateur applicatif
pct exec $VMID -- useradd -m -s /bin/bash fekm || true

# Clonage du repo
pct exec $VMID -- bash -c "cd /home/fekm && git clone https://github.com/tomwaro417/fekm-training.git app"
pct exec $VMID -- bash -c "chown -R fekm:fekm /home/fekm/app"

# Installation des dépendances Node.js
log_info "Installation des dépendances Node.js..."
pct exec $VMID -- bash -c 'export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8 && su - fekm -c "export PATH=\$PATH:/usr/local/bin:/usr/bin && cd /home/fekm/app && pnpm install"'

# Génération Prisma
log_info "Génération Prisma..."
pct exec $VMID -- bash -c 'export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8 && su - fekm -c "export PATH=\$PATH:/usr/local/bin:/usr/bin && cd /home/fekm/app && pnpm prisma generate"'

# Application des migrations Prisma (CRUCIAL !)
log_info "Application des migrations Prisma..."
pct exec $VMID -- bash -c 'export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8 && su - fekm -c "export PATH=\$PATH:/usr/local/bin:/usr/bin && export DATABASE_URL=postgresql://fekm_user:fekm_secure_password_2024@localhost:5432/fekm_training && cd /home/fekm/app && pnpm prisma migrate deploy"'

# Seed de la base de données
log_info "Seed de la base de données..."
pct exec $VMID -- bash -c 'export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8 && su - fekm -c "export PATH=\$PATH:/usr/local/bin:/usr/bin && export DATABASE_URL=postgresql://fekm_user:fekm_secure_password_2024@localhost:5432/fekm_training && cd /home/fekm/app && pnpm db:seed"' || log_warn "Seed échoué ou déjà fait"

# Build de l'application
log_info "Build de l'application..."
pct exec $VMID -- bash -c 'export LANG=en_US.UTF-8 && export LC_ALL=en_US.UTF-8 && su - fekm -c "export PATH=\$PATH:/usr/local/bin:/usr/bin && cd /home/fekm/app && pnpm build"'

# =============================================================================
# Étape 7: Configuration Nginx et démarrage
# =============================================================================
log_info "Étape 7/7: Configuration Nginx et démarrage..."

# Configuration Nginx
pct exec $VMID -- bash -c "cat > /etc/nginx/sites-available/fekm-training << 'EOF'
server {
    listen 80;
    server_name _;
    
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
    }
}
EOF"

pct exec $VMID -- ln -sf /etc/nginx/sites-available/fekm-training /etc/nginx/sites-enabled/
pct exec $VMID -- rm -f /etc/nginx/sites-enabled/default
pct exec $VMID -- nginx -t
pct exec $VMID -- systemctl restart nginx

# Création du service systemd
log_info "Création du service systemd..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

pct exec $VMID -- bash -c "cat > /etc/systemd/system/fekm-training.service << EOF
[Unit]
Description=FEKM Training Application
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=fekm
WorkingDirectory=/home/fekm/app
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATABASE_URL=postgresql://fekm_user:fekm_secure_password_2024@localhost:5432/fekm_training
Environment=NEXTAUTH_URL=http://$IP_ADDRESS
Environment=NEXTAUTH_SECRET=$NEXTAUTH_SECRET
Environment=REDIS_URL=redis://localhost:6379
ExecStart=/bin/bash -c 'export PATH=\$PATH:/usr/local/bin:/usr/bin && cd /home/fekm/app && pnpm start'
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF"

pct exec $VMID -- systemctl daemon-reload
pct exec $VMID -- systemctl enable fekm-training

# Firewall
log_info "Configuration du firewall..."
pct exec $VMID -- ufw allow 22/tcp
pct exec $VMID -- ufw allow 80/tcp
pct exec $VMID -- ufw allow 443/tcp
pct exec $VMID -- ufw --force enable

# Démarrage de l'application
log_info "Démarrage de l'application..."
pct exec $VMID -- systemctl start fekm-training

# Vérification
sleep 5
if pct exec $VMID -- systemctl is-active --quiet fekm-training; then
    log_info "✅ Application démarrée avec succès!"
else
    log_error "❌ L'application n'a pas démarré correctement"
    pct exec $VMID -- journalctl -u fekm-training -n 20 --no-pager
    exit 1
fi

# =============================================================================
# Résumé
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
echo "   - URL: http://$IP_ADDRESS"
echo ""
echo "🔧 Commandes utiles:"
echo "   - Voir les logs: pct exec $VMID -- journalctl -u fekm-training -f"
echo "   - Redémarrer: pct exec $VMID -- systemctl restart fekm-training"
echo "   - Arrêter: pct stop $VMID"
echo "   - Démarrer: pct start $VMID"
echo "   - Console: pct console $VMID"
echo "   - Shell: pct exec $VMID -- bash"
echo ""
echo "🗄️  Base de données:"
echo "   - Database: fekm_training"
echo "   - User: fekm_user"
echo "   - Password: fekm_secure_password_2024"
echo ""
echo "⚠️  IMPORTANT: Changez le mot de passe PostgreSQL en production!"
echo ""

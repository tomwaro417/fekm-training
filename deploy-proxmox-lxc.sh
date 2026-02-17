#!/bin/bash
#
# Script de déploiement FEKM Training sur Proxmox LXC
# 
# Usage: ./deploy-proxmox-lxc.sh [OPTIONS]
# 
# Options:
#   --ctid ID         ID du conteneur (défaut: 900)
#   --hostname NAME   Nom du conteneur (défaut: fekm-training)
#   --storage NAME    Storage Proxmox (défaut: local-lvm)
#   --memory MB       RAM en MB (défaut: 2048)
#   --cores N         Nombre de cores (défaut: 2)
#   --disk GB         Taille disque en GB (défaut: 16)
#   --ip IP/CIDR      IP statique (ex: 192.168.1.100/24)
#   --gateway IP      Gateway (ex: 192.168.1.1)
#   --bridge IFACE    Interface bridge (défaut: vmbr0)
#   --help            Afficher l'aide
#
# Exemple:
#   ./deploy-proxmox-lxc.sh --ctid 100 --ip 192.168.1.50/24 --gateway 192.168.1.1
#

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables par défaut
CTID="${CTID:-900}"
HOSTNAME="${HOSTNAME:-fekm-training}"
STORAGE="${STORAGE:-local-lvm}"
MEMORY="${MEMORY:-2048}"
CORES="${CORES:-2}"
DISK="${DISK:-16}"
BRIDGE="${BRIDGE:-vmbr0}"
IP=""
GATEWAY=""

# URL du repo
REPO_URL="https://github.com/tomwaro417/fekm-training.git"
APP_DIR="/opt/fekm-training"

# Fonction d'aide
show_help() {
    grep "^#" "$0" | grep -v "#!/bin/bash" | sed 's/^# //'
    exit 0
}

# Parsing des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --ctid)
            CTID="$2"
            shift 2
            ;;
        --hostname)
            HOSTNAME="$2"
            shift 2
            ;;
        --storage)
            STORAGE="$2"
            shift 2
            ;;
        --memory)
            MEMORY="$2"
            shift 2
            ;;
        --cores)
            CORES="$2"
            shift 2
            ;;
        --disk)
            DISK="$2"
            shift 2
            ;;
        --ip)
            IP="$2"
            shift 2
            ;;
        --gateway)
            GATEWAY="$2"
            shift 2
            ;;
        --bridge)
            BRIDGE="$2"
            shift 2
            ;;
        --help)
            show_help
            ;;
        *)
            echo "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Vérification des privilèges
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ Ce script doit être exécuté en root${NC}"
   exit 1
fi

# Vérification qu'on est sur un Proxmox
if ! command -v pct &> /dev/null; then
    echo -e "${RED}❌ Ce script doit être exécuté sur un hôte Proxmox${NC}"
    exit 1
fi

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Déploiement FEKM Training (LXC)    ${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Vérification des paramètres
if [[ -z "$IP" ]]; then
    echo -e "${YELLOW}⚠️  Aucune IP spécifiée, utilisation du DHCP${NC}"
    NET_CONFIG="name=eth0,bridge=$BRIDGE,ip=dhcp"
else
    if [[ -z "$GATEWAY" ]]; then
        echo -e "${RED}❌ --gateway est requis quand --ip est spécifié${NC}"
        exit 1
    fi
    NET_CONFIG="name=eth0,bridge=$BRIDGE,ip=$IP,gw=$GATEWAY"
    echo -e "${GREEN}✓ IP statique: $IP (Gateway: $GATEWAY)${NC}"
fi

echo -e "${BLUE}Configuration:${NC}"
echo "  CT ID: $CTID"
echo "  Hostname: $HOSTNAME"
echo "  Storage: $STORAGE"
echo "  RAM: ${MEMORY}MB"
echo "  Cores: $CORES"
echo "  Disk: ${DISK}GB"
echo "  Bridge: $BRIDGE"
echo ""

read -p "Continuer? [Y/n] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! -z $REPLY ]]; then
    echo -e "${YELLOW}Annulé${NC}"
    exit 0
fi

# Vérifier si le conteneur existe déjà
if pct status $CTID &> /dev/null; then
    echo -e "${YELLOW}⚠️  Le conteneur $CTID existe déjà${NC}"
    read -p "Voulez-vous le supprimer et le recréer? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Suppression du conteneur existant...${NC}"
        pct stop $CTID 2>/dev/null || true
        pct destroy $CTID
    else
        echo -e "${RED}Annulé${NC}"
        exit 1
    fi
fi

# Télécharger le template Debian 12 si non présent
echo -e "${BLUE}📥 Vérification du template Debian 12...${NC}"
TEMPLATE="debian-12-standard_12.7-1_amd64.tar.zst"
TEMPLATE_PATH="/var/lib/vz/template/cache/$TEMPLATE"

if [[ ! -f "$TEMPLATE_PATH" ]]; then
    echo -e "${YELLOW}⬇️  Téléchargement du template Debian 12...${NC}"
    pveam download local $TEMPLATE || {
        echo -e "${YELLOW}⚠️  Tentative avec le repo Proxmox...${NC}"
        wget -q --show-progress "http://download.proxmox.com/images/system/$TEMPLATE" -O "$TEMPLATE_PATH" || {
            echo -e "${RED}❌ Impossible de télécharger le template${NC}"
            exit 1
        }
    }
fi

echo -e "${GREEN}✓ Template prêt${NC}"

# Créer le conteneur
echo -e "${BLUE}🔧 Création du conteneur LXC...${NC}"
pct create $CTID $TEMPLATE_PATH \
    --hostname $HOSTNAME \
    --storage $STORAGE \
    --memory $MEMORY \
    --cores $CORES \
    --rootfs ${DISK}G \
    --net0 "$NET_CONFIG" \
    --unprivileged 1 \
    --features nesting=1 \
    --onboot 1 \
    --ostype debian

if [[ $? -ne 0 ]]; then
    echo -e "${RED}❌ Erreur lors de la création du conteneur${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Conteneur créé${NC}"

# Configurer le conteneur pour Docker
echo -e "${BLUE}⚙️  Configuration du conteneur pour Docker...${NC}"

# Ajouter les lignes nécessaires au fichier de configuration du conteneur
CT_CONF="/etc/pve/lxc/${CTID}.conf"

# Vérifier si les lignes existent déjà
grep -q "lxc.cgroup2.devices.allow = c 10:200 rwm" "$CT_CONF" 2>/dev/null || {
    cat >> "$CT_CONF" << 'EOF'

# Configuration pour Docker
lxc.cgroup2.devices.allow = c 10:200 rwm
lxc.mount.entry = /dev/net/tun dev/net/tun none bind,create=file
lxc.apparmor.profile = unconfined
lxc.cgroup2.devices.allow = a
lxc.cap.drop =
EOF
}

echo -e "${GREEN}✓ Configuration appliquée${NC}"

# Démarrer le conteneur
echo -e "${BLUE}🚀 Démarrage du conteneur...${NC}"
pct start $CTID

# Attendre que le conteneur soit prêt
echo -e "${BLUE}⏳ Attente du démarrage...${NC}"
sleep 5

# Attendre que le réseau soit prêt
for i in {1..30}; do
    if pct exec $CTID -- ping -c 1 -W 1 8.8.8.8 &> /dev/null; then
        echo -e "${GREEN}✓ Réseau OK${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Obtenir l'IP du conteneur
CT_IP=$(pct exec $CTID -- hostname -I | awk '{print $1}')
echo -e "${GREEN}✓ IP du conteneur: $CT_IP${NC}"

# Mettre à jour le système et installer Docker
echo -e "${BLUE}📦 Installation de Docker...${NC}"
pct exec $CTID -- bash -c "
    export DEBIAN_FRONTEND=noninteractive
    
    # Mise à jour
    apt-get update
    apt-get upgrade -y
    
    # Installation des dépendances
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release \
        git \
        htop \
        nano \
        ufw
    
    # Ajouter la clé GPG officielle de Docker
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Ajouter le repo Docker
    echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \$(lsb_release -cs) stable\" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Installer Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Activer Docker au démarrage
    systemctl enable docker
    systemctl start docker
    
    # Créer le groupe docker
    groupadd -f docker
"

echo -e "${GREEN}✓ Docker installé${NC}"

# Cloner le repo et déployer
echo -e "${BLUE}🥋 Déploiement de l'application FEKM...${NC}"
pct exec $CTID -- bash -c "
    # Cloner le repo
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
    
    # Créer le fichier .env
    cat > .env << 'ENVFILE'
# Database
DATABASE_URL=postgresql://fekm:fekm123@postgres:5432/fekm

# NextAuth
NEXTAUTH_SECRET=change-this-secret-in-production-$(openssl rand -hex 16)
NEXTAUTH_URL=http://$CT_IP:3000

# Google OAuth (optionnel - à configurer)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# App
NEXT_PUBLIC_APP_NAME=FEKM Training
NEXT_PUBLIC_APP_URL=http://$CT_IP:3000
ENVFILE
    
    # Démarrer avec Docker Compose
    docker compose up --build -d
"

echo -e "${GREEN}✓ Application déployée${NC}"

# Attendre que tout soit prêt
echo -e "${BLUE}⏳ Attente du démarrage complet...${NC}"
sleep 10

# Vérifier que l'application répond
for i in {1..30}; do
    if pct exec $CTID -- curl -s http://localhost:3000/api/health &> /dev/null; then
        echo -e "${GREEN}✓ Application prête !${NC}"
        break
    fi
    if [[ $i -eq 30 ]]; then
        echo -e "${YELLOW}⚠️  L'application met du temps à démarrer...${NC}"
    fi
    echo -n "."
    sleep 2
done

# Afficher le récapitulatif
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  ✅ Déploiement terminé !            ${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${BLUE}📊 Informations:${NC}"
echo "  Conteneur ID: $CTID"
echo "  Hostname: $HOSTNAME"
echo "  IP: $CT_IP"
echo ""
echo -e "${BLUE}🌐 Accès à l'application:${NC}"
echo "  Local:     http://$CT_IP:3000"
echo "  Conteneur: http://localhost:3000 (depuis le CT)"
echo ""
echo -e "${BLUE}🔑 Compte de démo:${NC}"
echo "  Email: demo@fekm.com"
echo "  Mot de passe: demo123"
echo ""
echo -e "${BLUE}🛠️ Commandes utiles:${NC}"
echo "  Entrer dans le CT:     pct enter $CTID"
echo "  Logs application:      pct exec $CTID -- docker compose logs -f app"
echo "  Redémarrer app:        pct exec $CTID -- docker compose restart"
echo "  Arrêter app:           pct exec $CTID -- docker compose down"
echo "  Voir les processus:    pct exec $CTID -- docker ps"
echo ""
echo -e "${BLUE}📁 Fichiers:${NC}"
echo "  App: /opt/fekm-training"
echo "  Config: /opt/fekm-training/.env"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  - Modifier le NEXTAUTH_SECRET dans /opt/fekm-training/.env"
echo "  - Configurer le pare-feu si nécessaire: pct exec $CTID -- ufw allow 3000"
echo "  - Pour Google OAuth, configurer GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET"
echo ""

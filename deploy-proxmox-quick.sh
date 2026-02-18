#!/bin/bash
#
# Script de déploiement simplifié pour Proxmox LXC
# À exécuter sur l'hôte Proxmox (shell)
#

set -e

# Configuration
CTID="${1:-900}"
IP="${2:-dhcp}"
GATEWAY="${3:-}"
HOSTNAME="fekm-training"

echo "=========================================="
echo "  Déploiement FEKM Training (Proxmox)   "
echo "=========================================="
echo ""

# Vérification root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Ce script doit être exécuté en root"
   exit 1
fi

# Configuration réseau
if [[ "$IP" == "dhcp" ]]; then
    NET_CONFIG="name=eth0,bridge=vmbr0,ip=dhcp"
    echo "Mode: DHCP"
else
    if [[ -z "$GATEWAY" ]]; then
        echo "❌ Gateway requise pour IP statique"
        echo "Usage: $0 <CTID> <IP/CIDR> <GATEWAY>"
        echo "Exemple: $0 100 192.168.1.50/24 192.168.1.1"
        exit 1
    fi
    NET_CONFIG="name=eth0,bridge=vmbr0,ip=$IP,gw=$GATEWAY"
    echo "IP: $IP"
    echo "Gateway: $GATEWAY"
fi

echo "CT ID: $CTID"
echo ""

# Télécharger template si nécessaire
TEMPLATE="debian-12-standard_12.7-1_amd64.tar.zst"
if [[ ! -f "/var/lib/vz/template/cache/$TEMPLATE" ]]; then
    echo "📥 Téléchargement du template Debian 12..."
    pveam download local $TEMPLATE || {
        echo "❌ Erreur téléchargement. Essayez: pveam update"
        exit 1
    }
fi

# Supprimer CT existant
if pct status $CTID &> /dev/null; then
    echo "🗑️  Suppression du CT existant $CTID..."
    pct stop $CTID 2>/dev/null || true
    pct destroy $CTID
fi

# Créer le conteneur
echo "🔧 Création du conteneur..."
pct create $CTID "/var/lib/vz/template/cache/$TEMPLATE" \
    --hostname $HOSTNAME \
    --storage local-lvm \
    --memory 2048 \
    --cores 2 \
    --rootfs local-lvm:16 \
    --net0 "$NET_CONFIG" \
    --unprivileged 1 \
    --features nesting=1,keyctl=1 \
    --onboot 1

# Config pour Docker
cat >> "/etc/pve/lxc/${CTID}.conf" << 'EOF'
lxc.cgroup2.devices.allow = c 10:200 rwm
lxc.mount.entry = /dev/net/tun dev/net/tun none bind,create=file 0 0
lxc.apparmor.profile = unconfined
lxc.cgroup2.devices.allow = a
lxc.cap.drop =
EOF

# Démarrer
pct start $CTID
echo "⏳ Attente du démarrage..."
sleep 10

# Obtenir IP
CT_IP=$(pct exec $CTID -- hostname -I | awk '{print $1}')
echo "✓ Conteneur démarré (IP: $CT_IP)"

# Installation Docker et déploiement
echo "📦 Installation de Docker et déploiement..."
pct exec $CTID -- bash -c '
set -e
export DEBIAN_FRONTEND=noninteractive

# Mise à jour et dépendances essentielles
apt-get update && apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg git lsb-release

# Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Ajouter le repo Docker (utiliser bookworm car lsb_release est maintenant disponible)
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker

# Déploiement app
mkdir -p /opt
cd /opt
git clone https://github.com/tomwaro417/fekm-training.git
cd fekm-training

# Env
cat > .env << ENV_EOF
DATABASE_URL=postgresql://fekm:fekm123@postgres:5432/fekm
NEXTAUTH_SECRET=$(openssl rand -hex 32)
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=FEKM Training
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV_EOF

# Démarrer
docker compose up --build -d
'

echo ""
echo "=========================================="
echo "✅ DÉPLOIEMENT TERMINÉ !"
echo "=========================================="
echo ""
echo "🌐 URL: http://$CT_IP:3000"
echo ""
echo "🔑 Compte démo:"
echo "   demo@fekm.com / demo123"
echo ""
echo "🛠️ Commandes:"
echo "   Entrer CT: pct enter $CTID"
echo "   Logs:      pct exec $CTID -- docker compose logs -f"
echo "   Arrêter:   pct exec $CTID -- docker compose down"
echo ""

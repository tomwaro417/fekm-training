# 🖥️ Déploiement sur Proxmox (LXC)

Ce guide explique comment déployer l'application FEKM Training sur un serveur Proxmox dans un conteneur LXC.

## 📋 Prérequis

- Serveur Proxmox VE 7.x ou 8.x
- Accès root au serveur Proxmox
- Connexion Internet depuis le serveur Proxmox
- (Optionnel) Un bridge réseau configuré (généralement `vmbr0`)

---

## 🚀 Méthode 1 : Script Automatique (Recommandé)

### Option A : Avec IP statique

```bash
# Se connecter en SSH au serveur Proxmox
ssh root@ip-proxmox

# Télécharger et exécuter le script
curl -fsSL https://raw.githubusercontent.com/tomwaro417/fekm-training/main/deploy-proxmox-quick.sh -o deploy.sh
chmod +x deploy.sh

# Déployer avec IP statique
./deploy-proxmox-quick.sh 100 192.168.1.50/24 192.168.1.1
```

Paramètres :
- `100` : ID du conteneur (choisir un ID libre)
- `192.168.1.50/24` : IP/CIDR du conteneur
- `192.168.1.1` : Gateway (routeur)

### Option B : Avec DHCP

```bash
./deploy-proxmox-quick.sh 100 dhcp
```

Le conteneur obtiendra une IP automatiquement via DHCP.

---

## 🚀 Méthode 2 : Script Avancé (Plus de contrôle)

```bash
# Télécharger le script avancé
curl -fsSL https://raw.githubusercontent.com/tomwaro417/fekm-training/main/deploy-proxmox-lxc.sh -o deploy-advanced.sh
chmod +x deploy-advanced.sh

# Voir les options
./deploy-advanced.sh --help

# Exemple avec options personnalisées
./deploy-advanced.sh \
  --ctid 100 \
  --hostname fekm-training \
  --ip 192.168.1.50/24 \
  --gateway 192.168.1.1 \
  --memory 4096 \
  --cores 4 \
  --disk 32
```

### Options disponibles

| Option | Description | Défaut |
|--------|-------------|--------|
| `--ctid` | ID du conteneur | 900 |
| `--hostname` | Nom du conteneur | fekm-training |
| `--storage` | Storage Proxmox | local-lvm |
| `--memory` | RAM en MB | 2048 |
| `--cores` | Nombre de cœurs | 2 |
| `--disk` | Taille disque en GB | 16 |
| `--ip` | IP statique (CIDR) | DHCP |
| `--gateway` | Gateway | - |
| `--bridge` | Interface bridge | vmbr0 |

---

## 🔧 Méthode 3 : Manuel (Pas à pas)

### 1. Télécharger le template Debian 12

Depuis l'interface Proxmox ou en ligne de commande :

```bash
# En ligne de commande sur Proxmox
pveam update
pveam download local debian-12-standard_12.7-1_amd64.tar.zst
```

Ou via l'interface : **Datacenter → Storage → local → CT Templates → Templates → debian-12-standard**

### 2. Créer le conteneur

Via l'interface web Proxmox :

1. **Create CT** (en haut à droite)
2. **General** :
   - Node: (votre nœud)
   - CT ID: 100 (ou autre)
   - Hostname: fekm-training
   - Unprivileged container: ✅ Coché
3. **Template** :
   - Storage: local
   - Template: debian-12-standard_12.7-1_amd64.tar.zst
4. **Disks** :
   - Storage: local-lvm
   - Disk size: 16 GB
5. **CPU** :
   - Cores: 2
6. **Memory** :
   - Memory: 2048 MB
   - Swap: 512 MB
7. **Network** :
   - Bridge: vmbr0
   - IPv4: DHCP (ou Static)
8. **Confirm** → **Finish**

### 3. Configurer pour Docker

Dans l'interface Proxmox, sélectionner le conteneur → **Options** → **Features** :
- Activer **nesting** (cocher)

Ou en ligne de commande :

```bash
CTID=100

# Éditer la configuration
echo "lxc.cgroup2.devices.allow = c 10:200 rwm
lxc.mount.entry = /dev/net/tun dev/net/tun none bind,create=file
lxc.apparmor.profile = unconfined
lxc.cgroup2.devices.allow = a
lxc.cap.drop =" >> /etc/pve/lxc/${CTID}.conf
```

### 4. Démarrer et configurer

```bash
CTID=100

# Démarrer
pct start $CTID

# Entrer dans le conteneur
pct enter $CTID

# À l'intérieur du conteneur :

# Mettre à jour
apt update && apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com | sh

# Installer Docker Compose
apt install -y docker-compose-plugin

# Ajouter l'utilisateur au groupe docker
usermod -aG docker root

# Cloner l'application
cd /opt
git clone https://github.com/tomwaro417/fekm-training.git
cd fekm-training

# Configurer
cp .env.example .env
# Éditer .env si nécessaire

# Lancer
docker compose up -d
```

### 5. Vérifier

```bash
# Voir les logs
docker compose logs -f

# Vérifier que ça tourne
docker ps
```

---

## 🌐 Accès après déploiement

### Trouver l'IP du conteneur

```bash
CTID=100
pct exec $CTID -- hostname -I
```

Ou via l'interface Proxmox : sélectionner le conteneur → **Summary**

### Accéder à l'application

Ouvrir dans un navigateur :
```
http://IP_DU_CONTENEUR:3000
```

Exemple : `http://192.168.1.50:3000`

---

## 🔧 Gestion du conteneur

### Commandes utiles

```bash
CTID=100

# Démarrer
pct start $CTID

# Arrêter
pct stop $CTID

# Redémarrer
pct reboot $CTID

# Entrer dans le conteneur
pct enter $CTID

# Exécuter une commande
pct exec $CTID -- docker ps

# Voir les logs de l'app
pct exec $CTID -- docker compose -C /opt/fekm-training logs -f

# Sauvegarde
vzdump $CTID --compress zstd --storage local

# Restaurer
qmrestore /var/lib/vz/dump/vzdump-lxc-${CTID}-*.tar.zst $CTID
```

### Gestion de l'application

```bash
# Entrer dans le CT
pct enter $CTID
cd /opt/fekm-training

# Voir les logs
docker compose logs -f

# Redémarrer l'app
docker compose restart

# Mettre à jour (pull + rebuild)
git pull
docker compose down
docker compose up --build -d

# Arrêter
docker compose down

# Sauvegarder la base de données
docker compose exec postgres pg_dump -U fekm fekm > backup.sql
```

---

## 🔒 Configuration du pare-feu

Si vous utilisez le pare-feu Proxmox :

### Via interface web

**Datacenter → Firewall → Add**

Règles à ajouter :
- Port 3000 (TCP) : Accès application
- Port 22 (TCP) : SSH (si besoin d'accès externe)

### Via ligne de commande (dans le CT)

```bash
pct enter $CTID

# Activer UFW
ufw allow 3000/tcp
ufw allow 22/tcp  # Si SSH externe
ufw enable
```

---

## 💾 Sauvegarde et restauration

### Sauvegarde complète du CT

```bash
# Backup
vzdump 100 --mode snapshot --compress zstd --storage local

# La backup est dans /var/lib/vz/dump/
ls -la /var/lib/vz/dump/
```

### Restauration

```bash
# Lister les backups
ls -la /var/lib/vz/dump/

# Restaurer
qmrestore /var/lib/vz/dump/vzdump-lxc-100-*.tar.zst 100
```

### Sauvegarde uniquement des données

```bash
CTID=100

# Backup base de données
pct exec $CTID -- docker compose -C /opt/fekm-training exec -T postgres pg_dump -U fekm fekm > fekm-backup-$(date +%Y%m%d).sql

# Backup vidéos
pct exec $CTID -- tar -czf /tmp/fekm-videos.tar.gz /opt/fekm-training/uploads
pct pull $CTID /tmp/fekm-videos.tar.gz ./fekm-videos.tar.gz
```

---

## 🐛 Dépannage

### Problème : Docker ne démarre pas dans le CT

```bash
# Vérifier que nesting est activé
cat /etc/pve/lxc/${CTID}.conf | grep nesting

# Si non, ajouter :
echo "features: nesting=1" >> /etc/pve/lxc/${CTID}.conf

# Redémarrer le CT
pct stop $CTID
pct start $CTID
```

### Problème : "Cannot connect to the Docker daemon"

```bash
# Dans le CT
systemctl status docker
systemctl restart docker
```

### Problème : Port 3000 déjà utilisé

```bash
# Vérifier
pct exec $CTID -- netstat -tlnp | grep 3000

# Ou changer le port dans docker-compose.yml
# ports:
#   - "8080:3000"  # Au lieu de "3000:3000"
```

### Problème : Accès impossible depuis le réseau

1. Vérifier l'IP du CT : `pct exec $CTID -- hostname -I`
2. Vérifier que le firewall Proxmox autorise le port 3000
3. Vérifier que le CT a accès au réseau : `pct exec $CTID -- ping 8.8.8.8`

---

## 📊 Ressources recommandées

| Ressource | Minimum | Recommandé |
|-----------|---------|------------|
| RAM | 2 GB | 4 GB |
| CPU | 2 cœurs | 4 cœurs |
| Disque | 16 GB | 32 GB |
| Réseau | 100 Mbps | 1 Gbps |

---

## 🔄 Mise à jour de l'application

```bash
CTID=100

# Entrer dans le CT
pct enter $CTID
cd /opt/fekm-training

# Pull les dernières modifications
git pull

# Rebuild et redémarrer
docker compose down
docker compose up --build -d

# Vérifier
docker compose logs -f
```

---

## 📞 Support

En cas de problème :
1. Vérifier les logs : `pct exec $CTID -- docker compose logs`
2. Vérifier l'état du CT : `pct status $CTID`
3. Redémarrer le CT : `pct reboot $CTID`

---

**Temps de déploiement estimé** : 5-10 minutes selon la connexion Internet.

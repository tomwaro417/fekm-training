#!/bin/bash
# Script de déploiement FEKM Training

echo "🚀 Déploiement FEKM Training..."

# Aller dans le répertoire du projet
cd /home/tomwaro/.openclaw/workspace/fekm-training

# Installer les dépendances
echo "📦 Installation des dépendances..."
pnpm install

# Générer le client Prisma
echo "🗄️  Génération du client Prisma..."
npx prisma generate

# Builder l'application
echo "🔨 Build de l'application..."
pnpm build

# Créer le dossier uploads s'il n'existe pas
mkdir -p uploads/videos
chmod -R 755 uploads

echo "✅ Build terminé !"
echo ""
echo "Pour démarrer l'application :"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "Ou en mode développement :"
echo "  pnpm dev"

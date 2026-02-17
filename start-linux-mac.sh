#!/bin/bash

echo "==================================="
echo " FEKM Training - Installation Locale"
echo "==================================="
echo ""

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé."
    echo ""
    echo "Veuillez installer Docker :"
    echo "https://docs.docker.com/get-docker/"
    echo ""
    exit 1
fi

echo "✅ Docker trouvé"
echo ""

# Vérifier si Docker Compose est disponible
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas disponible."
    exit 1
fi

echo "✅ Docker Compose trouvé"
echo ""

# Lancer les conteneurs
echo "🚀 Démarrage de l'application..."
if ! docker compose up --build -d; then
    echo "❌ Une erreur s'est produite lors du démarrage."
    exit 1
fi

echo ""
echo "==================================="
echo "✅ Installation terminée !"
echo "==================================="
echo ""
echo "📱 L'application est accessible sur :"
echo "   http://localhost:3000"
echo ""
echo "🔑 Compte de démo :"
echo "   Email : demo@fekm.com"
echo "   Mot de passe : demo123"
echo ""
echo "🛑 Pour arrêter l'application :"
echo "   docker compose down"
echo ""

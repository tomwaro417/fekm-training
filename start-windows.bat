@echo off
chcp 65001 >nul
echo ===================================
echo  FEKM Training - Installation Locale
echo ===================================
echo.

REM Vérifier si Docker est installé
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas installé.
    echo.
    echo Veuillez installer Docker Desktop :
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo ✅ Docker trouvé
echo.

REM Vérifier si Docker Compose est disponible
docker compose version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose n'est pas disponible.
    pause
    exit /b 1
)

echo ✅ Docker Compose trouvé
echo.

REM Lancer les conteneurs
echo 🚀 Démarrage de l'application...
docker compose up --build -d

if errorlevel 1 (
    echo ❌ Une erreur s'est produite lors du démarrage.
    pause
    exit /b 1
)

echo.
echo ===================================
echo ✅ Installation terminée !
echo ===================================
echo.
echo 📱 L'application est accessible sur :
echo    http://localhost:3000
echo.
echo 🔑 Compte de démo :
echo    Email : demo@fekm.com
echo    Mot de passe : demo123
echo.
echo 🛑 Pour arrêter l'application :
echo    docker compose down
echo.
pause

# 🚀 Guide d'Installation Locale

Ce guide explique comment installer l'application FEKM Training sur un PC local pour tester.

## 📋 Prérequis

- **Docker Desktop** (recommandé) : https://www.docker.com/products/docker-desktop
- Ou **Node.js 20+** et **PostgreSQL 14+**

---

## 🐳 Méthode 1 : Docker (Recommandée - 5 minutes)

C'est la méthode la plus simple. Tout est pré-configuré.

### Windows

1. **Installer Docker Desktop** : https://www.docker.com/products/docker-desktop
2. **Cloner le projet** :
   ```bash
   git clone https://github.com/tomwaro417/fekm-training.git
   cd fekm-training
   ```
3. **Double-cliquer sur** : `start-windows.bat`
4. **Attendre** que l'installation se termine (~5 minutes)
5. **Ouvrir** : http://localhost:3000

### Linux / Mac

1. **Installer Docker** : https://docs.docker.com/get-docker/
2. **Cloner le projet** :
   ```bash
   git clone https://github.com/tomwaro417/fekm-training.git
   cd fekm-training
   ```
3. **Lancer le script** :
   ```bash
   ./start-linux-mac.sh
   ```
4. **Attendre** que l'installation se termine (~5 minutes)
5. **Ouvrir** : http://localhost:3000

### Commandes Docker utiles

```bash
# Démarrer l'application
docker compose up -d

# Démarrer avec rebuild (après modification du code)
docker compose up --build -d

# Voir les logs
docker compose logs -f app

# Arrêter l'application
docker compose down

# Arrêter et supprimer les données
docker compose down -v

# Accéder à la base de données
docker compose exec postgres psql -U fekm -d fekm
```

---

## 💻 Méthode 2 : Installation Manuelle

Si vous préférez ne pas utiliser Docker.

### Prérequis

- Node.js 20+ : https://nodejs.org
- PostgreSQL 14+ : https://postgresql.org
- pnpm : `npm install -g pnpm`

### Étapes

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/tomwaro417/fekm-training.git
   cd fekm-training
   ```

2. **Installer les dépendances** :
   ```bash
   pnpm install
   ```

3. **Créer la base de données** :
   ```bash
   # Sur Windows avec psql
   psql -U postgres -c "CREATE DATABASE fekm;"
   psql -U postgres -c "CREATE USER fekm WITH PASSWORD 'fekm123';"
   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE fekm TO fekm;"
   
   # Ou avec pgAdmin, créer une base "fekm"
   ```

4. **Configurer l'environnement** :
   ```bash
   cp .env.example .env
   ```
   
   Éditer `.env` :
   ```env
   DATABASE_URL="postgresql://fekm:fekm123@localhost:5432/fekm"
   NEXTAUTH_SECRET="votre-secret-aleatoire-de-32-caracteres"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID=""  # Optionnel
   GOOGLE_CLIENT_SECRET=""  # Optionnel
   ```

5. **Initialiser la base de données** :
   ```bash
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed
   ```

6. **Lancer l'application** :
   ```bash
   pnpm dev
   ```

7. **Ouvrir** : http://localhost:3000

---

## 🌐 Accès depuis d'autres appareils du réseau

Par défaut, l'application est accessible uniquement sur `localhost`. Pour y accéder depuis d'autres appareils du même réseau :

### Méthode Docker

Modifier `docker-compose.yml` :
```yaml
services:
  app:
    # ...
    ports:
      - "0.0.0.0:3000:3000"  # Au lieu de "3000:3000"
```

Puis redémarrer :
```bash
docker compose down
docker compose up -d
```

### Méthode Manuelle (Next.js)

```bash
# Au lieu de pnpm dev
pnpm dev --hostname 0.0.0.0
```

### Trouver l'IP du PC

**Windows** :
```cmd
ipconfig
```

**Linux/Mac** :
```bash
ip addr show
# ou
ifconfig
```

Puis accéder depuis un autre appareil : `http://192.168.x.x:3000`

---

## 🔑 Comptes de test

### Compte démo
- **Email** : `demo@fekm.com`
- **Mot de passe** : `demo123`

### Créer un compte admin
```bash
# Se connecter à la base
docker compose exec postgres psql -U fekm -d fekm

# Créer un admin
INSERT INTO "User" (id, email, name, "role", "emailVerified", image, password) 
VALUES (gen_random_uuid(), 'admin@fekm.com', 'Admin', 'ADMIN', NOW(), NULL, NULL);
```

---

## 🛠️ Dépannage

### Problème : "Port 3000 already in use"
```bash
# Sur Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Sur Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Problème : "Database connection failed"
```bash
# Vérifier que PostgreSQL est en cours
docker compose ps

# Redémarrer juste la base
docker compose restart postgres
```

### Problème : "Migration failed"
```bash
# Réinitialiser la base
docker compose down -v
docker compose up -d
```

---

## 📁 Structure après installation

```
fekm-training/
├── docker-compose.yml      # Configuration Docker
├── Dockerfile              # Image Docker
├── start-windows.bat       # Script Windows
├── start-linux-mac.sh      # Script Linux/Mac
├── .env                    # Configuration (à créer)
├── .env.example            # Exemple de configuration
├── prisma/
│   ├── schema.prisma       # Modèle de données
│   └── seed.ts             # Données initiales
├── src/
│   ├── app/                # Routes Next.js
│   ├── components/         # Composants React
│   └── lib/                # Librairies
└── ...
```

---

## 🆘 Support

En cas de problème :
1. Vérifier les logs : `docker compose logs -f app`
2. Vérifier que tous les ports sont libres (3000, 5432)
3. Redémarrer Docker Desktop

---

**Temps d'installation estimé** : 5-10 minutes avec Docker, 15-20 minutes en manuel.

# 🥋 FEKM Training - Backend APIs

APIs backend pour la plateforme de formation FEKM (Fédération Européenne de Krav Maga).

## 📁 Structure des Fichiers

```
fekm-training/
├── src/
│   ├── pages/api/
│   │   ├── videos/
│   │   │   ├── upload.ts          # POST /api/videos/upload
│   │   │   └── [id]/
│   │   │       ├── stream.ts      # GET /api/videos/[id]/stream
│   │   │       └── download.ts    # GET /api/videos/[id]/download
│   │   ├── admin/
│   │   │   └── users/
│   │   │       └── [id]/
│   │   │           └── belt.ts    # PATCH /api/admin/users/[id]/belt
│   │   ├── instructor/
│   │   │   └── students.ts        # GET /api/instructor/students
│   │   └── progress/
│   │       └── batch.ts           # POST /api/progress/batch
│   └── lib/
│       ├── validation-schemas.ts  # Schémas Zod réutilisables
│       ├── api-middleware.ts      # Middleware d'auth et helpers
│       └── api-config.ts          # Configuration
├── prisma/
│   └── schema.prisma.example      # Schéma Prisma de référence
├── API_DOCUMENTATION.md           # Documentation complète des endpoints
└── README.md                      # Ce fichier
```

## 🚀 Installation

### 1. Prérequis

- Node.js 18+
- PostgreSQL 14+
- Redis (Upstash ou local)

### 2. Installation des dépendances

```bash
# Créer le projet Next.js (si nouveau)
pnpx create-next-app@latest fekm-training --typescript --tailwind --eslint --app --src-dir

# Installer les dépendances
pnpm add formidable @upstash/ratelimit @upstash/redis uuid zod next-auth
pnpm add -D @types/formidable @types/uuid prisma

# Initialiser Prisma
pnpx prisma init
```

### 3. Configuration

Créer le fichier `.env.local`:

```bash
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/fekm_training"

# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="https://your-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Stockage vidéo
VIDEO_UPLOAD_DIR="/var/www/fekm-training/videos"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="your-jwt-secret"
```

### 4. Configuration Prisma

Copier le schéma:
```bash
cp prisma/schema.prisma.example prisma/schema.prisma
```

Puis générer le client:
```bash
pnpx prisma generate
pnpx prisma db push
```

### 5. Configuration Next.js

Mettre à jour `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '2gb',
    },
    responseLimit: false,
  },
  async headers() {
    return [
      {
        source: '/videos/:path*',
        headers: [
          { key: 'Accept-Ranges', value: 'bytes' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 6. Créer le dossier d'upload

```bash
sudo mkdir -p /var/www/fekm-training/videos
sudo chown -R $USER:$USER /var/www/fekm-training
```

## 🧪 Tests

### Test des endpoints avec httpie

```bash
# Upload vidéo (instructeur/admin)
http -f POST localhost:3000/api/videos/upload \
  Authorization:"Bearer TOKEN" \
  video@/path/to/video.mp4 \
  title="Technique de base" \
  beltLevel="WHITE" \
  category="TECHNIQUE" \
  isPublic="true"

# Streaming vidéo
http GET localhost:3000/api/videos/UUID/stream \
  Authorization:"Bearer TOKEN" \
  Range:"bytes=0-1024"

# Téléchargement
http GET localhost:3000/api/videos/UUID/download \
  Authorization:"Bearer TOKEN"

# Assigner une ceinture (admin)
http PATCH localhost:3000/api/admin/users/UUID/belt \
  Authorization:"Bearer TOKEN" \
  beltLevel="YELLOW" \
  notes="Examen réussi"

# Liste des élèves (instructeur)
http GET localhost:3000/api/instructor/students \
  Authorization:"Bearer TOKEN" \
  page==1 \
  limit==20 \
  beltLevel==YELLOW

# Mise à jour batch progression
http POST localhost:3000/api/progress/batch \
  Authorization:"Bearer TOKEN" \
  items:='[{"videoId":"UUID","progress":100,"completed":true}]'
```

## 🔒 Sécurité

- ✅ Authentification JWT via NextAuth
- ✅ Rate limiting par endpoint et utilisateur
- ✅ Validation stricte des entrées (Zod)
- ✅ Vérification des permissions par rôle
- ✅ Protection contre les injections SQL (Prisma)
- ✅ Headers de sécurité pour le streaming

## 📊 Rate Limits

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| POST /api/videos/upload | 5 | 1 minute |
| GET /api/videos/[id]/stream | Illimité* | - |
| GET /api/videos/[id]/download | 10/vidéo | 1 minute |
| PATCH /api/admin/users/[id]/belt | 20 | 1 minute |
| GET /api/instructor/students | 30 | 1 minute |
| POST /api/progress/batch | 50 | 1 minute |

*Le streaming utilise les headers de cache du navigateur

## 📝 TODO

- [ ] Implémenter la file de traitement vidéo (transcodage)
- [ ] Ajouter la génération de thumbnails
- [ ] WebSocket pour notifications temps réel
- [ ] Tests unitaires (Vitest)
- [ ] Tests E2E (Playwright)
- [ ] Documentation OpenAPI/Swagger

## 📚 Documentation

Voir [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) pour la documentation complète des endpoints.

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js API   │
│     Routes      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│  Auth  │ │ Validation│
│Middleware│ │  (Zod)   │
└────┬───┘ └────┬─────┘
     │          │
     └────┬─────┘
          ▼
    ┌──────────┐
    │  Prisma  │
    │   ORM    │
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │PostgreSQL│
    └──────────┘
```

## 🤝 Contribution

Ces APIs sont développées par l'équipe Morpheus pour FEKM Training.

---

**Développé avec ❤️ par Morpheus**

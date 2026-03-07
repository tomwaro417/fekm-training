# APIs FEKM Training - Documentation

## Vue d'ensemble

Cette documentation décrit les APIs RESTful pour la plateforme FEKM Training, une application de formation en arts martiaux.

## Stack Technique

- **Framework**: Next.js API Routes
- **Base de données**: PostgreSQL + Prisma ORM
- **Authentification**: NextAuth.js (JWT)
- **Rate Limiting**: Upstash Redis
- **Validation**: Zod

---

## Endpoints

### 1. POST /api/videos/upload

Upload d'une vidéo avec support des gros fichiers (jusqu'à 2GB).

#### Authentification Requise
- **Rôles**: `INSTRUCTOR`, `ADMIN`

#### Rate Limiting
- 5 uploads par minute par utilisateur

#### Request

**Content-Type**: `multipart/form-data`

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `video` | File | ✅ | Fichier vidéo (mp4, webm, mov) |
| `title` | string | ✅ | Titre (max 200 caractères) |
| `description` | string | ❌ | Description (max 2000 caractères) |
| `beltLevel` | enum | ✅ | `WHITE`, `YELLOW`, `ORANGE`, `GREEN`, `BLUE`, `BROWN`, `BLACK` |
| `category` | enum | ✅ | `TECHNIQUE`, `KATA`, `KUMITE`, `PHYSICAL`, `THEORY` |
| `tags` | string (JSON) | ❌ | Tableau de tags stringifié |
| `isPublic` | string | ✅ | `"true"` ou `"false"` |

#### Response

**201 Created**
```json
{
  "success": true,
  "video": {
    "id": "uuid",
    "title": "Nom de la vidéo",
    "fileUrl": "/videos/uuid.mp4",
    "status": "PROCESSING",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Codes**
- `400` - Données invalides ou fichier manquant
- `401` - Non authentifié
- `403` - Accès interdit (rôle insuffisant)
- `413` - Fichier trop volumineux (>2GB)
- `415` - Type de fichier non supporté
- `429` - Trop de requêtes
- `500` - Erreur serveur

---

### 2. GET /api/videos/[id]/stream

Streaming vidéo avec support des Range Requests pour la lecture adaptative.

#### Authentification Requise
- **Rôles**: `STUDENT`, `INSTRUCTOR`, `ADMIN`
- **Accès**: Selon niveau de ceinture et permissions

#### Headers de Requête

| Header | Description |
|--------|-------------|
| `Range` | Optionnel - Pour le streaming partiel (ex: `bytes=0-1024`) |
| `Authorization` | Bearer token JWT |

#### Response

**200 OK** (Streaming complet)
- Headers: `Content-Type`, `Content-Length`, `Accept-Ranges: bytes`

**206 Partial Content** (Avec Range header)
- Headers: `Content-Range: bytes start-end/total`, `Content-Length`

**Error Codes**
- `400` - ID vidéo invalide
- `401` - Non authentifié
- `403` - Accès interdit (niveau de ceinture insuffisant)
- `404` - Vidéo non trouvée
- `416` - Range non satisfiable

---

### 3. GET /api/videos/[id]/download

Téléchargement d'une vidéo avec vérification des permissions.

#### Authentification Requise
- **Rôles**: `STUDENT`, `INSTRUCTOR`, `ADMIN`
- **Accès**: Selon niveau de ceinture et permissions

#### Rate Limiting
- 10 téléchargements par minute par vidéo/utilisateur

#### Headers de Requête

| Header | Description |
|--------|-------------|
| `Authorization` | Bearer token JWT |

#### Response

**200 OK**
- Headers: `Content-Disposition: attachment`, `Content-Type`, `Content-Length`
- Body: Fichier vidéo binaire

**Error Codes**
- `400` - ID vidéo invalide
- `401` - Non authentifié
- `403` - Accès interdit
- `404` - Vidéo non trouvée
- `429` - Trop de téléchargements

---

### 4. PATCH /api/admin/users/[id]/belt

Assignation ou mise à jour du niveau de ceinture d'un élève.

#### Authentification Requise
- **Rôles**: `ADMIN` uniquement

#### Rate Limiting
- 20 modifications par minute

#### Request

**Content-Type**: `application/json`

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `beltLevel` | enum | ✅ | `WHITE`, `YELLOW`, `ORANGE`, `GREEN`, `BLUE`, `BROWN`, `BLACK` |
| `promotionDate` | string (ISO 8601) | ❌ | Date de promotion (défaut: maintenant) |
| `promotedBy` | string (UUID) | ❌ | ID de l'instructeur promoteur |
| `notes` | string | ❌ | Notes sur la promotion (max 1000 caractères) |

#### Response

**200 OK**
```json
{
  "success": true,
  "message": "Ceinture mise à jour avec succès",
  "data": {
    "user": {
      "id": "uuid",
      "email": "eleve@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "beltLevel": "YELLOW",
      "beltPromotedAt": "2024-01-15T10:30:00Z"
    },
    "promotion": {
      "previousBelt": "WHITE",
      "newBelt": "YELLOW",
      "promotedAt": "2024-01-15T10:30:00Z",
      "promotedBy": "uuid-instructeur"
    },
    "historyId": "uuid-historique"
  }
}
```

**Error Codes**
- `400` - Données invalides ou progression non autorisée
- `401` - Non authentifié
- `403` - Accès interdit (admin requis)
- `404` - Utilisateur non trouvé
- `429` - Trop de requêtes

#### Règles de Progression
- Impossible de rétrograder (ex: BLACK → BROWN)
- Maximum 1 niveau à la fois (sauf override admin)
- Création automatique d'une notification pour l'élève
- Historique conservé dans `BeltHistory`

---

### 5. GET /api/instructor/students

Liste des élèves avec leurs statistiques de progression.

#### Authentification Requise
- **Rôles**: `INSTRUCTOR`, `ADMIN`

#### Rate Limiting
- 30 requêtes par minute

#### Query Parameters

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | number | 1 | Numéro de page |
| `limit` | number | 20 | Éléments par page (max 100) |
| `search` | string | - | Recherche par nom/email |
| `beltLevel` | enum | - | Filtrer par niveau de ceinture |
| `sortBy` | string | `name` | `name`, `beltLevel`, `progress`, `lastActive` |
| `sortOrder` | string | `asc` | `asc`, `desc` |

#### Response

**200 OK**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "uuid",
        "email": "eleve@example.com",
        "firstName": "Jean",
        "lastName": "Dupont",
        "fullName": "Jean Dupont",
        "beltLevel": "YELLOW",
        "beltPromotedAt": "2024-01-15T10:30:00Z",
        "joinedAt": "2023-06-01T08:00:00Z",
        "lastActiveAt": "2024-01-15T14:20:00Z",
        "stats": {
          "totalVideosWatched": 45,
          "progressPercentage": 67
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalCount": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "beltLevel": null,
      "search": null
    },
    "sort": {
      "by": "name",
      "order": "asc"
    }
  }
}
```

**Error Codes**
- `400` - Paramètres de requête invalides
- `401` - Non authentifié
- `403` - Accès interdit
- `429` - Trop de requêtes

---

### 6. POST /api/progress/batch

Mise à jour batch de la progression de visionnage des vidéos.

#### Authentification Requise
- **Rôles**: `STUDENT`, `INSTRUCTOR`, `ADMIN`

#### Rate Limiting
- 50 mises à jour batch par minute

#### Request

**Content-Type**: `application/json`

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `items` | array | ✅ | Liste des mises à jour (max 100) |
| `items[].videoId` | string (UUID) | ✅ | ID de la vidéo |
| `items[].progress` | number | ✅ | Pourcentage (0-100) |
| `items[].completed` | boolean | ✅ | Vidéo terminée ? |
| `items[].watchedDuration` | number | ❌ | Secondes regardées |
| `items[].totalDuration` | number | ❌ | Durée totale en secondes |
| `items[].lastPosition` | number | ❌ | Dernière position en secondes |
| `syncTimestamp` | string (ISO 8601) | ❌ | Timestamp de synchronisation |

#### Response

**200 OK**
```json
{
  "success": true,
  "message": "Progression mise à jour avec succès",
  "data": {
    "processed": 5,
    "completed": 3,
    "inProgress": 2,
    "items": [
      {
        "videoId": "uuid-1",
        "progressId": "uuid-progress",
        "status": "updated"
      }
    ],
    "syncTimestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Error Codes**
- `400` - Données invalides
- `401` - Non authentifié
- `403` - Accès interdit à certaines vidéos
- `409` - Conflit de données
- `429` - Trop de requêtes

---

## Codes d'Erreur Communs

| Code | Description |
|------|-------------|
| `400` | Bad Request - Données invalides |
| `401` | Unauthorized - Authentification requise |
| `403` | Forbidden - Permissions insuffisantes |
| `404` | Not Found - Ressource non trouvée |
| `405` | Method Not Allowed - Méthode HTTP non supportée |
| `409` | Conflict - Conflit de données |
| `413` | Payload Too Large - Fichier trop volumineux |
| `415` | Unsupported Media Type - Type de fichier non supporté |
| `416` | Range Not Satisfiable - Range invalide |
| `429` | Too Many Requests - Rate limit dépassé |
| `500` | Internal Server Error - Erreur serveur |

---

## Schéma Prisma (Référence)

```prisma
model Video {
  id          String   @id @default(uuid())
  title       String
  description String?
  fileUrl     String
  fileSize    Int
  fileType    String
  beltLevel   String   // WHITE, YELLOW, ORANGE, GREEN, BLUE, BROWN, BLACK
  category    String   // TECHNIQUE, KATA, KUMITE, PHYSICAL, THEORY
  tags        String[] @default([])
  isPublic    Boolean  @default(false)
  status      String   @default("PROCESSING") // PROCESSING, READY, ERROR
  uploadedBy  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model VideoProgress {
  id              String   @id @default(uuid())
  userId          String
  videoId         String
  progress        Int      @default(0) // 0-100
  completed       Boolean  @default(false)
  watchedDuration Int?
  totalDuration   Int?
  lastPosition    Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, videoId])
}

model BeltHistory {
  id           String   @id @default(uuid())
  userId       String
  previousBelt String
  newBelt      String
  promotedAt   DateTime
  promotedBy   String
  notes        String?
  createdAt    DateTime @default(now())
}
```

---

## Variables d'Environnement Requises

```bash
# Base de données
DATABASE_URL="postgresql://user:pass@localhost:5432/fekm_training"

# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Stockage vidéo
VIDEO_UPLOAD_DIR="/var/www/fekm-training/videos"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Notes d'Implémentation

### Streaming Vidéo
- Support natif des Range Requests pour la lecture adaptative
- Headers de cache optimisés pour les navigateurs
- Gestion des erreurs de stream avec fermeture propre

### Upload de Fichiers
- Utilisation de `formidable` pour parser les multipart
- Limite de 2GB par fichier
- Validation du type MIME (video/*)
- Génération automatique de noms de fichiers uniques (UUID)

### Sécurité
- Vérification des permissions à chaque requête
- Rate limiting par utilisateur et par endpoint
- Validation stricte des entrées avec Zod
- Protection contre les injections SQL via Prisma

### Performance
- Transactions Prisma pour les opérations batch
- Upsert pour éviter les conflits de données
- Pagination sur les listes
- Indexation recommandée sur `userId`, `videoId`, `beltLevel`

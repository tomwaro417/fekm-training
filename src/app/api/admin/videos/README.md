# API Admin Vidéos - Documentation

Ce dossier contient les routes API pour la gestion des vidéos côté administrateur.

## 📁 Structure

```
app/api/admin/videos/
├── route.ts              # GET /api/admin/videos - Liste toutes les vidéos
├── upload/
│   └── route.ts          # POST /api/admin/videos/upload - Upload vidéo
└── [id]/
    ├── route.ts          # GET/PATCH/DELETE - Gestion d'une vidéo
    └── link/
        └── route.ts      # GET/POST/DELETE - Gestion des liens technique
```

---

## 🔌 Endpoints

### GET /api/admin/videos
Liste paginée de toutes les vidéos avec filtres.

**Query Parameters:**
```typescript
{
  page?: number        // Page courante (default: 1)
  limit?: number       // Éléments par page (default: 20)
  search?: string      // Recherche par nom/titre
  type?: 'COACH' | 'DEMONSTRATION'  // Filtrer par type
  status?: 'PROCESSING' | 'READY' | 'ERROR'  // Filtrer par statut
  unlinked?: boolean   // Afficher uniquement les vidéos non liées
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "uuid",
        "filename": "abc123.mp4",
        "title": "Démonstration frappe de face",
        "description": "...",
        "duration": 120,
        "size": 52428800,
        "createdAt": "2026-03-09T10:00:00Z",
        "type": "COACH",
        "status": "READY",
        "thumbnailUrl": "/thumbnails/abc123.jpg",
        "tags": ["frappe", "jaune"],
        "technique": {
          "id": "uuid",
          "name": "Frappe de face",
          "module": {
            "code": "UV1",
            "belt": { "name": "JAUNE", "color": "#FFD700" }
          }
        },
        "uploadedBy": { "name": "Admin User" },
        "viewCount": 42
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### POST /api/admin/videos/upload
Upload d'une nouvelle vidéo.

**Content-Type:** `multipart/form-data`

**Body Parameters:**
```typescript
{
  file: File              // Fichier vidéo (max 500MB)
  techniqueId?: string    // ID de la technique à lier (optionnel)
  title?: string          // Titre personnalisé
  description?: string    // Description
  type?: 'COACH' | 'DEMONSTRATION'  // Type (default: COACH)
  isPublic?: boolean      // Visibilité publique
  tags?: string           // JSON stringifié ou CSV
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vidéo uploadée avec succès",
  "data": {
    "video": {
      "id": "uuid",
      "filename": "abc123.mp4",
      "originalName": "ma-video.mp4",
      "mimeType": "video/mp4",
      "size": 52428800,
      "sizeFormatted": "50 MB",
      "path": "uploads/videos/abc123.mp4",
      "createdAt": "2026-03-09T10:00:00Z"
    },
    "techniqueLink": {
      "id": "uuid",
      "techniqueId": "uuid",
      "videoId": "uuid",
      "type": "COACH",
      "technique": { "id": "uuid", "name": "..." }
    },
    "metadata": {
      "title": "...",
      "description": "...",
      "type": "COACH",
      "isPublic": false,
      "tags": ["tag1", "tag2"]
    }
  }
}
```

**Erreurs possibles:**
- `400` - Type de fichier non supporté
- `400` - Fichier trop volumineux (>500MB)
- `401` - Non autorisé
- `404` - Technique non trouvée

---

### GET /api/admin/videos/[id]
Détail d'une vidéo spécifique.

**Response:**
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "uuid",
      "filename": "abc123.mp4",
      "originalName": "ma-video.mp4",
      "title": "...",
      "description": "...",
      "duration": 120,
      "size": 52428800,
      "createdAt": "...",
      "updatedAt": "...",
      "type": "COACH",
      "status": "READY",
      "thumbnailUrl": "...",
      "tags": ["tag1"],
      "technique": { ... },
      "uploadedBy": { "id": "uuid", "name": "..." },
      "viewCount": 42
    }
  }
}
```

---

### PATCH /api/admin/videos/[id]
Modification des métadonnées d'une vidéo.

**Body:**
```typescript
{
  title?: string        // Titre personnalisé
  description?: string  // Description
  tags?: string[]       // Tags
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vidéo modifiée avec succès",
  "data": { "video": { ... } }
}
```

---

### DELETE /api/admin/videos/[id]
Suppression d'une vidéo et de son fichier.

**Response:**
```json
{
  "success": true,
  "message": "Vidéo supprimée avec succès"
}
```

**⚠️ Note:** Cette action supprime définitivement :
- L'entrée en base de données
- Le fichier vidéo physique
- Tous les liens avec les techniques

---

### POST /api/admin/videos/[id]/link
Lier une vidéo à une technique.

**Body:**
```typescript
{
  techniqueId: string              // ID de la technique (requis)
  type: 'COACH' | 'DEMONSTRATION'  // Type de lien
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vidéo liée avec succès",
  "data": {
    "link": {
      "id": "uuid",
      "videoId": "uuid",
      "techniqueId": "uuid",
      "type": "COACH",
      "technique": { ... }
    }
  }
}
```

---

### DELETE /api/admin/videos/[id]/link
Délier une vidéo d'une technique.

**Query Parameters:**
```typescript
{
  techniqueId?: string  // Si non fourni, supprime tous les liens
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vidéo déliée avec succès"
}
```

---

### GET /api/admin/videos/[id]/link
Liste des techniques liées à une vidéo.

**Response:**
```json
{
  "success": true,
  "data": {
    "links": [
      {
        "id": "uuid",
        "technique": {
          "id": "uuid",
          "name": "Frappe de face",
          "category": "FRAPPE_DE_FACE",
          "module": {
            "code": "UV1",
            "name": "...",
            "belt": { "name": "JAUNE", "color": "..." }
          }
        }
      }
    ],
    "count": 1
  }
}
```

---

## 🔒 Sécurité

- **Authentification requise** sur tous les endpoints
- **Rôle ADMIN** requis pour : POST, PATCH, DELETE, link/unlink
- **Rôle INSTRUCTOR** suffisant pour : GET (lecture seule)
- **Rate limiting** activé

---

## 📊 Schéma Prisma

### VideoAsset
```prisma
model VideoAsset {
  id            String      @id @default(cuid())
  filename      String
  originalName  String
  title         String?     // Titre personnalisé
  description   String?     @db.Text
  tags          String[]    // Tags pour recherche
  mimeType      String
  size          Int
  path          String      // Chemin relatif
  duration      Int?        // Durée en secondes
  thumbnailPath String?     // Vignette
  resolution    String?     // 1080p, 720p, etc.
  status        VideoStatus @default(PROCESSING)
  processedAt   DateTime?   // Date fin traitement
  viewCount     Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  uploadedById  String?
  uploadedBy    User?       @relation(fields: [uploadedById], references: [id])
  techniqueLinks TechniqueVideoLink[]
  userVideos    UserTechniqueVideo[]
}

enum VideoStatus {
  PROCESSING
  READY
  ERROR
}
```

---

## 🎯 Prochaines améliorations

- [ ] Job de traitement vidéo (extraction durée, thumbnail)
- [ ] Compression vidéo automatique
- [ ] Streaming adaptatif (HLS)
- [ ] Soft delete (restauration possible)
- [ ] Historique des modifications

# API Admin - FEKM Training

Ce dossier contient les routes API du panel d'administration pour la gestion des utilisateurs, ceintures et vidéos.

## 📁 Structure

```
src/app/api/admin/
├── users/
│   ├── route.ts              # GET, POST, PATCH, DELETE /api/admin/users
│   └── [id]/
│       └── belt/
│           └── route.ts      # GET, PATCH /api/admin/users/[id]/belt
├── videos/
│   └── upload/
│       └── route.ts          # GET, POST /api/admin/videos/upload
├── belts/
│   ├── route.ts              # GET, POST /api/admin/belts
│   └── [id]/
│       └── route.ts          # GET, PATCH, DELETE /api/admin/belts/[id]
├── modules/
│   ├── route.ts              # GET, POST /api/admin/modules
│   └── [id]/
│       └── route.ts          # GET, PATCH, DELETE /api/admin/modules/[id]
├── techniques/
│   ├── route.ts              # GET, POST /api/admin/techniques
│   └── [id]/
│       └── route.ts          # GET, PATCH, DELETE /api/admin/techniques/[id]
└── stats/
    └── route.ts              # GET /api/admin/stats
```

## 🔐 Authentification

Toutes les routes admin nécessitent une authentification via NextAuth.

- **Admin** : Accès complet (création/suppression d'utilisateurs, gestion des rôles)
- **Instructor** : Accès limité (lecture utilisateurs, assignation ceintures, upload vidéos)
- **Student** : Accès refusé

## 📝 Endpoints

### Utilisateurs

#### `GET /api/admin/users`
Liste paginée des utilisateurs avec filtres.

**Query Parameters:**
- `search` (optional) - Recherche par nom/email
- `beltId` (optional) - Filtrer par ceinture
- `role` (optional) - Filtrer par rôle (STUDENT, INSTRUCTOR, ADMIN)
- `page` (optional, default: 1) - Numéro de page
- `limit` (optional, default: 20) - Éléments par page

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 100,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### `POST /api/admin/users`
Créer un nouvel utilisateur avec mot de passe temporaire.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "STUDENT",
  "beltId": "uuid-belt",
  "sendWelcomeEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": {
    "user": { ... },
    "tempPassword": "abc123..." // Uniquement en développement
  }
}
```

#### `PATCH /api/admin/users`
Mettre à jour un utilisateur existant.

**Body:**
```json
{
  "userId": "uuid-user",
  "beltId": "uuid-belt",
  "role": "INSTRUCTOR",
  "name": "New Name"
}
```

#### `DELETE /api/admin/users?id=uuid`
Supprimer un utilisateur.

---

### Assignation de Ceintures

#### `GET /api/admin/users/[id]/belt`
Récupérer l'historique des ceintures d'un utilisateur.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentBelt": { ... },
    "history": [
      {
        "id": "uuid",
        "belt": { ... },
        "promotionDate": "2024-01-15T10:30:00Z",
        "promotedByUser": { ... },
        "notes": "..."
      }
    ]
  }
}
```

#### `PATCH /api/admin/users/[id]/belt`
Assigner une ceinture à un utilisateur avec validation de progression.

**Body:**
```json
{
  "beltId": "uuid-belt",
  "promotionDate": "2024-01-15T10:30:00Z",
  "notes": "Bonne progression"
}
```

**Règles de validation:**
- Impossible de rétrograder (passer d'une ceinture supérieure à une inférieure)
- Maximum 1 niveau de progression à la fois
- Création automatique d'une entrée dans l'historique

---

### Upload de Vidéos

#### `GET /api/admin/videos/upload`
Liste des vidéos uploadées.

#### `POST /api/admin/videos/upload`
Upload d'une vidéo avec métadonnées.

**FormData:**
- `file` (required) - Fichier vidéo
- `title` (required) - Titre de la vidéo
- `description` (optional) - Description
- `techniqueId` (optional) - ID de la technique associée
- `beltId` (optional) - ID de la ceinture associée
- `moduleId` (optional) - ID du module associé
- `type` (optional, default: COACH) - Type: COACH ou DEMONSTRATION
- `isPublic` (optional, default: false) - Visibilité publique
- `tags` (optional) - Tags JSON ou CSV

**Contraintes:**
- Formats acceptés: MP4, MOV, AVI, WebM, MKV
- Taille maximum: 500MB

**Response:**
```json
{
  "success": true,
  "message": "Vidéo uploadée avec succès",
  "data": {
    "video": { ... },
    "techniqueLink": { ... },
    "metadata": { ... }
  }
}
```

---

## 🧪 Tests

```bash
# Lancer tous les tests
pnpm test

# Tests unitaires uniquement
pnpm test:unit

# Mode watch
pnpm test:unit:watch

# Coverage
pnpm test:unit:coverage
```

## 🗄️ Modèles de données

### BeltHistory
Historique des changements de ceinture:
- `userId` - Utilisateur concerné
- `beltId` - Nouvelle ceinture
- `promotedBy` - Admin/Instructeur ayant fait la promotion
- `promotionDate` - Date de promotion
- `notes` - Notes optionnelles

## 🔒 Sécurité

- Rate limiting sur toutes les routes
- Validation Zod des entrées
- Gestion des erreurs centralisée (pas de fuite d'infos en production)
- Logs de sécurité pour les actions sensibles
- Validation de la progression des ceintures

## 🚀 Développement futur

- [ ] Service d'email réel (SendGrid, AWS SES)
- [ ] Traitement vidéo (extraction durée, thumbnails)
- [ ] Soft delete pour les utilisateurs
- [ ] Export CSV des données
- [ ] Audit log complet

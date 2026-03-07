# API Admin - Implementation Summary

## ✅ Fonctionnalités implémentées

### 1. Upload vidéos coach - `POST /api/admin/videos/upload`

**Fichier:** `src/app/api/admin/videos/upload/route.ts`

**Fonctionnalités:**
- Upload de fichiers vidéo (MP4, MOV, AVI, WebM, MKV)
- Validation du type MIME et extension
- Limite de taille: 500MB
- Stockage dans `/uploads/videos/`
- Association avec technique/belt/module
- Génération de nom de fichier sécurisé (UUID)
- Métadonnées: titre, description, type (COACH/DEMONSTRATION), tags
- Support FormData pour upload multipart

**Validation Zod:**
```typescript
videoMetadataSchema: {
  title: string (max 200)
  description: string (max 2000, optional)
  techniqueId: UUID (optional)
  beltId: UUID (optional)
  moduleId: UUID (optional)
  type: 'COACH' | 'DEMONSTRATION'
  isPublic: boolean
  tags: string (JSON ou CSV)
}
```

### 2. Assigner les ceintures - `PATCH /api/admin/users/[id]/belt`

**Fichier:** `src/app/api/admin/users/[id]/belt/route.ts`

**Fonctionnalités:**
- Assignation de ceinture avec validation de progression
- Historique automatique des changements (table `BeltHistory`)
- Validation: pas de rétrogradation, max 1 niveau à la fois
- Notes de promotion optionnelles
- Date de promotion personnalisable
- Tracking de l'admin/instructeur ayant fait la promotion

**Règles de validation:**
```
WHITE → YELLOW ✓
WHITE → GREEN ✗ (saut interdit)
GREEN → YELLOW ✗ (rétrogradation interdite)
```

**Schéma Prisma ajouté:**
```prisma
model BeltHistory {
  id            String    @id @default(cuid())
  userId        String
  beltId        String
  promotedBy    String?
  promotionDate DateTime  @default(now())
  notes         String?
  createdAt     DateTime  @default(now())
  
  user           User  @relation("UserBeltHistory", ...)
  belt           Belt  @relation(...)
  promotedByUser User? @relation("PromotedBy", ...)
}
```

### 3. Créer des comptes utilisateurs - `POST /api/admin/users`

**Fichier:** `src/app/api/admin/users/route.ts`

**Fonctionnalités:**
- Création d'utilisateurs avec mot de passe temporaire
- Génération de mot de passe sécurisé (12 caractères, hash bcrypt)
- Envoi d'email de bienvenue (simulation console pour l'instant)
- Assignation de ceinture initiale optionnelle
- Création automatique de l'historique de ceinture
- Vérification des doublons d'email
- Pagination et recherche sur la liste des utilisateurs

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

**Email de bienvenue (simulation):**
```
📧 EMAIL DE BIENVENUE (SIMULATION)
========================================
À: john@example.com
Sujet: Bienvenue sur FEKM Training
---
Bonjour John Doe,

Votre compte a été créé sur la plateforme FEKM Training.

Vos identifiants de connexion:
Email: john@example.com
Mot de passe temporaire: xxxxxxxx

Veuillez changer votre mot de passe lors de votre première connexion.
========================================
```

## 🔒 Sécurité

- **Authentification:** NextAuth requis (session JWT)
- **Autorisation:** 
  - Admin: accès complet
  - Instructor: lecture utilisateurs, assignation ceintures, upload vidéos
  - Student: accès refusé
- **Rate limiting:** Configuré par route
  - GET: 100 req/min
  - POST: 10-20 req/min
  - PATCH: 20-50 req/min
  - DELETE: 20 req/min
- **Validation:** Zod pour toutes les entrées
- **Gestion d'erreurs:** Centralisée, sans fuite d'infos en production

## 🧪 Tests

**Fichier:** `src/app/api/admin/__tests__/admin-api.test.ts`

Tests unitaires couvrant:
- Authentification et rôles
- Génération de mots de passe temporaires
- Validation de progression des ceintures
- Validation des fichiers vidéo
- Parsing des métadonnées

```bash
pnpm test:unit -- src/app/api/admin/__tests__/admin-api.test.ts
```

## 🗄️ Migration Prisma

**Fichier:** `prisma/migrations/20250307_add_belt_history/migration.sql`

Crée la table `BeltHistory` avec:
- Clés étrangères vers `User` et `Belt`
- Relation optionnelle vers l'admin (`promotedBy`)
- Index sur `userId`, `beltId`, `promotedBy`
- Migration des données existantes

## 📚 Documentation

**Fichier:** `src/app/api/admin/README.md`

Documentation complète des endpoints avec:
- URLs et méthodes HTTP
- Paramètres de requête
- Corps des requêtes
- Format des réponses
- Codes d'erreur
- Exemples d'utilisation

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers:
- `src/app/api/admin/__tests__/admin-api.test.ts`
- `src/app/api/admin/README.md`
- `prisma/migrations/20250307_add_belt_history/migration.sql`

### Fichiers modifiés:
- `src/app/api/admin/users/route.ts` - Complété avec POST, DELETE, pagination
- `src/app/api/admin/users/[id]/belt/route.ts` - Ajout historique et validation
- `src/app/api/admin/videos/upload/route.ts` - Amélioré avec métadonnées
- `prisma/schema.prisma` - Ajout modèle `BeltHistory`

## 🚀 Prochaines étapes suggérées

1. **Service d'email réel:** Intégrer SendGrid, AWS SES ou Nodemailer
2. **Traitement vidéo:** Extraction de la durée, génération de thumbnails
3. **Soft delete:** Marquer les utilisateurs comme inactifs plutôt que suppression
4. **Audit log:** Logger toutes les actions admin dans une table dédiée
5. **Export CSV:** Permettre l'export des données utilisateurs
6. **Notifications push:** Alerter les utilisateurs de leur nouvelle ceinture

## 📝 Notes de développement

- Les mots de passe temporaires sont affichés uniquement en environnement de développement
- L'upload de vidéos utilise le filesystem local (à remplacer par S3 en production)
- Les validations de progression des ceintures sont configurables dans le code
- Les logs de sécurité sont envoyés dans la console (à connecter à un service de monitoring)

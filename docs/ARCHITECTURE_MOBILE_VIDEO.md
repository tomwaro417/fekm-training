# Architecture Technique FEKM Training - Mobile & Vidéo

> **Tech Lead:** Morpheus  
> **Date:** Mars 2026  
> **Version:** 1.0

---

## 🎯 Vue d'ensemble

### Stack Complète

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (PWA)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Next.js   │  │  React 19   │  │  Service Worker     │  │
│  │   16 (App)  │  │  + Hooks    │  │  (Workbox)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ IndexedDB   │  │ Cache API   │  │  Background Sync    │  │
│  │ (localforage)│ │ (vidéos)    │  │  (progression)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVEUR (Next.js API)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  API Routes │  │  NextAuth   │  │  Video Processing   │  │
│  │  (Edge/Node)│  │  (JWT)      │  │  (FFmpeg/WASM)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Prisma ORM │  │  Streaming  │  │  Push Notifications │  │
│  │  PostgreSQL │  │  (HLS/DASH) │  │  (web-push)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎬 Architecture des Vidéos

### 1. Upload Multi-Qualité (Adaptive Streaming)

```
Mobile (fichier/caméra)
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Chunk Upload   │────▶│  Validation     │────▶│  Transcoding    │
│  (10MB chunks)  │     │  (type/taille)  │     │  (FFmpeg/WASM)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                    ┌─────────────────────────────────────┼─────┐
                    ▼                                     ▼     ▼
            ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
            │  1080p.mp4  │  │  720p.mp4   │  │  480p.mp4   │  │  360p.mp4   │
            │  (master)   │  │  (high)     │  │  (medium)   │  │  (low/3G)   │
            └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
                    │
                    ▼
            ┌─────────────┐
            │  HLS/DASH   │  ◄── Manifest pour streaming adaptatif
            │  manifest   │
            └─────────────┘
```

### 2. Streaming Adaptatif

Stratégie de qualité automatique selon la connexion:

```typescript
const qualityStrategy = {
  'slow-2g':  '360p',
  '2g':       '360p', 
  '3g':       '480p',
  '4g':       '720p',
  'wifi':     '1080p',
};
```

### 3. Téléchargement Offline

```
Utilisateur clique "Télécharger"
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Vérifier espace disponible (StorageManager API)             │
│  2. Demander qualité (360p/480p recommandé pour mobile)         │
│  3. Télécharger via Background Fetch API                        │
│  4. Stocker dans Cache API (vidéo) + IndexedDB (métadonnées)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Modèles de Données (Prisma)

### Schéma Complet Mis à Jour

```prisma
// ============================================
// MODÈLES EXISTANTS (inchangés)
// ============================================

model Account { /* ... */ }
model Session { /* ... */ }
model User {
  // ... champs existants ...
  
  // NOUVEAU: Push notifications
  pushSubscriptions PushSubscription[]
  
  // NOUVEAU: Appareils de l'utilisateur
  devices       UserDevice[]
  
  // NOUVEAU: Progression offline en attente
  offlineProgressQueue OfflineProgressQueue[]
  
  // NOUVEAU: Vidéos téléchargées offline
  offlineVideos UserOfflineVideo[]
}

// ... modèles Belt, BeltContent, Module, Technique ...
// ... modèles UserTechniqueProgress ...

// ============================================
// MODÈLES VIDÉO - VERSION AMÉLIORÉE
// ============================================

model VideoAsset {
  id           String   @id @default(cuid())
  filename     String   @unique
  originalName String
  mimeType     String
  size         Int
  path         String
  duration     Int?     // Durée en secondes
  
  // NOUVEAU: Métadonnées pour streaming
  width        Int?
  height       Int?
  fps          Float?
  bitrate      Int?
  codec        String?
  
  // NOUVEAU: Statut de traitement
  status       VideoStatus @default(PENDING)
  errorMessage String?     @db.Text
  
  // NOUVEAU: Relations avec les variants
  variants     VideoVariant[]
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  techniqueLinks TechniqueVideoLink[]
  userVideos     UserTechniqueVideo[]
  offlineVideos  UserOfflineVideo[]
}

enum VideoStatus {
  PENDING
  PROCESSING
  READY
  ERROR
}

// NOUVEAU: Variants de qualité pour streaming adaptatif
model VideoVariant {
  id          String   @id @default(cuid())
  videoId     String
  quality     VideoQuality
  filename    String
  path        String
  width       Int
  height      Int
  bitrate     Int
  size        Int
  
  // HLS/DASH
  hlsPath     String?
  dashPath    String?
  
  createdAt   DateTime @default(now())
  
  video VideoAsset @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  @@unique([videoId, quality])
}

enum VideoQuality {
  P360   // 360p - pour 3G
  P480   // 480p - pour 4G
  P720   // 720p - pour WiFi
  P1080  // 1080p - pour WiFi haut débit
}

// ... modèles TechniqueVideoLink, UserTechniqueVideo ...

// ============================================
// NOUVEAU: VIDÉOS OFFLINE
// ============================================

model UserOfflineVideo {
  id            String   @id @default(cuid())
  userId        String
  videoId       String
  variantId     String
  
  size          Int
  quality       VideoQuality
  downloadedAt  DateTime @default(now())
  expiresAt     DateTime?
  lastAccessed  DateTime @default(now())
  accessCount   Int      @default(0)
  
  syncStatus    SyncStatus @default(SYNCED)
  
  user    User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  video   VideoAsset @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  @@unique([userId, videoId])
}

enum SyncStatus {
  SYNCED
  PENDING_DELETE
  ERROR
}

// ============================================
// NOUVEAU: SYNCHRONISATION PROGRESSION OFFLINE
// ============================================

model OfflineProgressQueue {
  id          String   @id @default(cuid())
  userId      String
  techniqueId String
  
  level       ProgressLevel
  notes       String?  @db.Text
  
  createdAt   DateTime @default(now())
  syncedAt    DateTime?
  retryCount  Int      @default(0)
  error       String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, syncedAt])
}

// ============================================
// NOUVEAU: NOTIFICATIONS PUSH
// ============================================

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  
  endpoint  String   @unique
  p256dh    String
  auth      String
  
  deviceInfo String?
  createdAt DateTime @default(now())
  lastUsed  DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

// ============================================
// NOUVEAU: APPAREILS UTILISATEUR
// ============================================

model UserDevice {
  id          String   @id @default(cuid())
  userId      String
  deviceId    String   @unique
  deviceName  String?
  deviceType  DeviceType
  platform    String?
  
  maxOfflineStorage Int?
  
  createdAt   DateTime @default(now())
  lastSyncAt  DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

enum DeviceType {
  MOBILE
  TABLET
  DESKTOP
}

// ============================================
// NOUVEAU: JOURNAL D'ACTIVITÉ
// ============================================

model ActivityLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String
  entityType  String?
  entityId    String?
  metadata    Json?
  createdAt   DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([action, createdAt])
}
```

---

## 🔌 API Endpoints

### Upload & Traitement Vidéo

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/videos/upload/init` | Initialiser un upload (retourne uploadId) |
| POST | `/api/videos/upload/chunk` | Uploader un chunk (10MB max) |
| POST | `/api/videos/upload/complete` | Finaliser l'upload |
| GET | `/api/videos/[id]/status` | Statut de traitement |
| POST | `/api/videos/[id]/process` | Relancer le transcodage (admin) |

### Streaming Vidéo

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/videos/[id]/manifest.m3u8` | Manifest HLS maître |
| GET | `/api/videos/[id]/segment/[quality]/playlist.m3u8` | Playlist qualité spécifique |
| GET | `/api/videos/[id]/segment/[quality]/[segment].ts` | Segment vidéo (10s) |
| GET | `/api/videos/[id]/stream?quality=auto` | Streaming avec adaptation |

### Téléchargement Offline

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/videos/[id]/download` | Préparer téléchargement (URL signée) |
| GET | `/api/videos/[id]/download/[quality]` | Téléchargement direct |
| POST | `/api/offline/sync` | Synchroniser état offline |
| GET | `/api/offline/status` | Statut stockage offline |

### Synchronisation Progression

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/progress/sync` | Sync offline → online |
| GET | `/api/progress/pending` | Progressions en attente |

### Notifications Push

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/notifications/subscribe` | S'inscrire aux push |
| POST | `/api/notifications/unsubscribe` | Se désinscrire |
| POST | `/api/notifications/test` | Test notification (admin) |

---

## 💾 Stratégie de Stockage Vidéo

### Comparaison Local vs Cloud

| Critère | Stockage Local | Cloud (S3/Scaleway) | Hybride (Recommandé) |
|---------|---------------|---------------------|----------------------|
| **Coût** | Bas | Moyen | Optimisé |
| **Performance** | Excellente | Bonne (CDN) | Excellente |
| **Scalabilité** | Limitée | Illimitée | Élevée |
| **Backup** | À gérer | Automatique | Automatique |

### Architecture Hybride Recommandée (3 Phases)

**PHASE 1: Local (0-1000 vidéos)**
- Stockage sur disque serveur SSD/NVMe
- Backup rsync quotidien
- Bande passante suffisante pour démarrer

**PHASE 2: Hybride (1000-5000 vidéos)**
- Cache local + Object Storage (Scaleway)
- CDN pour distribution globale
- Migration progressive des anciennes vidéos

**PHASE 3: Full Cloud (5000+ vidéos)**
- Upload direct vers Object Storage (presigned URLs)
- Workers dédiés pour le transcoding
- CDN global avec edge caching

### Structure de Fichiers

```
/uploads/
├── originals/              # Fichiers uploadés bruts
│   ├── 2026/
│   │   ├── 03/
│   │   │   └── {videoId}.mp4
├── variants/               # Fichiers transcodés
│   ├── {videoId}/
│   │   ├── 360p.mp4
│   │   ├── 480p.mp4
│   │   ├── 720p.mp4
│   │   └── 1080p.mp4
├── hls/                    # Segments HLS
│   ├── {videoId}/
│   │   ├── master.m3u8
│   │   ├── 360p/
│   │   │   ├── playlist.m3u8
│   │   │   ├── segment_000.ts
│   │   │   └── segment_001.ts
│   │   └── 480p/
│   │       └── ...
└── temp/                   # Fichiers temporaires upload
    └── {uploadId}/
        ├── chunk_0.tmp
        ├── chunk_1.tmp
        └── ...
```

---

## 🔧 Service Worker & PWA

### Architecture Service Worker

```typescript
// sw.ts - Service Worker pour FEKM Training

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Précacher les assets statiques
precacheAndRoute(self.__WB_MANIFEST);

// Cache des vidéos offline
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/videos/offline/'),
  new CacheFirst({
    cacheName: 'offline-videos',
    plugins: [
      {
        // Limite de 2GB pour les vidéos
        cachedResponseWillBeUsed: async ({ cachedResponse }) => {
          const cache = await caches.open('offline-videos');
          const keys = await cache.keys();
          let totalSize = 0;
          
          // Calculer taille totale et nettoyer si nécessaire
          for (const key of keys) {
            const response = await cache.match(key);
            const blob = await response?.blob();
            totalSize += blob?.size || 0;
          }
          
          if (totalSize > 2 * 1024 * 1024 * 1024) {
            // Supprimer les vidéos les moins récemment utilisées
            await cleanupLRU(cache);
          }
          
          return cachedResponse;
        }
      }
    ]
  })
);

// Background Sync pour la progression
const progressSyncPlugin = new BackgroundSyncPlugin('progress-sync', {
  maxRetentionTime: 24 * 60, // 24 heures
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
      } catch (error) {
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

registerRoute(
  ({ url }) => url.pathname === '/api/progress/sync',
  new NetworkFirst({
    plugins: [progressSyncPlugin]
  }),
  'POST'
);
```

### IndexedDB Schema (Client)

```typescript
// lib/offline/db.ts

import { openDB } from 'idb';

const DB_NAME = 'fekm-training';
const DB_VERSION = 1;

export const initDB = () => openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Vidéos offline
    const offlineVideosStore = db.createObjectStore('offlineVideos', {
      keyPath: 'videoId'
    });
    offlineVideosStore.createIndex('byLastAccessed', 'lastAccessed');
    offlineVideosStore.createIndex('byQuality', 'quality');
    
    // Progression en attente de sync
    const progressQueueStore = db.createObjectStore('progressQueue', {
      keyPath: 'id',
      autoIncrement: true
    });
    progressQueueStore.createIndex('byTechnique', 'techniqueId');
    progressQueueStore.createIndex('byTimestamp', 'timestamp');
    
    // Métadonnées techniques (pour offline)
    db.createObjectStore('techniques', { keyPath: 'id' });
    
    // Cache utilisateur
    db.createObjectStore('user', { keyPath: 'key' });
  }
});
```

---

## 📱 Notifications Push

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Événement     │────▶│   Serveur       │────▶│   Service       │
│   (nouvelle     │     │   (web-push)    │     │   Worker        │
│   vidéo, etc.)  │     │                 │     │   (client)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                  ┌─────────────┐
                                                  │  Notification │
                                                  │  Système      │
                                                  └─────────────┘
```

### Types de Notifications

| Type | Déclencheur | Destinataire |
|------|-------------|--------------|
| `NEW_VIDEO` | Nouvelle vidéo instructeur | Élèves concernés |
| `PROGRESS_REMINDER` | Pas de progression depuis X jours | Élève concerné |
| `SYNC_COMPLETE` | Sync progression réussie | Élève |
| `DOWNLOAD_COMPLETE` | Vidéo téléchargée | Élève |
| `BELT_PROMOTION` | Changement de ceinture | Élève + Instructeur |

### Implémentation

```typescript
// lib/notifications/push.ts

import webPush from 'web-push';

// Configuration VAPID
webPush.setVapidDetails(
  'mailto:contact@fekm-training.fr',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
    actions?: { action: string; title: string }[];
  }
) {
  await webPush.sendNotification(
    subscription,
    JSON.stringify(payload)
  );
}
```

---

## 📋 Plan de Migration

### Phase 1: Fondations (Semaine 1-2)

- [ ] Mettre à jour le schéma Prisma
- [ ] Créer les nouvelles tables (VideoVariant, UserOfflineVideo, etc.)
- [ ] Migrer les données existantes (VideoAsset)
- [ ] Installer les dépendances (workbox, idb, web-push)

### Phase 2: Upload & Traitement (Semaine 3-4)

- [ ] Implémenter l'upload par chunks
- [ ] Créer le service de transcodage FFmpeg
- [ ] Générer les variants (360p, 480p, 720p, 1080p)
- [ ] Créer les manifests HLS
- [ ] API de statut de traitement

### Phase 3: Streaming (Semaine 5)

- [ ] Implémenter les endpoints HLS
- [ ] Créer le composant VideoPlayer adaptatif
- [ ] Intégrer hls.js pour la compatibilité
- [ ] Tests sur différentes connexions

### Phase 4: Offline (Semaine 6-7)

- [ ] Configurer le Service Worker (Workbox)
- [ ] Implémenter IndexedDB avec idb
- [ ] Créer le système de téléchargement
- [ ] Gestion du cache LRU
- [ ] Interface de gestion des vidéos offline

### Phase 5: Sync Progression (Semaine 8)

- [ ] Implémenter Background Sync
- [ ] Créer la file d'attente offline
- [ ] Gestion des conflits
- [ ] Tests de sync avec perte de connexion

### Phase 6: Notifications Push (Semaine 9)

- [ ] Configurer VAPID keys
- [ ] Implémenter l'inscription push
- [ ] Créer les templates de notification
- [ ] Tests sur iOS/Android

### Phase 7: Optimisation & Tests (Semaine 10)

- [ ] Tests de charge (streaming)
- [ ] Tests sur 3G/4G réel
- [ ] Optimisation des performances
- [ ] Documentation utilisateur

---

## 📦 Dépendances

### Serveur

```json
{
  "dependencies": {
    "web-push": "^3.6.7",
    "fluent-ffmpeg": "^2.1.3",
    "@aws-sdk/client-s3": "^3.450.0",
    "@aws-sdk/s3-request-presigner": "^3.450.0",
    "bull": "^4.12.0",
    "ioredis": "^5.3.2"
  }
}
```

### Client

```json
{
  "dependencies": {
    "idb": "^8.0.0",
    "hls.js": "^1.5.0",
    "workbox-window": "^7.0.0",
    "workbox-precaching": "^7.0.0",
    "workbox-routing": "^7.0.0",
    "workbox-strategies": "^7.0.0",
    "workbox-background-sync": "^7.0.0"
  },
  "devDependencies": {
    "workbox-cli": "^7.0.0"
  }
}
```

---

## 🔒 Sécurité

### Protection des Vidéos

1. **Authentification requise** pour tous les endpoints vidéo
2. **URLs signées** pour les téléchargements (15 min d'expiration)
3. **Rate limiting** sur les endpoints de streaming
4. **CORS strict** - uniquement les origines autorisées
5. **Watermark optionnel** pour les vidéos sensibles

### Headers de Sécurité

```typescript
// next.config.ts
{
  headers: [
    {
      source: '/api/videos/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Content-Security-Policy', value: "default-src 'self'" },
      ]
    }
  ]
}
```

---

## 📊 Métriques & Monitoring

### KPIs à Suivre

| Métrique | Cible | Alertes |
|----------|-------|---------|
| Temps de transcodage | < 2x durée vidéo | > 5x durée |
| Taux d'erreur upload | < 1% | > 5% |
| Taux de succès sync | > 99% | < 95% |
| Temps de chargement vidéo | < 2s | > 5s |
| Espace offline utilisé | < 2GB/device | > 1.8GB |

### Logs Importants

- `video_upload_started` / `video_upload_completed` / `video_upload_failed`
- `video_transcoding_started` / `video_transcoding_completed`
- `offline_download_started` / `offline_download_completed`
- `progress_sync_success` / `progress_sync_failed`
- `push_notification_sent` / `push_notification_failed`

---

## 🚀 Prochaines Étapes Immédiates

1. **Créer la migration Prisma** avec les nouveaux modèles
2. **Installer les dépendances** listées ci-dessus
3. **Configurer FFmpeg** sur le serveur
4. **Générer les clés VAPID** pour les notifications push
5. **Créer le composant VideoPlayer** avec hls.js
6. **Implémenter l'upload par chunks** côté client

---

*Architecture conçue par Morpheus - Tech Lead FEKM Training*

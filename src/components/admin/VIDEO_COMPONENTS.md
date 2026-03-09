# 🎥 Composants Admin - Gestion des Vidéos

Ce dossier contient tous les composants React pour la gestion des vidéos côté administrateur.

## 📦 Composants

### VideoManager
Composant principal qui combine tous les autres pour une gestion complète des vidéos.

```tsx
import { VideoManager } from '@/components/admin'

export default function AdminVideosPage() {
  return <VideoManager />
}
```

**Fonctionnalités :**
- Liste des vidéos avec filtres et recherche
- Statistiques (total, coach, démos, non liées, erreurs)
- Actions : Preview, Edit, Delete, Link/Unlink

---

### VideoList
Affiche la liste des vidéos avec thumbnails et métadonnées.

```tsx
import { VideoList } from '@/components/admin'

<VideoList
  videos={videos}
  onDelete={handleDelete}
  onEdit={setEditVideo}
  onPreview={setPreviewVideo}
  loading={false}
/>
```

**Props :**
- `videos: Video[]` - Liste des vidéos
- `onDelete?: (videoId: string) => Promise<void>`
- `onEdit?: (video: Video) => void`
- `onPreview?: (video: Video) => void`
- `loading?: boolean`

---

### VideoUpload
Composant d'upload de vidéos avec drag & drop.

```tsx
import { VideoUpload } from '@/components/admin'

<VideoUpload
  onUpload={async (file) => {
    // Upload logic
  }}
  maxSizeMB={500}
/>
```

---

### VideoMetadataEditor
Éditeur des métadonnées d'une vidéo (titre, description, tags).

```tsx
import { VideoMetadataEditor } from '@/components/admin'

<VideoMetadataEditor
  video={selectedVideo}
  isOpen={isOpen}
  onClose={closeModal}
  onSave={handleSave}
/>
```

---

### VideoPreview
Lecteur vidéo plein écran avec contrôles.

```tsx
import { VideoPreview } from '@/components/admin'

<VideoPreview
  video={selectedVideo}
  isOpen={isOpen}
  onClose={closeModal}
/>
```

**Raccourcis clavier :**
- `Space` - Play/Pause
- `←/→` - Reculer/Avancer 5s
- `F` - Plein écran
- `M` - Muet
- `Échap` - Fermer

---

### VideoLinkManager
Gestion des liens entre vidéos et techniques.

```tsx
import { VideoLinkManager } from '@/components/admin'

<VideoLinkManager
  video={selectedVideo}
  isOpen={isOpen}
  onClose={closeModal}
  onLink={handleLink}
  onUnlink={handleUnlink}
/>
```

---

## 🎯 Flux de travail

### 1. Upload d'une vidéo
```
/admin/videos/upload
→ Sélection ceinture → Module → Technique
→ Choix type (COACH/DÉMONSTRATION)
→ Upload fichier (drag & drop ou caméra)
```

### 2. Gestion des vidéos
```
/admin/videos
→ Liste avec filtres
→ Preview | Edit | Delete | Link
```

### 3. Association à une technique
```
/admin/videos → Bouton "Lier"
→ Recherche technique
→ Sélection → Confirmation
```

---

## 🎨 Types de vidéos

| Type | Description | Usage |
|------|-------------|-------|
| **COACH** | Démonstration par l'instructeur | Référence officielle |
| **DEMONSTRATION** | Exécution standard | Modèle à reproduire |

---

## 🔧 API Endpoints requis

```typescript
// Liste des vidéos
GET    /api/admin/videos

// Upload
POST   /api/admin/videos/upload

// Métadonnées
PATCH  /api/admin/videos/[id]

// Suppression
DELETE /api/admin/videos/[id]

// Lien technique
POST   /api/admin/videos/[id]/link
DELETE /api/admin/videos/[id]/link

// Streaming
GET    /api/videos/[id]/stream
```

---

## 📝 Type Video

```typescript
interface Video {
  id: string
  filename: string
  title?: string
  description?: string
  duration?: number
  size: number
  createdAt: string
  type: 'COACH' | 'DEMONSTRATION'
  status: 'PROCESSING' | 'READY' | 'ERROR'
  thumbnailUrl?: string
  tags?: string[]
  technique?: {
    id: string
    name: string
    module: {
      code: string
      belt: {
        name: string
        color: string
      }
    }
  }
  uploadedBy: {
    name: string
  }
  viewCount?: number
}
```

---

## 🚀 Prochaines améliorations

- [ ] Traitement vidéo automatique (thumbnails, durée)
- [ ] Upload par lot (multiple files)
- [ ] Organisation en playlists
- [ ] Statistiques de visionnage détaillées
- [ ] Compression vidéo automatique

# Composants Training - FEKM Training

Ce dossier contient les composants React pour les fonctionnalités de formation et d'apprentissage du Krav Maga.

## 📦 Installation

Les composants utilisent les dépendances suivantes (déjà incluses dans le projet) :

```bash
pnpm add framer-motion lucide-react
```

## 🎯 Composants

### 1. VideoUploader

Upload de vidéos avec drag & drop et accès caméra mobile.

```tsx
import { VideoUploader } from '@/components/training'

<VideoUploader
  techniqueId="technique-123"
  videoType="PERSONAL_BEGINNER"
  onUploadSuccess={(video) => console.log('Upload réussi:', video)}
  onUploadError={(error) => console.error('Erreur:', error)}
  maxSizeMB={100}
/>
```

**Props principales :**
- `techniqueId` (string) - ID de la technique associée
- `videoType` ('PERSONAL_BEGINNER' | 'PERSONAL_PROGRESSION') - Type de vidéo
- `onUploadSuccess` - Callback après upload réussi
- `onUploadError` - Callback en cas d'erreur
- `maxSizeMB` - Taille max en MB (défaut: 100)

**Fonctionnalités :**
- ✅ Drag & drop de fichiers
- ✅ Accès caméra mobile
- ✅ Barre de progression
- ✅ Validation des formats
- ✅ Gestion des erreurs

---

### 2. VideoPlayer

Lecteur vidéo optimisé mobile avec contrôles tactiles.

```tsx
import { VideoPlayer } from '@/components/training'

<VideoPlayer
  src="/videos/demo.mp4"
  poster="/thumbnails/demo.jpg"
  title="Démonstration technique"
  onTimeUpdate={(current, duration) => console.log(current, duration)}
  onEnded={() => console.log('Vidéo terminée')}
/>
```

**Props principales :**
- `src` (string) - URL de la vidéo
- `poster` (string) - URL de la miniature
- `title` (string) - Titre affiché
- `onTimeUpdate` - Callback quand le temps change
- `onEnded` - Callback quand la vidéo se termine

**Fonctionnalités :**
- ✅ Contrôles tactiles (mobile)
- ✅ Raccourcis clavier (espace, flèches, F, M)
- ✅ Vitesse de lecture réglable (0.5x - 2x)
- ✅ Plein écran
- ✅ Indicateur de buffering

---

### 3. BeltAssignment

Interface de gestion des ceintures pour les élèves.

```tsx
import { BeltAssignment } from '@/components/training'

const belts = [
  { id: '1', name: 'Jaune', color: 'JAUNE', order: 1 },
  { id: '2', name: 'Orange', color: 'ORANGE', order: 2 },
]

const students = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', currentBeltId: '1' },
]

<BeltAssignment
  belts={belts}
  students={students}
  onAssignBelt={async (studentId, beltId) => {
    await api.assignBelt(studentId, beltId)
  }}
  onRemoveBelt={async (studentId) => {
    await api.removeBelt(studentId)
  }}
/>
```

**Props principales :**
- `belts` (Belt[]) - Liste des ceintures disponibles
- `students` (Student[]) - Liste des élèves
- `onAssignBelt` - Callback d'assignation
- `onRemoveBelt` - Callback de retrait

**Fonctionnalités :**
- ✅ Recherche d'élèves
- ✅ Filtrage par ceinture
- ✅ Vue groupée par ceinture
- ✅ Expand/collapse par élève
- ✅ Animations fluides

---

### 4. ProgressDashboard

Dashboard instructeur avec statistiques des élèves.

```tsx
import { ProgressDashboard } from '@/components/training'

<ProgressDashboard
  students={studentProgressData}
  modules={moduleStatsData}
  totalTechniques={150}
  totalModules={12}
  onStudentClick={(id) => router.push(`/students/${id}`)}
  onModuleClick={(id) => router.push(`/modules/${id}`)}
/>
```

**Props principales :**
- `students` (StudentProgress[]) - Progression des élèves
- `modules` (ModuleStats[]) - Stats des modules
- `totalTechniques` (number) - Total de techniques
- `totalModules` (number) - Total de modules
- `onStudentClick` - Callback clic élève
- `onModuleClick` - Callback clic module

**Fonctionnalités :**
- ✅ Cartes de statistiques globales
- ✅ Classement des élèves
- ✅ Progression par module
- ✅ Indicateurs visuels (couleurs)
- ✅ Responsive

---

### 5. OfflineIndicator

Indicateur de statut offline/online.

```tsx
import { OfflineIndicator, useOnlineStatus } from '@/components/training'

// Composant indicateur
<OfflineIndicator 
  position="top"
  showReconnectionToast={true}
  onStatusChange={(isOnline) => console.log(isOnline)}
/>

// Hook personnalisé
function MyComponent() {
  const { isOnline, isOffline } = useOnlineStatus()
  
  return (
    <div>
      {isOffline && <p>Vous êtes hors ligne</p>}
    </div>
  )
}
```

**Props principales :**
- `position` ('top' | 'bottom' | 'static') - Position de l'indicateur
- `showReconnectionToast` (boolean) - Afficher toast de reconnexion
- `onStatusChange` - Callback changement de statut
- `compact` (boolean) - Mode compact (juste l'icône)

**Fonctionnalités :**
- ✅ Détection online/offline
- ✅ Délai configurable avant "offline"
- ✅ Toast de reconnexion
- ✅ Mode compact
- ✅ Hook useOnlineStatus

---

### 6. VideoDownloadButton

Bouton de téléchargement avec progression.

```tsx
import { VideoDownloadButton } from '@/components/training'

// Variante bouton
<VideoDownloadButton
  videoId="video-123"
  videoUrl="/api/videos/123/download"
  filename="ma-technique.mp4"
  fileSize={1024 * 1024 * 50} // 50MB
  variant="button"
/>

// Variante icône
<VideoDownloadButton
  videoId="video-123"
  videoUrl="/api/videos/123/download"
  variant="icon"
  size="sm"
/>

// Variante carte
<VideoDownloadButton
  videoId="video-123"
  videoUrl="/api/videos/123/download"
  filename="ma-technique.mp4"
  fileSize={1024 * 1024 * 50}
  variant="card"
/>
```

**Props principales :**
- `videoId` (string) - ID de la vidéo
- `videoUrl` (string) - URL de la vidéo
- `filename` (string) - Nom du fichier
- `fileSize` (number) - Taille en bytes
- `variant` ('button' | 'icon' | 'card') - Style du bouton

**Fonctionnalités :**
- ✅ Barre de progression
- ✅ Vitesse de téléchargement
- ✅ Temps restant estimé
- ✅ Annulation du téléchargement
- ✅ Retry en cas d'erreur

---

## 🎨 Design System

### Couleurs de progression

| Pourcentage | Couleur | Classe Tailwind |
|-------------|---------|-----------------|
| ≥ 80% | Vert | `text-green-600 bg-green-50` |
| ≥ 60% | Bleu | `text-blue-600 bg-blue-50` |
| ≥ 40% | Jaune | `text-yellow-600 bg-yellow-50` |
| < 40% | Rouge | `text-red-600 bg-red-50` |

### Couleurs des ceintures

| Ceinture | Classe Tailwind |
|----------|-----------------|
| Blanche | `bg-white border-gray-300` |
| Jaune | `bg-yellow-400 border-yellow-500` |
| Orange | `bg-orange-400 border-orange-500` |
| Verte | `bg-green-500 border-green-600` |
| Bleue | `bg-blue-500 border-blue-600` |
| Marron | `bg-amber-700 border-amber-800` |
| Noire | `bg-gray-900 border-black` |

---

## ♿ Accessibilité

Tous les composants sont accessibles :

- ✅ Attributs ARIA appropriés
- ✅ Navigation au clavier
- ✅ Labels descriptifs
- ✅ Contraste suffisant
- ✅ Focus visible

---

## 📱 Responsive

Les composants sont conçus mobile-first :

- ✅ Touch targets ≥ 44x44px
- ✅ Layouts adaptatifs
- ✅ Gestes tactiles
- ✅ Optimisés pour petits écrans

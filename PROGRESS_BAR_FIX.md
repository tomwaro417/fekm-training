# Test de la Barre de Progression - VideoUploader

## Changements effectués

### 1. Ajout de champs au state UploadState
```typescript
interface UploadState {
  status: 'idle' | 'dragging' | 'uploading' | 'processing' | 'success' | 'error'
  progress: number
  error?: string
  video?: UploadedVideo
  fileSize?: number        // ← NOUVEAU
  uploadedSize?: number    // ← NOUVEAU
}
```

### 2. Initialisation du state avec les tailles
```typescript
const uploadFile = async (file: File) => {
  setState({ status: 'uploading', progress: 0, fileSize: file.size, uploadedSize: 0 })
  // ...
}
```

### 3. Mise à jour du progress avec les bytes uploadés
```typescript
xhr.upload.addEventListener('progress', (event) => {
  if (event.lengthComputable) {
    const progress = Math.round((event.loaded / event.total) * 100)
    console.log('Upload progress:', progress, '%', event.loaded, '/', event.total)
    setState(prev => ({ ...prev, progress, uploadedSize: event.loaded }))
  } else {
    // Si lengthComputable est false, on affiche une progression indéterminée
    console.log('Upload progress: length not computable')
    // Mise à jour avec une estimation basée sur les bytes uploadés
    setState(prev => ({ ...prev, uploadedSize: event.loaded }))
  }
})
```

### 4. Affichage amélioré de la progression
```typescript
{state.status === 'uploading' && (
  <div className="w-full max-w-xs mt-4">
    <div className="flex justify-between text-sm text-gray-600 mb-1">
      <span>{state.progress}%</span>
      <span>
        {state.uploadedSize !== undefined && state.fileSize !== undefined
          ? `${(state.uploadedSize / (1024 * 1024)).toFixed(1)}MB / ${(state.fileSize / (1024 * 1024)).toFixed(1)}MB`
          : `${state.progress}%`
        }
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <motion.div
        className="bg-blue-600 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${state.progress}%` }
        transition={{ duration: 0.1, ease: "linear" }}
      />
    </div>
  </div>
)}
```

## Améliorations

1. **Progression réelle** : La barre reflète maintenant l'avancement réel via `event.loaded / event.total`
2. **Affichage des tailles** : Affiche "X MB / Y MB" avec les vraies tailles du fichier
3. **Logging** : Ajout de `console.log` pour le debugging dans la console
4. **Gestion de lengthComputable=false** : Même si le navigateur ne peut pas calculer la taille totale, on met à jour `uploadedSize`
5. **Animation plus fluide** : Transition réduite à 0.1s avec easing linear pour une mise à jour plus réactive

## Test visuel

Pour tester :
1. Lancer l'application : `pnpm dev`
2. Aller sur une page avec le composant VideoUploader
3. Sélectionner un fichier vidéo (de préférence > 5MB pour voir la progression)
4. Observer la barre de progression qui doit :
   - Commencer à 0%
   - Augmenter progressivement pendant l'upload
   - Afficher le pourcentage et les MB réels
   - Atteindre 100% à la fin

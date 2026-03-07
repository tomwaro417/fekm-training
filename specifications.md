# FEKM Training - Spécifications Techniques des Écrans

## 📋 Spécifications par Écran

---

### 1. INTERFACE ADMIN - ASSIGNATION DES CEINTURES

#### Écran: `/admin/ceintures`

**Objectif:** Permettre aux administrateurs de visualiser et modifier les ceintures des élèves

**Composants:**
| Composant | Type | Props |
|-----------|------|-------|
| Header | Layout | title, backButton, searchIcon |
| SearchBar | Input | placeholder, onSearch, debounce=300ms |
| FilterBar | Composite | filters[], onFilterChange |
| StudentCard | Card | student: {id, name, avatar, currentBelt, progress, lastEvalDate} |
| BeltBadge | Badge | belt: BeltColor, size: 'sm' \| 'md' \| 'lg' |
| FAB | Button | icon, onClick, label (desktop) |

**États:**
- `loading`: Skeleton cards (5 items)
- `empty`: Aucun élève trouvé
- `error`: Message d'erreur + retry
- `filtered`: Liste filtrée avec compteur

**Interactions:**
- Pull-to-refresh sur la liste
- Infinite scroll (pagination 20 items)
- Swipe left sur card pour quick actions
- Long press pour menu contextuel

**Accessibilité:**
- `aria-label` sur chaque card: "Élève [nom], ceinture [couleur]"
- Focus visible sur tous les éléments interactifs
- Raccourcis clavier: `/` pour recherche, `Esc` pour fermer modals

#### Modal: Assignation de Ceinture

**Composants:**
| Composant | Type | Props |
|-----------|------|-------|
| Modal | Overlay | isOpen, onClose, title |
| StudentPreview | Display | avatar, name, id |
| BeltSelector | Select | value, onChange, options: BeltColor[] |
| DatePicker | Input | value, onChange, maxDate=today |
| TextInput | Input | value, onChange, label, optional |
| TextArea | Input | value, onChange, label, optional, maxLength=500 |
| PrimaryButton | Button | onClick, loading, disabled |

**Validation:**
- Ceinture requise
- Date requise, format DD/MM/YYYY
- Date ne peut pas être future
- Numéro de diplôme: format FEKM-AAAA-XXXXX

**Flow:**
1. Admin sélectionne élève → Modal s'ouvre
2. Remplit formulaire
3. Clic "Confirmer" → Loading state
4. Succès: Toast + Fermeture modal + Notification push élève
5. Erreur: Message inline + Retry

---

### 2. FLOW UPLOAD VIDÉO

#### Écran: `/upload` - Choix Source

**Objectif:** Permettre aux instructeurs d'uploader des vidéos de cours

**Composants:**
| Composant | Type | Props |
|-----------|------|-------|
| UploadZone | Dropzone | onFileSelect, accept, maxSize |
| SourceButton | Button | icon, label, onClick, variant |
| InfoText | Text | children |

**Sources supportées:**
- File picker: `accept="video/*"`
- Camera: `navigator.mediaDevices.getUserMedia({ video: true })`

**Contraintes:**
- Formats: MP4, MOV, AVI, WebM
- Taille max: 500MB
- Durée max: 30 minutes
- Résolution min: 720p

**Gestion des erreurs:**
- Fichier trop grand: Message + compression suggérée
- Format non supporté: Message + formats acceptés
- Permission caméra refusée: Instructions pour activer

#### Écran: Capture Caméra

**Composants:**
| Composant | Type | Props |
|-----------|------|-------|
| CameraView | Video | stream, mirrored=true |
| RecordButton | Button | isRecording, onClick, duration |
| ToggleButton | IconButton | icon, onClick, active |
| Timer | Display | elapsedTime |

**Fonctionnalités:**
- Flash toggle (si disponible)
- Camera flip (front/back)
- Recording indicator (pulsing red dot)
- Hold to record (long press) ou tap start/stop
- Max recording time: 10 minutes

**États:**
- `idle`: Prêt à enregistrer
- `recording`: En cours, timer actif
- `paused`: Pause (si supporté)
- `review`: Preview avant confirmation

#### Écran: Prévisualisation

**Composants:**
| Composant | Type | Props |
|-----------|------|-------|
| VideoPlayer | Video | src, controls=true |
| ActionBar | Layout | primaryAction, secondaryAction |
| VideoInfo | Display | duration, size, quality |

**Actions:**
- Recommencer: Retour à capture/file picker
- Utiliser: Passe à l'étape métadonnées

**Compression côté client:**
- Si fichier > 100MB, proposition de compression
- Utilisation de ffmpeg.wasm si possible
- Barre de progression pendant compression

#### Écran: Métadonnées

**Composants:**
| Composant | Type | Props |
|-----------|------|-------|
| Form | Form | onSubmit, validationSchema |
| TextInput | Input | name, label, required, validation |
| TextArea | Input | name, label, rows=4 |
| Select | Dropdown | name, options, placeholder |
| TagInput | Input | tags, onAdd, onRemove, suggestions |
| SubmitButton | Button | loading, disabled |

**Champs requis:**
- `title`: string, min 5, max 100 caractères
- `beltLevel`: enum BeltColor
- `category`: enum Category

**Champs optionnels:**
- `description`: string, max 1000 caractères
- `techniques`: string[] (tags)
- `thumbnail`: image (auto-extrait ou upload)

**Validation temps réel:**
- Indicateur de force sur titre
- Compteur de caractères
- Validation au blur

#### Écran: Upload en Cours

**Composants:**
| Composant | Type | Props |
|-----------|------|-------|
| ProgressCircle | Progress | value, max, label |
| ProgressDetails | Text | uploaded, total, eta |
| CancelButton | Button | onClick, confirm=true |

**Gestion upload:**
- Chunked upload (5MB chunks)
- Resume supporté
- Background upload possible (service worker)
- Retry automatique x3 sur erreur réseau

**États:**
- `uploading`: Progress visible, cancel possible
- `processing`: Vidéo en traitement serveur
- `success`: Redirection vers cours publié
- `error`: Retry ou abandon

---

### 3. LECTEUR VIDÉO MOBILE

#### Écran: `/watch/[courseId]`

**Objectif:** Lecture optimisée mobile avec accès hors-ligne

**Composants:**
| Composant | Type | Props |
|-----------|------|-------|
| VideoPlayer | Video | src, poster, autoplay=false |
| PlayerControls | Overlay | visible, onInteraction |
| ProgressBar | Slider | value, max, buffered, onSeek |
| ControlButton | IconButton | icon, onClick, disabled |
| ChapterList | List | chapters, currentTime, onSelect |
| DownloadButton | Button | status, onClick, progress |

**Modes d'affichage:**

**Portrait (défaut):**
- Vidéo 16:9 en haut
- Contrôles overlay (tap pour afficher)
- Scroll vers le bas pour infos
- Bottom nav visible

**Paysage (plein écran):**
- Vidéo full screen
- Contrôles simplifiés
- Gestures supportées
- System UI hidden

**Gestures supportées:**
- Tap: Toggle controls
- Double-tap gauche: -10s
- Double-tap droite: +10s
- Swipe horizontal: Seek
- Swipe vertical gauche: Volume
- Swipe vertical droite: Luminosité
- Pinch: Zoom (si applicable)

**Chapitres:**
- Liste scrollable sous vidéo
- Click pour seek
- Highlight chapitre actif
- Thumbnail preview au hover (desktop)

**Téléchargement:**
- Bouton téléchargement visible
- États: `idle` → `downloading` → `downloaded` → `error`
- Stockage: IndexedDB / Cache API
- Lecture hors-ligne supportée

**Qualité vidéo:**
- Auto (adaptive streaming)
- 1080p, 720p, 480p manuel
- Sélection basée sur connexion

---

### 4. DASHBOARD INSTRUCTEUR

#### Écran: `/dashboard` - Vue d'Ensemble

**Objectif:** Donner une vision rapide de l'activité et des tâches prioritaires

**Composants:**
| Composant | Type | Props |
|-----------|------|-------|
| KPICard | Card | icon, value, label, trend?, color |
| StudentList | List | students, maxItems=3 |
| BeltDistribution | Chart | data, type='horizontal-bar' |
| PendingEvaluations | List | evaluations, onEvaluate |
| FAB | Button | icon, onClick |

**KPIs affichés:**
- Élèves actifs (30 derniers jours)
- Cours publiés (total)
- Temps de visionnage (30 derniers jours)
- Évaluations en attente

**Graphique répartition ceintures:**
- Type: Barres horizontales empilées
- Couleurs: Couleurs officielles ceintures
- Interaction: Tap pour filtrer élèves

**Liste évaluations en attente:**
- Tri: Date soumission (plus ancienne first)
- Max: 3 items visibles
- CTA: "Évaluer maintenant"

**Refresh:**
- Pull-to-refresh
- Auto-refresh toutes les 5 minutes
- Badge notification sur nouvelles évaluations

#### Écran: `/dashboard/eleves/[id]` - Détail Élève

**Objectif:** Vue détaillée de la progression d'un élève

**Sections:**

**1. Profil Header:**
- Avatar (grand)
- Nom complet
- Ceinture actuelle (badge)
- Date d'inscription
- Contact (email, téléphone)

**2. Progression:**
- Graphique linéaire (6 derniers mois)
- Progression vers prochaine ceinture
- Pourcentage complété
- Techniques restantes

**3. Cours complétés:**
- Liste scrollable
- Filtre par ceinture
- Badge "Complété" sur chaque

**4. Évaluations:**
- Timeline des notations
- Note moyenne globale
- Derniers commentaires

**Actions disponibles:**
- Nouvelle évaluation
- Changer ceinture (redirige vers admin)
- Envoyer message
- Voir historique complet

---

### 5. INTERFACE DE NOTATION

#### Wizard: 4 Étapes

**Étape 1: Sélection Élève**
- Search bar avec autocomplete
- Liste élèves récents
- Filtre par ceinture
- Pagination infinie

**Étape 2: Sélection Technique**
- Grid techniques filtrable
- Filtre par ceinture requise
- Filtre par catégorie
- Preview thumbnail technique

**Étape 3: Évaluation Vidéo**
- Upload vidéo élève OU capture live
- Lecteur vidéo avec contrôles
- Timeline avec marqueurs
- Grille critères avec sliders

**Critères d'évaluation (5 étoiles chacun):**
1. Position de base
2. Exécution technique
3. Fluidité du mouvement
4. Puissance
5. Respect des distances

**Calcul note globale:**
- Moyenne des 5 critères
- Arrondi 1 décimale
- Label qualitatif:
  - 5: "Excellente"
  - 4-4.9: "Très bien"
  - 3-3.9: "Bien"
  - 2-2.9: "À retravailler"
  - <2: "Insuffisant"

**Étape 4: Commentaire & Validation**
- Textarea commentaire libre
- Tags "Points à améliorer"
- Checkbox notification élève
- Récapitulatif avant envoi

**Soumission:**
- Validation côté serveur
- Notification push à l'élève
- Email récapitulatif (optionnel)
- Mise à jour progression élève

---

## 🔧 Spécifications Techniques Générales

### Performance

**Lazy Loading:**
- Images: `loading="lazy"` + placeholder blur
- Vidéos: Poster + chargement au clic
- Lists: Virtual scrolling au-delà de 50 items
- Routes: Code splitting par route

**Optimisations:**
- Images: WebP avec fallback
- Vidéos: HLS streaming adaptatif
- Fonts: `font-display: swap`
- CSS: Purge unused styles

### Offline Support

**Service Worker:**
- Cache static assets
- Cache vidéos téléchargées
- Background sync pour uploads
- Fallback page hors-ligne

**Stockage:**
- IndexedDB pour données utilisateur
- Cache API pour assets
- LocalStorage pour préférences

### Sécurité

**Authentification:**
- JWT avec refresh token
- HttpOnly cookies
- CSRF protection
- Rate limiting

**Uploads:**
- Validation type MIME côté serveur
- Scan antivirus
- Limite taille stricte
- Stockage signé URLs

**Données:**
- HTTPS obligatoire
- Données sensibles chiffrées
- RGPD compliance
- Consentement explicite

### Analytics

**Événements trackés:**
- Page views
- Video plays / completions
- Upload success / failure
- Evaluation submissions
- Belt assignments

**Métriques Core Web Vitals:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

---

## 📱 Responsive Behavior

### Mobile First (< 768px)
- Bottom navigation
- Single column layouts
- Full-width cards
- Touch gestures
- Native date/camera pickers

### Tablet (768px - 1024px)
- 2-column grids
- Side navigation possible
- Larger touch targets
- Hover states

### Desktop (> 1024px)
- Multi-column layouts
- Persistent navigation
- Hover tooltips
- Drag & drop support
- Keyboard shortcuts

---

## 🧪 Tests Requis

### Unit Tests
- Validation formulaires
- Calculs notes
- Utils (date, format)

### Integration Tests
- Flow upload vidéo
- Wizard évaluation
- Authentification

### E2E Tests
- Parcours complet élève
- Parcours complet instructeur
- Scénarios hors-ligne

### Accessibility Tests
- Navigation clavier
- Screen reader
- Contraste couleurs
- Focus management

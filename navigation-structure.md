# FEKM Training - Structure de Navigation

## 🗺️ Architecture de l'Application

### Navigation Principale (Bottom Tab Bar)

```
┌─────────────────────────────────────────┐
│  🏠 Home    📚 Cours    👤 Profil    ⚙️  │
│   Accueil   Formation   Compte      Admin*│
└─────────────────────────────────────────┘
                              *Visible uniquement pour les instructeurs/admins
```

### Rôles et Accès

| Écran | Élève | Instructeur | Admin |
|-------|-------|-------------|-------|
| Accueil | ✅ | ✅ | ✅ |
| Bibliothèque de Cours | ✅ | ✅ | ✅ |
| Lecteur Vidéo | ✅ | ✅ | ✅ |
| Profil / Ma Progression | ✅ | ✅ | ✅ |
| Upload Vidéo | ❌ | ✅ | ✅ |
| Dashboard Instructeur | ❌ | ✅ | ✅ |
| Gestion des Ceintures | ❌ | ❌ | ✅ |
| Notation Élèves | ❌ | ✅ | ✅ |
| Paramètres | ✅ | ✅ | ✅ |

---

## 📱 Flux de Navigation Détaillé

### 1. ACCUEIL (Élève & Instructeur)

```
/ (root)
│
├── Header: Logo FEKM + Notification bell
├── Section: Cours recommandés (basé sur niveau)
├── Section: Continuer la formation (en cours)
├── Section: Prochaine ceinture (progression)
├── Section: Techniques du jour
└── Quick Actions:
    ├── 📹 Dernier cours vu
    ├── 🎯 Objectif actuel
    └── 📊 Ma progression
```

**Navigation secondaire:**
- Cours recommandé → Lecteur vidéo
- Voir tout → Bibliothèque filtrée
- Ma progression → Profil/Progression

---

### 2. BIBLIOTHÈQUE / FORMATION

```
/cours
│
├── Header: Recherche + Filtres
├── Tabs: [Tous] [Mon niveau] [Favoris] [À valider*]
│                                    *Instructeur seulement
├── Filtres actifs:
│   ├── Ceinture: [Toutes ▼]
│   ├── Catégorie: [Toutes ▼]
│   └── Durée: [Toutes ▼]
├── Grid/List: Cards de cours
│   └── Card: Thumbnail + Titre + Ceinture + Durée
└── FAB (Instructeur): [+ Upload vidéo]

/cours/[id]
│
├── Lecteur vidéo (plein écran possible)
├── Infos cours:
│   ├── Titre + Ceinture requise
│   ├── Description
│   ├── Techniques couvertes
│   └── Instructeur
├── Actions:
│   ├── ⭐ Favori
│   ├── ⬇️ Télécharger
│   └── ↗️ Partager
└── Section: Cours similaires
```

---

### 3. PROFIL & PROGRESSION

```
/profil
│
├── Header: Avatar + Nom + Ceinture actuelle
├── Section: Ma ceinture
│   ├── Badge ceinture (grand)
│   ├── Date d'obtention
│   └── Prochaine ceinture: [X% complété]
├── Section: Statistiques
│   ├── Cours complétés: XX
│   ├── Temps d'entraînement: XXh
│   ├── Techniques maîtrisées: XX/XXX
│   └── Score moyen: X.X/5
├── Section: Progression par ceinture
│   └── Barres de progression par niveau
├── Section: Évaluations reçues
│   └── Liste des notations instructeur
└── Actions:
    ├── ⚙️ Paramètres
    ├── ❓ Aide & Support
    └── 🚪 Déconnexion
```

---

### 4. UPLOAD VIDÉO (Instructeur)

```
/upload
│
├── Header: Retour + Titre
├── Étape 1: Sélection source
│   ├── [📁 Depuis les fichiers]
│   └── [📷 Caméra]
│
├── Étape 2: Prévisualisation
│   ├── Lecteur vidéo preview
│   ├── [◀️ Recommencer] [✅ Confirmer ▶️]
│
├── Étape 3: Métadonnées
│   ├── Titre du cours*
│   ├── Description
│   ├── Ceinture cible* [Sélecteur]
│   ├── Catégorie* [Sélecteur]
│   ├── Techniques couvertes [Tags]
│   └── [📤 Publier le cours]
│
└── État: Upload en cours / Terminé
```

---

### 5. DASHBOARD INSTRUCTEUR

```
/dashboard
│
├── Header: Titre + Date + Notifications
├── KPI Cards (4 colonnes desktop, scroll horizontal mobile)
│   ├── 👥 Élèves actifs: XX
│   ├── 📹 Cours publiés: XX
│   ├── ⏱️ Temps visionnage: XXh
│   └── ⭐ Évaluations en attente: XX
│
├── Section: Élèves récents
│   └── Liste: Avatar + Nom + Ceinture + Dernière activité
│
├── Section: Progression par ceinture
│   └── Graphique: Répartition des élèves
│
├── Section: Évaluations en attente
│   └── Liste: Élève + Technique + Date soumission
│
└── FAB: [+ Upload vidéo]

/dashboard/eleves
│
├── Header: Recherche + Filtres
├── Filtres:
│   ├── Ceinture: [Toutes ▼]
│   └── Statut: [Tous ▼]
├── Liste élèves:
│   └── Card: Avatar + Nom + Ceinture + Progression + Dernière connexion
└── Action: [📊 Voir détails] → /dashboard/eleves/[id]

/dashboard/eleves/[id]
│
├── Header: Retour
├── Profil élève:
│   ├── Avatar + Nom + Ceinture actuelle
│   ├── Contact (email/tél)
│   └── Date inscription
├── Section: Progression détaillée
│   ├── Graphique progression temporelle
│   ├── Cours complétés
│   └── Techniques validées
├── Section: Évaluations
│   └── Historique des notations
└── Actions:
    ├── [📝 Nouvelle évaluation]
    └── [🥋 Changer ceinture]
```

---

### 6. GESTION DES CEINTURES (Admin)

```
/admin/ceintures
│
├── Header: Titre + Recherche élève
├── Filtres:
│   ├── Ceinture actuelle: [Toutes ▼]
│   └── Club: [Tous ▼]
├── Liste élèves:
│   └── Card:
│       ├── Avatar + Nom
│       ├── Ceinture actuelle (badge)
│       ├── Progression vers suivante
│       ├── Dernière évaluation
│       └── Actions: [🥋 Assigner ceinture]
│
└── Modal: Assignation ceinture
    ├── Élève sélectionné
    ├── Ceinture actuelle (affichage)
    ├── Nouvelle ceinture* [Sélecteur]
    ├── Date d'obtention* [Date picker]
    ├── Numéro de diplôme
    ├── Commentaire
    └── [✅ Confirmer l'attribution]
```

---

### 7. NOTATION / ÉVALUATION (Instructeur)

```
/evaluation
│
├── Header: Retour + Titre
├── Étape 1: Sélection élève
│   ├── Recherche élève
│   └── Liste récents
│
├── Étape 2: Sélection technique
│   ├── Filtre par ceinture
│   └── Grid: Techniques disponibles
│       └── Card: Nom + Catégorie + Miniature
│
├── Étape 3: Évaluation vidéo
│   ├── Upload vidéo élève (si soumis)
│   │   OU
│   ├── [📷 Filmer maintenant]
│   │   OU
│   ├── [📁 Choisir un fichier]
│   ├── Lecteur vidéo
│   └── Timeline avec marqueurs
│
├── Étape 4: Grille d'évaluation
│   ├── Critères:
│   │   ├── Position de base [⭐⭐⭐⭐⭐]
│   │   ├── Exécution technique [⭐⭐⭐⭐⭐]
│   │   ├── Fluidité [⭐⭐⭐⭐⭐]
│   │   ├── Puissance [⭐⭐⭐⭐⭐]
│   │   └── Respect distance [⭐⭐⭐⭐⭐]
│   ├── Note globale: [X/5]
│   ├── Commentaire instructeur [Textarea]
│   └── Points à améliorer [Tags]
│
└── Étape 5: Récapitulatif
    ├── Résumé évaluation
    ├── [✅ Valider et notifier l'élève]
    └── [💾 Brouillon]
```

---

### 8. LECTEUR VIDÉO (Universel)

```
/watch/[courseId]
│
├── Mode Portrait (Mobile par défaut)
│   ├── Lecteur vidéo (16:9, top)
│   ├── Contrôles overlay (tap pour afficher):
│   │   ├── Play/Pause (center)
│   │   ├── Seek bar (bottom)
│   │   ├── Temps écoulé/total
│   │   ├── [⬇️ Télécharger]
│   │   ├── [⛶ Plein écran]
│   │   └── [⚙️ Vitesse: 1x]
│   ├── Infos cours (scroll)
│   ├── Techniques timestamps (chapitres)
│   └── Cours suivants
│
└── Mode Paysage (Plein écran)
    ├── Lecteur vidéo (full screen)
    ├── Contrôles simplifiés
    └── Gestures:
        ├── Double-tap gauche: -10s
        ├── Double-tap droite: +10s
        ├── Swipe vertical gauche: Volume
        └── Swipe vertical droite: Luminosité
```

---

## 🔐 Flux d'Authentification

```
/splash
│
├── Logo FEKM animé
├── Tagline: "Maîtrisez votre défense"
└── Auto-redirect après 2s → /login ou /home

/login
│
├── Logo
├── [📧 Email input]
├── [🔒 Mot de passe input]
├── [👁️ Toggle visibility]
├── [➡️ Se connecter]
├── [🔑 Mot de passe oublié ?]
└── [🆕 Créer un compte]

/register
│
├── [👤 Prénom*]
├── [👤 Nom*]
├── [📧 Email*]
├── [📱 Téléphone]
├── [🔒 Mot de passe*]
├── [🔒 Confirmer mot de passe*]
├── [🥋 Club d'affiliation*] [Sélecteur]
├── [✅ J'accepte les CGU]
└── [🚀 Créer mon compte]

/onboarding (Première connexion)
│
├── Étape 1: Bienvenue
├── Étape 2: Choisir ceinture actuelle
├── Étape 3: Objectifs d'entraînement
└── Étape 4: Notification preferences
```

---

## 🔔 Système de Notifications

### Types de Notifications

| Type | Déclencheur | Destination |
|------|-------------|-------------|
| Nouvelle ceinture | Admin valide | Élève concerné |
| Évaluation reçue | Instructeur note | Élève noté |
| Nouveau cours | Instructeur publie | Tous les élèves concernés |
| Rappel entraînement | Cron (inactif 7j) | Élève inactif |
| Validation en attente | Élève soumet vidéo | Instructeur assigné |

### Centre de Notifications

```
/notifications
│
├── Header: Titre + [Tout marquer lu]
├── Tabs: [Toutes] [Non lues]
├── Liste notifications:
│   └── Item:
│       ├── Icon (type)
│       ├── Titre
│       ├── Description
│       ├── Timestamp
│       └── [→] (si action possible)
└── Empty state: "Aucune notification"
```

---

## 🎯 Deep Linking & URLs

| Action | URL Pattern |
|--------|-------------|
| Ouvrir cours | `/cours/[id]` |
| Lire vidéo | `/watch/[courseId]?t=120` |
| Voir profil élève | `/dashboard/eleves/[id]` |
| Nouvelle évaluation | `/evaluation?eleve=[id]&technique=[id]` |
| Assigner ceinture | `/admin/ceintures?eleve=[id]` |
| Notification | `/notifications/[notificationId]` |

---

## 📊 États de Chargement & Erreurs

### Skeleton Screens
- Accueil: Cards grises pulsantes
- Liste: 5 items skeleton
- Profil: Avatar + lignes texte

### Empty States
- Aucun cours: Icon + "Commencez votre formation"
- Aucun élève: "Aucun élève inscrit"
- Pas de connexion: Icon wifi barré + "Mode hors-ligne"

### Error Boundaries
- Message friendly: "Oups, quelque chose s'est mal passé"
- Bouton: "Réessayer"
- Option: "Retour à l'accueil"

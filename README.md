# FEKM Training App

Application web complète pour le suivi de progression des techniques de Krav Maga FEKM (Fédération Européenne de Krav Maga).

## ✨ Fonctionnalités

### Pour les pratiquants
- 📊 **Dashboard personnel** avec statistiques de progression
- 🥋 **Navigation hiérarchique** : Ceinture → Module → Technique
- 🔍 **Recherche** de techniques par nom ou catégorie
- 📈 **Suivi de progression** sur 4 niveaux :
  - 🔴 Non acquis
  - 🟡 En cours d'apprentissage
  - 🔵 Acquis
  - 🟢 Maîtrisé
- 🎥 **Gestion des vidéos** :
  - Vidéos coach officielles
  - Vidéos personnelles (slot débutant et progression)
- 📱 **Interface responsive** (mobile, tablette, desktop)

### Pour les administrateurs
- 🔐 **Espace admin** pour gérer le référentiel
- ➕ **CRUD complet** des ceintures, modules et techniques
- 📤 **Upload de vidéos** coach
- 👥 **Gestion des utilisateurs**

## 🛠️ Stack Technique

| Technologie | Usage |
|------------|-------|
| **Next.js 16** | Framework React (App Router) |
| **React 19** | UI Library |
| **TypeScript** | Typage statique |
| **Tailwind CSS** | Styling |
| **Prisma** | ORM Database |
| **PostgreSQL** | Base de données |
| **NextAuth.js** | Authentification |
| **bcryptjs** | Hashage des mots de passe |

## 🚀 Installation

### Prérequis
- Node.js 20+
- PostgreSQL 14+
- pnpm (recommandé)

### 1. Cloner et installer

```bash
git clone <repo-url>
cd fekm-app
pnpm install
```

### 2. Configuration environnement

```bash
cp .env.example .env
```

Éditer `.env` :
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fekm"

# Auth
NEXTAUTH_SECRET="votre-secret-aleatoire"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Initialisation de la base de données

```bash
# Générer le client Prisma
pnpm db:generate

# Créer les tables
pnpm db:migrate

# Remplir avec les données initiales (6 ceintures + techniques)
pnpm db:seed
```

### 4. Lancer l'application

```bash
# Mode développement
pnpm dev

# Production
pnpm build
pnpm start
```

L'application est disponible sur http://localhost:3000

## 📁 Structure du projet

```
fekm-app/
├── prisma/
│   ├── schema.prisma      # Modèles de données
│   └── seed.ts            # Données initiales
├── src/
│   ├── app/
│   │   ├── (app)/         # Routes protégées (authentifiées)
│   │   │   ├── dashboard/ # Page d'accueil
│   │   │   ├── belt/[id]/ # Détail ceinture
│   │   │   ├── module/[id]/# Détail module
│   │   │   └── technique/[id]/# Fiche technique
│   │   ├── api/           # API Routes
│   │   │   ├── auth/      # NextAuth
│   │   │   ├── belts/     # API ceintures
│   │   │   ├── modules/   # API modules
│   │   │   ├── techniques/# API techniques
│   │   │   └── progress/  # API progression
│   │   ├── login/         # Page de connexion
│   │   └── layout.tsx     # Layout racine
│   ├── components/
│   │   ├── ui/            # Composants UI réutilisables
│   │   ├── StatsCards.tsx
│   │   ├── RecentTechniques.tsx
│   │   └── ProgressChart.tsx
│   ├── lib/
│   │   ├── auth.ts        # Configuration NextAuth
│   │   ├── prisma.ts      # Client Prisma
│   │   └── utils.ts       # Helpers
│   └── types/
│       └── next-auth.d.ts # Types NextAuth
└── public/                # Assets statiques
```

## 🗄️ Modèle de données

### Entités principales

```
User (utilisateur)
├── email, password, role
├── belt (ceinture actuelle)
├── progress[] (progression par technique)
└── videos[] (vidéos personnelles)

Belt (ceinture)
├── name, color, order
├── content (descriptif détaillé)
└── modules[]

Module (UV - Unité de Valeur)
├── code, name, description
├── belt (ceinture parent)
└── techniques[]

Technique
├── name, category, description
├── instructions, keyPoints[]
├── module (module parent)
├── videos[] (vidéos coach)
└── progress[] (progression utilisateurs)

UserTechniqueProgress
├── user, technique
├── level (NON_ACQUIS → MAITRISE)
└── notes

VideoAsset
├── filename, path, duration
└── links (techniques) / userVideos
```

## 🔐 Authentification

L'application utilise **NextAuth.js** avec la stratégie `credentials` :
- Connexion par email/mot de passe
- Mots de passe hashés avec bcrypt
- Sessions JWT
- Middleware de protection des routes

### Compte de démo
```
Email : demo@fekm.com
Mot de passe : demo123
```

## 📊 Programme FEKM intégré

L'application inclut les 6 ceintures :

| Ceinture | Modules | Description |
|----------|---------|-------------|
| 🟡 Jaune | 5 UVs | Bases du Krav Maga |
| 🟠 Orange | 5 UVs | Défenses sur saisies |
| 🟢 Verte | 5 UVs | Attaques circulaires |
| 🔵 Bleue | 5 UVs | Sol et armes blanches |
| 🟤 Marron | 5 UVs | Armes à feu et situations complexes |
| ⚫ Noire 1ère Darga | 5 UVs | Synthèse et perfectionnement |

## 🎯 API Endpoints

### Ceintures
```
GET    /api/belts          # Liste des ceintures
GET    /api/belts/:id      # Détail d'une ceinture
```

### Modules
```
GET    /api/modules/:id    # Détail d'un module
```

### Techniques
```
GET    /api/techniques     # Liste (avec filtres)
GET    /api/techniques/:id # Détail d'une technique
```

### Progression
```
GET    /api/progress?techniqueId=:id
POST   /api/progress       # Créer/mettre à jour
{
  "techniqueId": "...",
  "level": "ACQUIS",
  "notes": "..."
}
```

## 🚀 Déploiement

### Vercel (recommandé)

```bash
pnpm i -g vercel
vercel
```

### Docker

```bash
# Build
docker build -t fekm-app .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  fekm-app
```

## 📝 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Développement avec hot reload |
| `pnpm build` | Build production |
| `pnpm start` | Démarrer en production |
| `pnpm lint` | Linter ESLint |
| `pnpm db:generate` | Générer le client Prisma |
| `pnpm db:migrate` | Exécuter les migrations |
| `pnpm db:seed` | Remplir la base de données |
| `pnpm db:studio` | Ouvrir Prisma Studio |

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit les changements (`git commit -m 'feat: ajout fonctionnalité'`)
4. Push sur la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## 📄 Licence

Propriété de la FEKM. Tous droits réservés.

---

Développé avec ❤️ pour la pratique du Krav Maga.

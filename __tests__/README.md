# 🧪 FEKM Training - Guide des Tests

Ce document décrit la stratégie de tests complète pour l'application FEKM Training.

## 📁 Structure des Tests

```
__tests__/
├── setup.ts                    # Configuration globale des tests
├── unit/                       # Tests unitaires
│   ├── lib/
│   │   ├── utils.test.ts       # Tests des utilitaires
│   │   └── auth.test.ts        # Tests de l'authentification
│   └── components/
│       ├── Button.test.tsx     # Tests du composant Button
│       └── LoginForm.test.tsx  # Tests du formulaire de login
├── integration/                # Tests d'intégration
│   └── api/
│       └── api.test.ts         # Tests des API routes
└── e2e/                        # Tests end-to-end
    ├── auth.spec.ts            # Tests d'authentification
    ├── navigation.spec.ts      # Tests de navigation
    └── progression.spec.ts     # Tests de progression
```

## 🚀 Démarrage Rapide

### Installation des dépendances

```bash
pnpm install
```

### Lancer tous les tests

```bash
pnpm test
```

### Lancer uniquement les tests unitaires

```bash
# Une seule exécution
pnpm test:unit

# Mode watch (développement)
pnpm test:unit:watch

# Avec couverture
pnpm test:unit:coverage
```

### Lancer les tests E2E

```bash
# Mode headless (CI)
pnpm test:e2e

# Mode UI (développement interactif)
pnpm test:e2e:ui

# Mode debug
pnpm test:e2e:debug

# Avec navigateur visible
pnpm test:e2e:headed
```

## 🧪 Tests Unitaires (Vitest)

### Configuration

- **Runner** : Vitest
- **Environnement** : jsdom
- **Library** : React Testing Library
- **Couverture** : v8

### Types de tests unitaires

#### 1. Tests des utilitaires (`/src/lib/utils.ts`)

```typescript
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('should merge tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})
```

#### 2. Tests des composants

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

#### 3. Tests des hooks

Les hooks personnalisés doivent être testés avec `renderHook` de React Testing Library.

### Bonnes pratiques

- Utiliser `userEvent` plutôt que `fireEvent` pour les interactions
- Mocker les appels externes (API, navigateur)
- Nettoyer après chaque test avec `cleanup`
- Utiliser des données de test cohérentes

## 🔗 Tests d'Intégration

### Tests des API Routes

```typescript
import { GET } from '@/app/api/belts/route'
import { NextRequest } from 'next/server'

describe('/api/belts', () => {
  it('should return all belts', async () => {
    const response = await GET()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
  })
})
```

### Points à tester

- Codes HTTP corrects (200, 401, 404, 500)
- Validation des données (Zod)
- Authentification requise
- Gestion des erreurs

## 🎭 Tests E2E (Playwright)

### Configuration

- **Navigateur** : Chromium (Firefox et Webkit disponibles)
- **Viewport** : 1280x720 par défaut
- **Base URL** : http://localhost:3000

### Scénarios critiques testés

#### 1. Authentification (`auth.spec.ts`)

- Connexion avec identifiants valides
- Échec avec identifiants invalides
- Connexion avec Google (si configuré)
- Redirection après connexion
- Protection des routes

#### 2. Navigation (`navigation.spec.ts`)

- Navigation ceinture → module → technique
- Responsive design (mobile)
- Menu de navigation
- Retour arrière

#### 3. Progression (`progression.spec.ts`)

- Affichage des statistiques
- Mise à jour du statut d'une technique
- Persistance après refresh
- Gestion des erreurs API

### Bonnes pratiques E2E

- Utiliser des `data-testid` pour les sélecteurs stables
- Éviter les timeouts fixes, privilégier les attentes conditionnelles
- Tester le comportement, pas l'implémentation
- Utiliser des fixtures pour les données récurrentes

## ♿ Tests d'Accessibilité

### Lighthouse CI

Intégré dans le workflow GitHub Actions, Lighthouse vérifie :

- **Score d'accessibilité** : > 90
- **Contraste des couleurs** : conforme WCAG
- **Labels ARIA** : présents et valides
- **Navigation clavier** : fonctionnelle

### Manuel

```bash
# Lancer Lighthouse en local
npx @lhci/cli autorun
```

### Points de vérification

- [ ] Tous les boutons ont un label accessible
- [ ] Les images ont un attribut `alt`
- [ ] Les formulaires ont des labels associés
- [ ] La navigation au clavier est possible
- [ ] Les contrastes respectent les normes WCAG 2.1 AA

## 🔄 CI/CD (GitHub Actions)

Le workflow `.github/workflows/ci.yml` exécute :

1. **Lint & Type Check** : ESLint + TypeScript
2. **Unit Tests** : Vitest avec couverture
3. **E2E Tests** : Playwright avec base de données PostgreSQL
4. **Lighthouse** : Audit d'accessibilité et performance

### Variables d'environnement requises

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/db
NEXTAUTH_SECRET=votre-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```

## 📊 Couverture de Code

La couverture est générée automatiquement avec Vitest. Les rapports sont disponibles dans :

- `coverage/` : Rapport HTML détaillé
- Codecov : Intégration GitHub

### Exclusions de couverture

- Fichiers de configuration
- Types TypeScript
- Routes d'authentification NextAuth
- Middleware

## 🐛 Debugging

### Tests unitaires

```bash
# Avec console.log
pnpm test:unit --reporter=verbose

# Avec debugger
pnpm test:unit --inspect-brk
```

### Tests E2E

```bash
# Mode UI interactif
pnpm test:e2e:ui

# Mode debug avec pas à pas
pnpm test:e2e:debug

# Voir le trace viewer
pnpm exec playwright show-report
```

## 📝 Ajouter de nouveaux tests

### 1. Tests unitaires

```bash
# Créer le fichier
touch __tests__/unit/components/MonComposant.test.tsx
```

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MonComposant } from '@/components/MonComposant'

describe('MonComposant', () => {
  it('should render', () => {
    render(<MonComposant />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### 2. Tests E2E

```bash
# Créer le fichier
touch __tests__/e2e/ma-feature.spec.ts
```

```typescript
import { test, expect } from '@playwright/test'

test.describe('Ma Feature', () => {
  test('should work', async ({ page }) => {
    await page.goto('/ma-page')
    await expect(page.getByText('Titre')).toBeVisible()
  })
})
```

## 🔗 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)

## 🤝 Contribution

Avant de soumettre une PR :

1. ✅ Tous les tests passent : `pnpm test`
2. ✅ La couverture ne diminue pas
3. ✅ Les tests E2E passent en local
4. ✅ Pas de régression d'accessibilité (Lighthouse > 90)

---

Pour toute question, consultez la documentation officielle ou ouvrez une issue.

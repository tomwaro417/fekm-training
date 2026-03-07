# FEKM Training - Design System

## 🎨 Identité Visuelle

### Couleurs Principales

```css
/* Palette Krav Maga FEKM */
--fekm-black: #0A0A0A;        /* Fond principal */
--fekm-dark: #1A1A1A;         /* Surfaces secondaires */
--fekm-gray-900: #2D2D2D;     /* Cards, éléments élevés */
--fekm-gray-800: #404040;     /* Bordures, séparateurs */
--fekm-gray-600: #6B7280;     /* Texte secondaire */
--fekm-gray-400: #9CA3AF;     /* Texte tertiaire, placeholders */
--fekm-gray-200: #E5E7EB;     /* Bordures légères */
--fekm-white: #FFFFFF;        /* Texte principal */

/* Couleurs d'accent */
--fekm-red: #DC2626;          /* Actions principales, alertes */
--fekm-red-dark: #991B1B;     /* Hover states */
--fekm-red-light: #FEE2E2;    /* Backgrounds d'alerte */
--fekm-gold: #F59E0B;         /* Ceintures avancées, succès */
--fekm-gold-dark: #D97706;    /* Hover gold */
--fekm-blue: #3B82F6;         /* Actions secondaires, liens */
--fekm-green: #10B981;        /* Succès, validation */
--fekm-orange: #F97316;       /* Warnings, ceintures intermédiaires */
```

### Système de Ceintures (Couleurs Officielles)

| Ceinture | Couleur | Hex | Usage |
|----------|---------|-----|-------|
| Blanche | Blanc pur | #FFFFFF | Débutant |
| Jaune | Jaune vif | #FACC15 | Niveau 1 |
| Orange | Orange | #F97316 | Niveau 2 |
| Verte | Vert | #22C55E | Niveau 3 |
| Bleue | Bleu | #3B82F6 | Niveau 4 |
| Marron | Marron | #92400E | Niveau 5 |
| Noire 1er DAN | Noir | #000000 | Expert |
| Noire 2e DAN | Noir/Rouge | #000000 | Expert avancé |
| Noire 3e DAN+ | Noir/Or | #000000 | Maître |

### Typographie

```css
/* Font Stack */
--font-primary: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Échelle Typographique (Mobile-First) */
--text-xs: 0.75rem;      /* 12px - Captions, badges */
--text-sm: 0.875rem;     /* 14px - Corps secondaire */
--text-base: 1rem;       /* 16px - Corps principal */
--text-lg: 1.125rem;     /* 18px - Titres section */
--text-xl: 1.25rem;      /* 20px - Titres cards */
--text-2xl: 1.5rem;      /* 24px - Titres page mobile */
--text-3xl: 1.875rem;    /* 30px - Titres page desktop */

/* Poids */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Height */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### Espacement

```css
/* Échelle d'espacement */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Ombres & Élévation

```css
/* Ombres pour mode sombre (default) */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4);

/* Glow effects pour accents */
--glow-red: 0 0 20px rgba(220, 38, 38, 0.3);
--glow-gold: 0 0 20px rgba(245, 158, 11, 0.3);
```

### Rayons de Bordure

```css
--radius-sm: 0.25rem;   /* 4px - Badges, tags */
--radius-md: 0.5rem;    /* 8px - Buttons, inputs */
--radius-lg: 0.75rem;   /* 12px - Cards */
--radius-xl: 1rem;      /* 16px - Modals, large cards */
--radius-2xl: 1.5rem;   /* 24px - Hero sections */
--radius-full: 9999px;  /* Pills, avatars */
```

---

## 🧩 Composants Réutilisables

### Boutons

#### Primary Button (Red)
```
- Background: --fekm-red
- Text: --fekm-white
- Padding: 12px 24px (mobile) / 16px 32px (desktop)
- Border-radius: --radius-md
- Font-weight: --font-semibold
- Hover: --fekm-red-dark + scale(1.02)
- Active: scale(0.98)
- Disabled: opacity 0.5, cursor not-allowed
```

#### Secondary Button (Outline)
```
- Background: transparent
- Border: 2px solid --fekm-gray-800
- Text: --fekm-white
- Hover: Background --fekm-gray-900
```

#### Ghost Button
```
- Background: transparent
- Text: --fekm-gray-400
- Hover: Text --fekm-white, Background --fekm-gray-900
```

#### Icon Button
```
- Size: 44px x 44px (touch target minimum)
- Border-radius: --radius-md
- Background: --fekm-gray-900
- Hover: --fekm-gray-800
```

### Cards

#### Standard Card
```
- Background: --fekm-gray-900
- Border-radius: --radius-lg
- Padding: --space-4 (mobile) / --space-6 (desktop)
- Shadow: --shadow-md
- Border: 1px solid --fekm-gray-800
```

#### Interactive Card (Clickable)
```
- Same as Standard
- Hover: Border color --fekm-gray-600, translateY(-2px)
- Active: translateY(0)
- Focus: Ring 2px --fekm-red
```

#### Video Card
```
- Aspect ratio: 16/9 thumbnail
- Overlay: Gradient bottom for title
- Play button: Centered, 64px circle
- Duration badge: Bottom-right corner
```

### Formulaires

#### Input Text
```
- Background: --fekm-dark
- Border: 1px solid --fekm-gray-800
- Border-radius: --radius-md
- Padding: 12px 16px
- Text: --fekm-white
- Placeholder: --fekm-gray-600
- Focus: Border --fekm-red, ring 2px --fekm-red/20
- Error: Border --fekm-red, text --fekm-red-light
```

#### Select/Dropdown
```
- Same styling as Input
- Chevron icon right
- Custom dropdown menu: --fekm-gray-900, shadow-lg
```

#### Checkbox
```
- Size: 24px x 24px
- Border-radius: --radius-sm
- Checked: Background --fekm-red, checkmark white
- Focus: Ring 2px --fekm-red
```

### Navigation

#### Bottom Tab Bar (Mobile)
```
- Position: Fixed bottom
- Height: 64px + safe-area-inset-bottom
- Background: --fekm-dark with backdrop-blur
- Border-top: 1px solid --fekm-gray-800
- 4-5 items max
- Active: Icon + label --fekm-red
- Inactive: --fekm-gray-600
```

#### Top Navigation
```
- Height: 56px (mobile) / 64px (desktop)
- Background: --fekm-black/80 with backdrop-blur
- Logo left
- Actions right (icon buttons)
```

### Feedback & États

#### Toast/Notification
```
- Position: Top-center or bottom-center
- Background: --fekm-gray-900
- Border-left: 4px solid (color by type)
- Padding: --space-4
- Border-radius: --radius-md
- Shadow: --shadow-lg
- Auto-dismiss: 5s
```

#### Loading States
```
- Spinner: 24px, --fekm-red, border 2px
- Skeleton: Shimmer animation, --fekm-gray-800 base
- Button loading: Spinner replaces text, disabled state
```

#### Empty State
```
- Icon: 64px, --fekm-gray-600
- Title: --text-lg, --font-semibold
- Description: --text-sm, --fekm-gray-400
- Action: Secondary button
```

### Badges & Tags

#### Belt Badge
```
- Size: 24px x 24px (mobile) / 32px x 32px (desktop)
- Border-radius: --radius-sm
- Color: Belt color
- Border: 2px solid white/20 (for dark belts)
```

#### Status Badge
```
- Padding: 4px 12px
- Border-radius: --radius-full
- Font-size: --text-xs
- Font-weight: --font-semibold
- Variants:
  - Success: bg-green-500/20, text-green-400
  - Warning: bg-orange-500/20, text-orange-400
  - Error: bg-red-500/20, text-red-400
  - Info: bg-blue-500/20, text-blue-400
```

### Modal/Dialog

```
- Overlay: --fekm-black/80, backdrop-blur-sm
- Content: --fekm-gray-900, max-width 90vw / 500px
- Border-radius: --radius-xl
- Padding: --space-6
- Close button: Top-right, icon button
- Animation: Fade in + scale from 0.95
```

### Progress & Meters

#### Linear Progress
```
- Height: 8px
- Background: --fekm-gray-800
- Fill: --fekm-red (or belt color)
- Border-radius: --radius-full
```

#### Circular Progress
```
- Size: 48px / 64px / 96px variants
- Stroke: 4px
- Track: --fekm-gray-800
- Fill: --fekm-red
```

#### Star Rating
```
- Size: 24px (mobile) / 32px (desktop)
- Filled: --fekm-gold
- Empty: --fekm-gray-800
- Half: Gradient or icon variant
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
--screen-sm: 640px;   /* Large phones */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Small laptops */
--screen-xl: 1280px;  /* Desktops */
--screen-2xl: 1536px; /* Large screens */
```

### Layout Patterns

#### Mobile (< 768px)
- Single column
- Bottom navigation
- Full-width cards
- Touch targets min 44px

#### Tablet (768px - 1024px)
- 2-column grid for cards
- Side navigation possible
- Larger touch targets

#### Desktop (> 1024px)
- Multi-column layouts
- Persistent side navigation
- Hover states enabled
- Max-width containers

---

## ♿ Accessibilité (WCAG AA)

### Contraste
- Texte normal: Ratio minimum 4.5:1
- Texte large (18px+): Ratio minimum 3:1
- UI Components: Ratio minimum 3:1

### Focus Visibles
- Tous les éléments interactifs ont un ring de focus
- Couleur: --fekm-red
- Offset: 2px
- Épaisseur: 2px

### Touch Targets
- Minimum: 44px x 44px
- Espacement: 8px minimum entre cibles

### Réduction de Mouvement
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Support Screen Readers
- Labels aria sur tous les icon buttons
- Roles appropriés (button, link, navigation)
- Live regions pour notifications
- Alt text sur images

---

## 🎬 Animations & Transitions

### Durées
```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--easing-default: cubic-bezier(0.4, 0, 0.2, 1);
--easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Transitions Courantes
- Hover buttons: --duration-fast
- Modal open/close: --duration-normal
- Page transitions: --duration-slow
- Toast enter/exit: --duration-normal

### Animations Clés
- Pulse: Pour notifications, enregistrement
- Shimmer: Pour skeletons
- Bounce: Pour feedback positif
- Slide: Pour modals, drawers

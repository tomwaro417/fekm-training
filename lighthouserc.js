module.exports = {
  ci: {
    collect: {
      // Nombre de runs pour la moyenne
      numberOfRuns: 3,
      // URL à tester
      url: ['http://localhost:3000/login'],
      // Démarrer le serveur
      startServerCommand: 'pnpm start',
      // Attendre que le serveur soit prêt
      startServerReadyPattern: 'ready on',
      // Timeout
      startServerReadyTimeout: 60000,
    },
    assert: {
      assertions: {
        // Performance
        'categories:performance': ['warn', { minScore: 0.7 }],
        // Accessibilité - doit être > 90
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // Bonnes pratiques
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        // SEO
        'categories:seo': ['warn', { minScore: 0.8 }],
        
        // Métriques spécifiques
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        
        // Accessibilité spécifique
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'aria-required-children': 'error',
        'aria-required-parent': 'error',
        'aria-roles': 'error',
        'aria-valid-attr-value': 'error',
        'aria-valid-attr': 'error',
        'button-name': 'error',
        'bypass': 'error',
        'color-contrast': 'error',
        'document-title': 'error',
        'duplicate-id-active': 'error',
        'duplicate-id-aria': 'error',
        'form-field-multiple-labels': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'image-alt': 'error',
        'input-button-name': 'error',
        'label': 'error',
        'link-name': 'error',
        'list': 'error',
        'listitem': 'error',
        'meta-viewport': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}

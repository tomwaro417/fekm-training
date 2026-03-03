import { defineConfig, devices } from '@playwright/test'

/**
 * Configuration Playwright pour les tests E2E de FEKM Training
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './__tests__/e2e',
  
  /* Exécuter les tests en parallèle */
  fullyParallel: true,
  
  /* Échouer après 1 retry en CI */
  forbidOnly: !!process.env.CI,
  
  /* Retry une fois en CI, pas en local */
  retries: process.env.CI ? 1 : 0,
  
  /* Workers parallèles */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  /* Configuration globale des tests */
  use: {
    /* Base URL */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Capturer traces en cas d'échec */
    trace: 'on-first-retry',
    
    /* Screenshots en cas d'échec */
    screenshot: 'only-on-failure',
    
    /* Vidéo en cas d'échec */
    video: 'on-first-retry',
    
    /* Viewport par défaut */
    viewport: { width: 1280, height: 720 },
  },

  /* Projets de tests */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security'],
        },
      },
    },
    // Décommenter pour tester sur d'autres navigateurs
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // Test mobile
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* Démarrer le serveur avant les tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})

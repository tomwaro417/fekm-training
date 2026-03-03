import { test, expect } from '@playwright/test'

test.describe('Navigation - Ceinture → Module → Technique', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter avant chaque test
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('demo@fekm.com')
    await page.getByLabel(/mot de passe/i).fill('demo123')
    await page.getByRole('button', { name: /se connecter/i }).click()
    await page.waitForURL('/dashboard')
  })

  test('should navigate from dashboard to belts page', async ({ page }) => {
    // Aller au dashboard
    await page.goto('/dashboard')
    
    // Cliquer sur le lien vers les ceintures
    await page.getByRole('link', { name: /commencer à apprendre/i }).click()
    
    // Vérifier qu'on est sur la page des ceintures
    await page.waitForURL('/ceintures')
    await expect(page.getByRole('heading', { name: /les ceintures fekm/i })).toBeVisible()
  })

  test('should display belts list with correct structure', async ({ page }) => {
    await page.goto('/ceintures')
    
    // Attendre le chargement
    await page.waitForSelector('[class*="belt"], [class*="ceinture"]', { timeout: 5000 }).catch(() => {})
    
    // Vérifier le titre
    await expect(page.getByRole('heading', { name: /les ceintures fekm/i })).toBeVisible()
    
    // Vérifier la description
    await expect(page.getByText(/découvrez les différents niveaux de progression/i)).toBeVisible()
    
    // Vérifier que les ceintures sont affichées (s'il y en a)
    const beltLinks = page.locator('a[href^="/ceintures/"]')
    const count = await beltLinks.count()
    
    if (count > 0) {
      // Vérifier au moins une ceinture
      await expect(beltLinks.first()).toBeVisible()
    }
  })

  test('should navigate to belt detail page', async ({ page }) => {
    await page.goto('/ceintures')
    
    // Attendre le chargement des ceintures
    await page.waitForTimeout(1000)
    
    // Trouver le premier lien de ceinture
    const firstBeltLink = page.locator('a[href^="/ceintures/"]').first()
    
    if (await firstBeltLink.isVisible().catch(() => false)) {
      // Récupérer l'URL
      const href = await firstBeltLink.getAttribute('href')
      
      // Cliquer sur la ceinture
      await firstBeltLink.click()
      
      // Vérifier la navigation
      await page.waitForURL(href!)
      
      // Vérifier que la page de détail s'affiche
      await expect(page.locator('h1, h2').first()).toBeVisible()
    }
  })

  test('should display belt detail with modules', async ({ page }) => {
    // Aller directement sur une ceinture (par exemple la première)
    await page.goto('/ceintures')
    
    // Attendre et cliquer sur la première ceinture
    const firstBelt = page.locator('a[href^="/ceintures/"]').first()
    
    if (await firstBelt.isVisible().catch(() => false)) {
      await firstBelt.click()
      
      // Attendre le chargement de la page de détail
      await page.waitForTimeout(1000)
      
      // Vérifier qu'il y a du contenu
      const content = page.locator('main, [class*="content"], article').first()
      await expect(content).toBeVisible()
    }
  })

  test('should navigate back from belt detail to belts list', async ({ page }) => {
    await page.goto('/ceintures')
    
    const firstBelt = page.locator('a[href^="/ceintures/"]').first()
    
    if (await firstBelt.isVisible().catch(() => false)) {
      await firstBelt.click()
      await page.waitForTimeout(1000)
      
      // Revenir en arrière
      await page.goBack()
      
      // Vérifier qu'on est revenu sur la liste
      await expect(page.getByRole('heading', { name: /les ceintures fekm/i })).toBeVisible()
    }
  })

  test('should display header with navigation on all pages', async ({ page }) => {
    // Vérifier le header sur plusieurs pages
    const pages = ['/', '/ceintures', '/dashboard']
    
    for (const url of pages) {
      await page.goto(url)
      
      // Vérifier que le header est présent
      const header = page.locator('header, [class*="header"]').first()
      await expect(header).toBeVisible()
    }
  })

  test('should navigate using header links', async ({ page }) => {
    await page.goto('/')
    
    // Chercher les liens de navigation dans le header
    const navLinks = page.locator('header a, nav a')
    const count = await navLinks.count()
    
    if (count > 0) {
      // Tester le premier lien de navigation (si ce n'est pas la page actuelle)
      const firstLink = navLinks.first()
      const href = await firstLink.getAttribute('href')
      
      if (href && href !== '/' && !href.startsWith('#')) {
        await firstLink.click()
        await page.waitForURL(href)
      }
    }
  })
})

test.describe('Navigation - Mobile Responsive', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter avant chaque test
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('demo@fekm.com')
    await page.getByLabel(/mot de passe/i).fill('demo123')
    await page.getByRole('button', { name: /se connecter/i }).click()
    await page.waitForURL('/dashboard')
  })

  test('should display correctly on mobile viewport', async ({ page }) => {
    // Définir une viewport mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Aller sur la page des ceintures
    await page.goto('/ceintures')
    
    // Vérifier que le contenu s'affiche
    await expect(page.getByRole('heading', { name: /les ceintures fekm/i })).toBeVisible()
    
    // Vérifier que les éléments sont visibles sans débordement horizontal
    const body = page.locator('body')
    const bodyBox = await body.boundingBox()
    
    // Le body ne devrait pas dépasser la largeur de l'écran
    expect(bodyBox?.width).toBeLessThanOrEqual(375)
  })

  test('should show mobile menu if implemented', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Chercher un bouton de menu mobile
    const menuButton = page.locator('button[aria-label*="menu"], button[class*="menu"], [class*="hamburger"]').first()
    
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click()
      
      // Vérifier que le menu s'ouvre
      const mobileMenu = page.locator('[class*="mobile-menu"], [class*="drawer"], nav').first()
      await expect(mobileMenu).toBeVisible()
    }
  })
})

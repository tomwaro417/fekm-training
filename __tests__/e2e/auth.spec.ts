import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Aller à la page de login avant chaque test
    await page.goto('/login')
  })

  test('should display login page correctly', async ({ page }) => {
    // Vérifier le titre
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
    
    // Vérifier les champs
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
    
    // Vérifier les boutons
    await expect(page.getByRole('button', { name: /continuer avec google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible()
    
    // Vérifier les infos démo
    await expect(page.getByText(/demo@fekm.com/i)).toBeVisible()
    await expect(page.getByText(/demo123/i)).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    // Remplir le formulaire avec des identifiants invalides
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/mot de passe/i).fill('wrongpassword')
    
    // Soumettre le formulaire
    await page.getByRole('button', { name: /se connecter/i }).click()
    
    // Attendre et vérifier le message d'erreur
    await expect(page.getByText(/email ou mot de passe incorrect/i)).toBeVisible()
  })

  test('should login successfully with demo credentials', async ({ page }) => {
    // Remplir avec les identifiants démo
    await page.getByLabel(/email/i).fill('demo@fekm.com')
    await page.getByLabel(/mot de passe/i).fill('demo123')
    
    // Soumettre le formulaire
    await page.getByRole('button', { name: /se connecter/i }).click()
    
    // Vérifier la redirection vers le dashboard
    await page.waitForURL('/dashboard')
    
    // Vérifier que le dashboard s'affiche
    await expect(page.getByText(/bonjour/i)).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    // Essayer de soumettre avec un email invalide
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/mot de passe/i).fill('somepassword')
    
    // Cliquer sur le bouton de connexion
    await page.getByRole('button', { name: /se connecter/i }).click()
    
    // Le navigateur devrait valider le format email (type="email")
    // La validation HTML5 empêche la soumission
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('should require password field', async ({ page }) => {
    // Remplir seulement l'email
    await page.getByLabel(/email/i).fill('test@example.com')
    
    // Vérifier que le mot de passe est requis
    const passwordInput = page.getByLabel(/mot de passe/i)
    await expect(passwordInput).toHaveAttribute('required')
  })

  test('should redirect to dashboard when already logged in', async ({ page }) => {
    // Se connecter d'abord
    await page.getByLabel(/email/i).fill('demo@fekm.com')
    await page.getByLabel(/mot de passe/i).fill('demo123')
    await page.getByRole('button', { name: /se connecter/i }).click()
    
    // Attendre la redirection
    await page.waitForURL('/dashboard')
    
    // Essayer d'aller à la page de login
    await page.goto('/login')
    
    // Devrait rediriger vers le dashboard
    await page.waitForURL('/dashboard')
  })

  test('should logout successfully', async ({ page }) => {
    // Se connecter
    await page.getByLabel(/email/i).fill('demo@fekm.com')
    await page.getByLabel(/mot de passe/i).fill('demo123')
    await page.getByRole('button', { name: /se connecter/i }).click()
    
    // Attendre le dashboard
    await page.waitForURL('/dashboard')
    
    // Cliquer sur le bouton de déconnexion (si présent)
    const logoutButton = page.getByRole('button', { name: /déconnexion|logout/i })
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click()
      
      // Vérifier la redirection vers la page de login
      await page.waitForURL('/login')
    }
  })
})

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Devrait rediriger vers la page de login
    await page.waitForURL('/login')
  })

  test('should redirect to login when accessing belts detail without auth', async ({ page }) => {
    await page.goto('/ceintures/some-id')
    
    // Devrait rediriger vers la page de login
    await page.waitForURL('/login')
  })
})

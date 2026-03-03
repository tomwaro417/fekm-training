import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/LoginForm'

// Mock next-auth/react
const mockSignIn = vi.fn()
vi.mock('next-auth/react', () => ({
  signIn: (...args: any[]) => mockSignIn(...args),
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
}))

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form with all elements', () => {
    render(<LoginForm />)
    
    // Vérifier les champs
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
    
    // Vérifier les boutons
    expect(screen.getByRole('button', { name: /continuer avec google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
    
    // Vérifier le titre séparateur
    expect(screen.getByText(/ou/i)).toBeInTheDocument()
  })

  it('should show demo account info', () => {
    render(<LoginForm />)
    
    expect(screen.getByText(/compte de démo/i)).toBeInTheDocument()
    expect(screen.getByText(/demo@fekm.com/i)).toBeInTheDocument()
    expect(screen.getByText(/demo123/i)).toBeInTheDocument()
  })

  it('should update email input on change', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')
    
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('should update password input on change', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    await user.type(passwordInput, 'password123')
    
    expect(passwordInput).toHaveValue('password123')
  })

  it('should show error message on failed login', async () => {
    mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/email ou mot de passe incorrect/i)).toBeInTheDocument()
    })
  })

  it('should call signIn with credentials on form submit', async () => {
    mockSignIn.mockResolvedValue({ ok: true })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      })
    })
  })

  it('should redirect to dashboard on successful login', async () => {
    mockSignIn.mockResolvedValue({ ok: true })
    
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('should call signIn with Google provider', async () => {
    render(<LoginForm />)
    
    const googleButton = screen.getByRole('button', { name: /continuer avec google/i })
    fireEvent.click(googleButton)
    
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' })
  })

  it('should show loading state during submission', async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<LoginForm />)
    
    // Remplir le formulaire avant de soumettre
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    fireEvent.click(submitButton)
    
    // Vérifier que le texte change en "Connexion..."
    await waitFor(() => {
      expect(screen.getByText(/Connexion/i)).toBeInTheDocument()
    })
  })

  it('should disable buttons while loading', async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {}))
    
    render(<LoginForm />)
    
    // Remplir le formulaire
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    const submitButton = screen.getByRole('button', { name: /se connecter/i })
    fireEvent.click(submitButton)
    
    // Attendre que le bouton soit désactivé
    await waitFor(() => {
      const disabledButton = screen.getByRole('button', { name: /Connexion/i })
      expect(disabledButton).toBeDisabled()
    })
  })

  it('should require email field', () => {
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toHaveAttribute('required')
  })

  it('should require password field', () => {
    render(<LoginForm />)
    
    const passwordInput = screen.getByLabelText(/mot de passe/i)
    expect(passwordInput).toHaveAttribute('required')
  })

  it('should have correct input types', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText(/mot de passe/i)).toHaveAttribute('type', 'password')
  })
})

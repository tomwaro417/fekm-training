import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock des dépendances
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}))

describe('Auth Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have correct auth pages configuration', async () => {
    const { authOptions } = await import('@/lib/auth')
    
    expect(authOptions.pages).toEqual({
      signIn: '/login',
      error: '/login',
    })
  })

  it('should use JWT session strategy', async () => {
    const { authOptions } = await import('@/lib/auth')
    
    expect(authOptions.session).toEqual({
      strategy: 'jwt',
    })
  })

  it('should have providers configured', async () => {
    const { authOptions } = await import('@/lib/auth')
    
    expect(authOptions.providers).toBeDefined()
    expect(authOptions.providers.length).toBeGreaterThan(0)
  })

  it('should have callbacks configured', async () => {
    const { authOptions } = await import('@/lib/auth')
    
    expect(authOptions.callbacks).toBeDefined()
    expect(authOptions.callbacks?.jwt).toBeTypeOf('function')
    expect(authOptions.callbacks?.session).toBeTypeOf('function')
  })
})

describe('JWT Callback', () => {
  it('should add user data to token', async () => {
    const { authOptions } = await import('@/lib/auth')
    const jwtCallback = authOptions.callbacks?.jwt
    
    if (!jwtCallback) {
      throw new Error('JWT callback not defined')
    }

    const token = { name: 'Test' }
    const user = {
      id: 'user-123',
      role: 'STUDENT',
      beltId: 'belt-456',
      beltName: 'Ceinture Jaune',
      email: 'test@example.com',
      emailVerified: null,
    } as any

    const result = await jwtCallback({ token, user, account: null, trigger: 'signIn' })
    
    expect(result).toMatchObject({
      name: 'Test',
      id: 'user-123',
      role: 'STUDENT',
      beltId: 'belt-456',
      beltName: 'Ceinture Jaune',
    })
  })

  it('should return unchanged token when no user', async () => {
    const { authOptions } = await import('@/lib/auth')
    const jwtCallback = authOptions.callbacks?.jwt
    
    if (!jwtCallback) {
      throw new Error('JWT callback not defined')
    }

    const token = { name: 'Test', id: 'existing-id' }
    
    const result = await jwtCallback({ token, user: undefined as any, account: null, trigger: 'update' })
    
    expect(result).toEqual(token)
  })
})

describe('Session Callback', () => {
  it('should add token data to session', async () => {
    const { authOptions } = await import('@/lib/auth')
    const sessionCallback = authOptions.callbacks?.session
    
    if (!sessionCallback) {
      throw new Error('Session callback not defined')
    }

    const session = {
      user: { name: 'Test', email: 'test@example.com', id: '', role: 'STUDENT' },
      expires: new Date().toISOString(),
    } as any
    const token = {
      id: 'user-123',
      role: 'STUDENT',
      beltId: 'belt-456',
      beltName: 'Ceinture Jaune',
    }

    const result = await sessionCallback({ session, token, user: session.user, newSession: session, trigger: 'update' })
    
    expect(result.user).toMatchObject({
      name: 'Test',
      email: 'test@example.com',
      id: 'user-123',
      role: 'STUDENT',
      beltId: 'belt-456',
      beltName: 'Ceinture Jaune',
    })
  })
})

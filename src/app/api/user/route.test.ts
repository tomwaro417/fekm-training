import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PATCH } from '@/app/api/user/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('GET /api/user', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devrait retourner 401 si non authentifié', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/user')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('devrait retourner les informations utilisateur', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com' },
    }

    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: null,
      role: 'STUDENT',
      belt: { id: 'belt-1', name: 'JAUNE', color: '#FFD700', order: 1 },
      beltHistory: [],
      _count: { progress: 5, videos: 2 },
    }

    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    const request = new NextRequest('http://localhost:3000/api/user')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe('user-1')
    expect(data.name).toBe('Test User')
    expect(data.stats.totalTechniquesProgress).toBe(5)
  })
})

describe('PATCH /api/user', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devrait mettre à jour le nom utilisateur', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com' },
    }

    vi.mocked(getServerSession).mockResolvedValue(mockSession)
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'user-1',
      name: 'Nouveau Nom',
      email: 'test@example.com',
    } as any)

    const request = new NextRequest('http://localhost:3000/api/user', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Nouveau Nom' }),
    })

    const response = await PATCH(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.name).toBe('Nouveau Nom')
  })
})

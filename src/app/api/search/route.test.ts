import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/search/route'
import { NextRequest } from 'next/server'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    technique: {
      findMany: vi.fn(),
    },
    module: {
      findMany: vi.fn(),
    },
    belt: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devrait retourner une erreur 400 si la requête est trop courte', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=a')
    const response = await GET(request)
    
    expect(response.status).toBe(400)
  })

  it('devrait retourner des résultats de recherche', async () => {
    const mockTechniques = [
      {
        id: '1',
        name: 'Direct de poing',
        description: 'Coup de poing tendu',
        module: {
          code: 'UV1',
          belt: { name: 'JAUNE', color: '#FFD700' },
        },
      },
    ]

    // Mock partiel : le type Prisma complet exige tous les champs scalaires
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(prisma.technique.findMany).mockResolvedValue(mockTechniques as any)
    vi.mocked(prisma.module.findMany).mockResolvedValue([])
    vi.mocked(prisma.belt.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/search?q=poing')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results).toHaveLength(1)
    expect(data.results[0].name).toBe('Direct de poing')
    expect(data.results[0].type).toBe('technique')
  })

  it('devrait retourner des résultats vides si aucun résultat', async () => {
    vi.mocked(prisma.technique.findMany).mockResolvedValue([])
    vi.mocked(prisma.module.findMany).mockResolvedValue([])
    vi.mocked(prisma.belt.findMany).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/search?q=xyz123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results).toHaveLength(0)
  })
})

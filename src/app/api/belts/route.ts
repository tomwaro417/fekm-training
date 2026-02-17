import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/belts - Liste toutes les ceintures
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const belts = await prisma.belt.findMany({
      orderBy: { order: 'asc' },
      include: {
        content: true,
        modules: {
          orderBy: { order: 'asc' },
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { modules: true },
        },
      },
    })

    return NextResponse.json(belts)
  } catch (error) {
    console.error('Erreur GET /api/belts:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des ceintures' },
      { status: 500 }
    )
  }
}

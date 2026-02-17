import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/belts/[id] - Détail d'une ceinture avec ses modules
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    const belt = await prisma.belt.findUnique({
      where: { id },
      include: {
        content: true,
        modules: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { techniques: true },
            },
          },
        },
      },
    })

    if (!belt) {
      return NextResponse.json(
        { error: 'Ceinture non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(belt)
  } catch (error) {
    console.error('Erreur GET /api/belts/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la ceinture' },
      { status: 500 }
    )
  }
}

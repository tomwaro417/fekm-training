import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/modules/[id] - Détail d'un module avec ses techniques
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

    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        belt: {
          select: { id: true, name: true, color: true },
        },
        techniques: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { videos: true },
            },
          },
        },
      },
    })

    if (!module) {
      return NextResponse.json(
        { error: 'Module non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(module)
  } catch (error) {
    console.error('Erreur GET /api/modules/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du module' },
      { status: 500 }
    )
  }
}

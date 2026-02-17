import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/techniques/[id] - Détail d'une technique
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
    const userId = session.user.id

    const technique = await prisma.technique.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            belt: {
              select: { id: true, name: true, color: true },
            },
          },
        },
        videos: {
          include: {
            video: true,
          },
        },
        progress: {
          where: { userId },
        },
      },
    })

    if (!technique) {
      return NextResponse.json(
        { error: 'Technique non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer les vidéos personnelles de l'utilisateur
    const userVideos = await prisma.userTechniqueVideo.findMany({
      where: {
        userId,
        techniqueId: id,
      },
      include: {
        video: true,
      },
    })

    return NextResponse.json({
      ...technique,
      userVideos,
    })
  } catch (error) {
    console.error('Erreur GET /api/techniques/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la technique' },
      { status: 500 }
    )
  }
}

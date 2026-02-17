import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const progressSchema = z.object({
  techniqueId: z.string(),
  level: z.enum(['NON_ACQUIS', 'EN_COURS_DAPPRENTISSAGE', 'ACQUIS', 'MAITRISE']),
  notes: z.string().optional(),
})

// GET /api/progress - Récupère la progression de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const techniqueId = searchParams.get('techniqueId')
    const beltId = searchParams.get('beltId')

    const where: any = { userId: session.user.id }
    if (techniqueId) where.techniqueId = techniqueId

    // Si on demande la progression par ceinture
    if (beltId) {
      const progress = await prisma.userTechniqueProgress.findMany({
        where: {
          userId: session.user.id,
          technique: {
            module: {
              beltId: beltId,
            },
          },
        },
        include: {
          technique: {
            select: { id: true, name: true, category: true, moduleId: true },
          },
        },
      })

      // Calculer les statistiques
      const stats = {
        total: progress.length,
        nonAcquis: progress.filter((p) => p.level === 'NON_ACQUIS').length,
        enCours: progress.filter((p) => p.level === 'EN_COURS_DAPPRENTISSAGE').length,
        acquis: progress.filter((p) => p.level === 'ACQUIS').length,
        maitrise: progress.filter((p) => p.level === 'MAITRISE').length,
      }

      return NextResponse.json({ progress, stats })
    }

    const progress = await prisma.userTechniqueProgress.findMany({
      where,
      include: {
        technique: {
          select: { id: true, name: true, category: true },
        },
      },
    })

    return NextResponse.json(progress)
  } catch (error) {
    console.error('Erreur GET /api/progress:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la progression' },
      { status: 500 }
    )
  }
}

// POST /api/progress - Met à jour ou crée une progression
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = progressSchema.parse(body)

    const progress = await prisma.userTechniqueProgress.upsert({
      where: {
        userId_techniqueId: {
          userId: session.user.id,
          techniqueId: validatedData.techniqueId,
        },
      },
      update: {
        level: validatedData.level,
        notes: validatedData.notes,
      },
      create: {
        userId: session.user.id,
        techniqueId: validatedData.techniqueId,
        level: validatedData.level,
        notes: validatedData.notes,
      },
    })

    return NextResponse.json(progress)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erreur POST /api/progress:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la progression' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/users - Liste tous les utilisateurs
export async function GET(request: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        beltId: true,
        createdAt: true,
        belt: {
          select: { name: true, color: true },
        },
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Erreur GET /api/admin/users:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json(
      { error: 'Accès non autorisé' },
      { status: 403 }
    )
  }
  
  return null
}
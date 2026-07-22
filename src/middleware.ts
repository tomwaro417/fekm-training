import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware'

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    const token = await getToken({ req })
    const path = req.nextUrl.pathname

    const isAdmin = token?.role === 'ADMIN'
    // L'instructeur n'a accès qu'à la gestion des vidéos (pages + API)
    const isInstructorVideoPath =
      token?.role === 'INSTRUCTOR' &&
      (path.startsWith('/admin/videos') || path.startsWith('/api/admin/videos'))

    if (!isAdmin && !isInstructorVideoPath) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token }) {
        // Autoriser si l'utilisateur a un token (vérification du role faite dans le middleware)
        // Cela évite les problèmes d'hydratation côté client
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
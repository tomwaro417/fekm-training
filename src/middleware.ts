import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware'

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    const token = await getToken({ req })
    
    // Vérifier si l'utilisateur est admin
    if (token?.role !== 'ADMIN') {
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
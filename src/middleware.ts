export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/',
    '/ceintures/:path*',
    '/modules/:path*',
    '/techniques/:path*',
    '/recherche',
    '/profil',
    '/dashboard',
    '/api/belts/:path*',
    '/api/modules/:path*',
    '/api/techniques/:path*',
    '/api/progress/:path*',
    '/api/upload/:path*',
  ],
}

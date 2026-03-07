import { NextRequest, NextResponse } from 'next/server'

// Store simple en mémoire pour le rate limiting
// En production, utiliser Redis pour une solution distribuée

interface RateLimitEntry {
  count: number
  resetTime: number
}

const ipCache = new Map<string, RateLimitEntry>()

// Configuration des limites
const RATE_LIMITS = {
  GET: { max: 100, windowMs: 60 * 1000 }, // 100 requêtes/minute
  POST: { max: 20, windowMs: 60 * 1000 }, // 20 requêtes/minute
  PUT: { max: 20, windowMs: 60 * 1000 },
  PATCH: { max: 20, windowMs: 60 * 1000 },
  DELETE: { max: 10, windowMs: 60 * 1000 },
  default: { max: 100, windowMs: 60 * 1000 },
}

// Nettoyage périodique du cache (toutes les 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of ipCache.entries()) {
    if (now > entry.resetTime) {
      ipCache.delete(ip)
    }
  }
}, 5 * 60 * 1000)

/**
 * Récupère l'IP réelle du client
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  // Fallback sur l'IP de la socket (moins fiable derrière un proxy)
  return 'unknown'
}

/**
 * Vérifie si la requête dépasse la limite de rate
 * Retourne null si OK, sinon retourne une réponse d'erreur
 */
export function checkRateLimit(
  request: NextRequest,
  options?: {
    method?: keyof typeof RATE_LIMITS
    max?: number
    windowMs?: number
  }
): NextResponse | null {
  const method = (options?.method || request.method || 'GET') as keyof typeof RATE_LIMITS
  const limit = RATE_LIMITS[method] || RATE_LIMITS.default
  
  const max = options?.max || limit.max
  const windowMs = options?.windowMs || limit.windowMs
  
  const ip = getClientIP(request)
  const key = `${ip}:${method}`
  const now = Date.now()
  
  const entry = ipCache.get(key)
  
  if (!entry || now > entry.resetTime) {
    // Nouvelle fenêtre de temps
    ipCache.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return null
  }
  
  if (entry.count >= max) {
    // Limite dépassée
    return NextResponse.json(
      {
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
          'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
        },
      }
    )
  }
  
  // Incrémenter le compteur
  entry.count++
  return null
}

/**
 * Middleware de rate limiting pour les routes API
 * Usage: export const GET = withRateLimit(handler)
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options?: {
    method?: keyof typeof RATE_LIMITS
    max?: number
    windowMs?: number
  }
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const rateLimitResponse = checkRateLimit(request, options)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    return handler(request, ...args)
  }
}

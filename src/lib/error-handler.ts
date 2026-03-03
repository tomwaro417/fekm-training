import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Codes d'erreur sécurisés pour l'API
 * Ne jamais exposer de détails internes en production
 */
export const ErrorCodes = {
  // Erreurs client (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Erreurs serveur (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const

export type ErrorCode = keyof typeof ErrorCodes

/**
 * Messages d'erreur génériques pour la production
 * Les messages détaillés sont logués côté serveur uniquement
 */
const ERROR_MESSAGES: Record<string, string> = {
  [ErrorCodes.BAD_REQUEST]: 'Requête invalide',
  [ErrorCodes.UNAUTHORIZED]: 'Authentification requise',
  [ErrorCodes.FORBIDDEN]: 'Accès non autorisé',
  [ErrorCodes.NOT_FOUND]: 'Ressource non trouvée',
  [ErrorCodes.METHOD_NOT_ALLOWED]: 'Méthode non autorisée',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Trop de requêtes. Veuillez réessayer plus tard.',
  [ErrorCodes.VALIDATION_ERROR]: 'Données invalides',
  [ErrorCodes.INTERNAL_ERROR]: 'Une erreur est survenue',
  [ErrorCodes.DATABASE_ERROR]: 'Une erreur est survenue',
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'Une erreur est survenue',
}

/**
 * Détermine si on est en environnement de développement
 */
const isDev = process.env.NODE_ENV === 'development'

/**
 * Crée une réponse d'erreur sécurisée
 * 
 * En production: ne retourne que des messages génériques
 * En développement: peut inclure plus de détails
 */
export function createErrorResponse(
  code: keyof typeof ErrorCodes,
  statusCode: number,
  details?: unknown,
  internalError?: Error
): NextResponse {
  // Logger l'erreur complète côté serveur
  if (internalError) {
    console.error(`[API ERROR] ${code}:`, {
      message: internalError.message,
      stack: internalError.stack,
      details,
    })
  } else if (details) {
    console.error(`[API ERROR] ${code}:`, details)
  }
  
  const response: {
    error: string
    code: string
    details?: unknown
    stack?: string
  } = {
    error: ERROR_MESSAGES[code] || 'Une erreur est survenue',
    code,
  }
  
  // En développement uniquement, on peut inclure plus de détails
  if (isDev) {
    if (details) {
      response.details = details
    }
    if (internalError?.stack) {
      response.stack = internalError.stack
    }
  }
  
  return NextResponse.json(response, { status: statusCode })
}

/**
 * Gère les erreurs Zod de validation
 */
export function handleZodError(error: ZodError): NextResponse {
  const formattedErrors = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
  
  console.error('[VALIDATION ERROR]', formattedErrors)
  
  return createErrorResponse(
    'VALIDATION_ERROR',
    400,
    isDev ? formattedErrors : undefined
  )
}

/**
 * Wrapper sécurisé pour les handlers API
 * Gère automatiquement les erreurs et évite les fuites d'informations
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  errorCode: keyof typeof ErrorCodes = 'INTERNAL_ERROR',
  statusCode: number = 500
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error)
      }
      
      const err = error instanceof Error ? error : new Error(String(error))
      return createErrorResponse(errorCode, statusCode, undefined, err)
    }
  }) as T
}

/**
 * Log d'erreur sécurisé (côté serveur uniquement)
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error))
  
  console.error(`[${context}]`, {
    message: errorObj.message,
    stack: errorObj.stack,
    ...additionalInfo,
  })
}

/**
 * Log d'avertissement
 */
export function logWarning(
  context: string,
  message: string,
  additionalInfo?: Record<string, unknown>
): void {
  console.warn(`[${context}] ${message}`, additionalInfo)
}

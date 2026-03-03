import { z } from 'zod'

// ============================================================================
// Schémas de validation pour les paramètres de requête
// ============================================================================

/**
 * Schéma pour les IDs (UUID ou chaîne alphanumérique)
 */
export const idSchema = z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, {
  message: "L'ID doit être alphanumérique",
})

/**
 * Schéma pour la pagination
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

/**
 * Schéma pour les paramètres de requête des ceintures
 */
export const beltsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  includeModules: z.coerce.boolean().optional(),
})

// ============================================================================
// Schémas de validation pour les données de progression
// ============================================================================

/**
 * Niveaux de progression valides
 */
export const ProgressLevel = z.enum([
  'NON_ACQUIS',
  'EN_COURS_DAPPRENTISSAGE',
  'ACQUIS',
  'MAITRISE',
])

/**
 * Schéma pour la création/mise à jour d'une progression
 */
export const progressCreateSchema = z.object({
  techniqueId: idSchema,
  level: ProgressLevel,
  notes: z.string().max(1000).optional(),
})

/**
 * Schéma pour la mise à jour d'une progression (PATCH partiel)
 */
export const progressUpdateSchema = z.object({
  level: ProgressLevel.optional(),
  notes: z.string().max(1000).optional(),
})

/**
 * Schéma pour les paramètres de requête de progression
 */
export const progressQuerySchema = z.object({
  techniqueId: idSchema.optional(),
  beltId: idSchema.optional(),
})

// ============================================================================
// Schémas de validation pour l'authentification
// ============================================================================

/**
 * Schéma pour les credentials de connexion
 */
export const credentialsSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères'),
})

/**
 * Schéma pour l'inscription
 */
export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères'),
  name: z.string().min(2).max(100).optional(),
})

// ============================================================================
// Schémas de validation pour les modules et techniques
// ============================================================================

/**
 * Schéma pour les paramètres de requête des modules
 */
export const moduleQuerySchema = z.object({
  beltId: idSchema.optional(),
  includeTechniques: z.coerce.boolean().optional(),
})

/**
 * Schéma pour les paramètres de requête des techniques
 */
export const techniqueQuerySchema = z.object({
  moduleId: idSchema.optional(),
  category: z.string().optional(),
  includeVideos: z.coerce.boolean().optional(),
})

// ============================================================================
// Types exportés
// ============================================================================

export type PaginationParams = z.infer<typeof paginationSchema>
export type BeltsQueryParams = z.infer<typeof beltsQuerySchema>
export type ProgressCreateInput = z.infer<typeof progressCreateSchema>
export type ProgressUpdateInput = z.infer<typeof progressUpdateSchema>
export type ProgressQueryParams = z.infer<typeof progressQuerySchema>
export type CredentialsInput = z.infer<typeof credentialsSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ModuleQueryParams = z.infer<typeof moduleQuerySchema>
export type TechniqueQueryParams = z.infer<typeof techniqueQuerySchema>

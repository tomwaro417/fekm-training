import { z } from 'zod';

// ============================================
// Schémas de Validation Communs
// ============================================

// Ceintures
export const BeltLevel = z.enum([
  'WHITE',
  'YELLOW',
  'ORANGE',
  'GREEN',
  'BLUE',
  'BROWN',
  'BLACK',
]);

export type BeltLevelType = z.infer<typeof BeltLevel>;

// Catégories de vidéos
export const VideoCategory = z.enum([
  'TECHNIQUE',
  'KATA',
  'KUMITE',
  'PHYSICAL',
  'THEORY',
]);

export type VideoCategoryType = z.infer<typeof VideoCategory>;

// Rôles utilisateur
export const UserRole = z.enum([
  'STUDENT',
  'INSTRUCTOR',
  'ADMIN',
]);

export type UserRoleType = z.infer<typeof UserRole>;

// Statuts de vidéo
export const VideoStatus = z.enum([
  'PROCESSING',
  'READY',
  'ERROR',
]);

export type VideoStatusType = z.infer<typeof VideoStatus>;

// ============================================
// Schémas pour les Vidéos
// ============================================

export const videoMetadataSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200, 'Titre trop long'),
  description: z.string().max(2000, 'Description trop longue').optional(),
  beltLevel: BeltLevel,
  category: VideoCategory,
  tags: z.string().optional(), // JSON stringifié
  isPublic: z.string().transform((val) => val === 'true'),
});

export type VideoMetadataInput = z.infer<typeof videoMetadataSchema>;

// ============================================
// Schémas pour les Ceintures
// ============================================

export const beltAssignmentSchema = z.object({
  beltLevel: BeltLevel,
  promotionDate: z.string().datetime().optional(),
  promotedBy: z.string().uuid().optional(),
  notes: z.string().max(1000, 'Notes trop longues').optional(),
});

export type BeltAssignmentInput = z.infer<typeof beltAssignmentSchema>;

// ============================================
// Schémas pour la Progression
// ============================================

export const progressItemSchema = z.object({
  videoId: z.string().uuid('ID vidéo invalide'),
  progress: z.number().min(0).max(100, 'Le progrès doit être entre 0 et 100'),
  completed: z.boolean(),
  watchedDuration: z.number().min(0).optional(),
  totalDuration: z.number().min(0).optional(),
  lastPosition: z.number().min(0).optional(),
});

export type ProgressItemInput = z.infer<typeof progressItemSchema>;

export const batchProgressSchema = z.object({
  items: z.array(progressItemSchema).min(1, 'Au moins un élément requis').max(100, 'Maximum 100 éléments'),
  syncTimestamp: z.string().datetime().optional(),
});

export type BatchProgressInput = z.infer<typeof batchProgressSchema>;

// ============================================
// Schémas pour les Requêtes de Liste
// ============================================

export const paginationQuerySchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(20),
});

export const studentsQuerySchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(20),
  search: z.string().optional(),
  beltLevel: BeltLevel.optional(),
  sortBy: z.enum(['name', 'beltLevel', 'progress', 'lastActive']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type StudentsQueryInput = z.infer<typeof studentsQuerySchema>;

// ============================================
// Helpers de Validation
// ============================================

export function validateUUID(id: unknown): string | null {
  const result = z.string().uuid().safeParse(id);
  return result.success ? result.data : null;
}

export function validateBeltProgression(
  currentBelt: string,
  newBelt: string
): { valid: boolean; message?: string } {
  const beltLevels = ['WHITE', 'YELLOW', 'ORANGE', 'GREEN', 'BLUE', 'BROWN', 'BLACK'];
  const currentIndex = beltLevels.indexOf(currentBelt);
  const newIndex = beltLevels.indexOf(newBelt);

  if (currentIndex === -1 || newIndex === -1) {
    return { valid: false, message: 'Niveau de ceinture invalide' };
  }

  if (newIndex < currentIndex) {
    return { valid: false, message: 'Impossible de rétrograder la ceinture' };
  }

  if (newIndex - currentIndex > 1) {
    return { valid: false, message: 'Progression trop rapide (max 1 niveau)' };
  }

  return { valid: true };
}

// ============================================
// Types de Réponse API
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: z.ZodIssue[] | unknown;
  code?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Pagination
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

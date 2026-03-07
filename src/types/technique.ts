/**
 * Types pour les techniques de Krav Maga
 * FEKM Training App
 */

// ============================================
// ENUMS
// ============================================

export type TechniqueCategory = 
  | 'FRAPPE'
  | 'PIED'
  | 'DEFENSE_FRAPPE'
  | 'DEFENSE_COUTEAU'
  | 'DEFENSE_BATON'
  | 'DEFENSE_PISTOLET'
  | 'DEFENSE_ETRANGLEMENT'
  | 'DEFENSE_CLE'
  | 'DEFENSE_POUSSEE'
  | 'DEFENSE_SAISIE'
  | 'SOL'
  | 'AUTRE';

export type VideoType = 'COACH' | 'DEMONSTRATION';

export type PersonalVideoType = 'DEBUTANT' | 'PROGRESSION';

export type ProgressLevel = 'NON_ACQUIS' | 'EN_COURS_DAPPRENTISSAGE' | 'ACQUIS' | 'MAITRISE';

// ============================================
// INTERFACES
// ============================================

export interface VideoAsset {
  id: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  title?: string;
  description?: string;
  createdAt?: string;
  filename?: string;
  originalName?: string;
}

export interface TechniqueVideo {
  video: VideoAsset;
  type: VideoType;
}

export interface UserTechniqueVideo {
  id: string;
  video: VideoAsset;
  type: PersonalVideoType;
  slot: PersonalVideoType;  // Champ de la base de données
  createdAt: string;
  updatedAt?: string;
}

export interface UserTechniqueProgress {
  id: string;
  level: ProgressLevel;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Belt {
  id: string;
  name: string;
  color: string;
  order?: number;
  description?: string | null;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  order?: number;
  belt: Belt;
}

export interface Technique {
  id: string;
  name: string;
  category: TechniqueCategory;
  subCategory: string;
  description: string;
  instructions: string;
  keyPoints: string[];
  order: number;
  module: Module;
  videos: TechniqueVideo[];
  userVideos: UserTechniqueVideo[];
  progress?: UserTechniqueProgress;
}

// ============================================
// DTOs API
// ============================================

export interface CreateProgressDTO {
  techniqueId: string;
  level: ProgressLevel;
  notes?: string;
}

export interface UpdateProgressDTO {
  level?: ProgressLevel;
  notes?: string;
}

export interface ProgressFormData {
  level: ProgressLevel;
  notes: string;
}

// ============================================
// CONSTANTES
// ============================================

export const PROGRESS_LEVELS: { 
  value: ProgressLevel; 
  label: string; 
  color: string; 
  bgColor: string;
  icon?: string;
}[] = [
  { 
    value: 'NON_ACQUIS', 
    label: 'Non acquis', 
    color: 'text-red-600', 
    bgColor: 'bg-red-50 border-red-200' 
  },
  { 
    value: 'EN_COURS_DAPPRENTISSAGE', 
    label: 'En cours d\'apprentissage', 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50 border-amber-200' 
  },
  { 
    value: 'ACQUIS', 
    label: 'Acquis', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50 border-blue-200' 
  },
  { 
    value: 'MAITRISE', 
    label: 'Maîtrisé', 
    color: 'text-green-600', 
    bgColor: 'bg-green-50 border-green-200' 
  },
];

export const CATEGORY_LABELS: Record<TechniqueCategory, string> = {
  FRAPPE: 'Frappes',
  PIED: 'Coups de pied',
  DEFENSE_FRAPPE: 'Défenses contre frappes',
  DEFENSE_COUTEAU: 'Défenses contre couteau',
  DEFENSE_BATON: 'Défenses contre bâton',
  DEFENSE_PISTOLET: 'Défenses contre pistolet',
  DEFENSE_ETRANGLEMENT: 'Défenses contre étranglement',
  DEFENSE_CLE: 'Défenses contre clés',
  DEFENSE_POUSSEE: 'Défenses contre poussées',
  DEFENSE_SAISIE: 'Défenses contre saisies',
  SOL: 'Techniques au sol',
  AUTRE: 'Autres techniques',
};

export const VIDEO_TYPE_LABELS: Record<VideoType | PersonalVideoType, string> = {
  COACH: 'Démonstration Coach',
  DEMONSTRATION: 'Démonstration',
  DEBUTANT: 'Ma vidéo - Débutant',
  PROGRESSION: 'Ma vidéo - Progression',
};

// ============================================
// HELPERS
// ============================================

/**
 * Formate une durée en secondes en format MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Retourne la configuration d'un niveau de progression
 */
export function getProgressLevelConfig(level: ProgressLevel) {
  return PROGRESS_LEVELS.find(l => l.value === level) || PROGRESS_LEVELS[0];
}

/**
 * Retourne le label d'une catégorie
 */
export function getCategoryLabel(category: TechniqueCategory): string {
  return CATEGORY_LABELS[category] || category;
}

/**
 * Vérifie si une technique est maîtrisée
 */
export function isMastered(progress?: UserTechniqueProgress): boolean {
  return progress?.level === 'MAITRISE';
}

/**
 * Vérifie si une technique est acquise ou maîtrisée
 */
export function isAcquired(progress?: UserTechniqueProgress): boolean {
  return progress?.level === 'ACQUIS' || progress?.level === 'MAITRISE';
}

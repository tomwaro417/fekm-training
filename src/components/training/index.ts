/**
 * Composants Training pour FEKM Training
 * 
 * Ce module contient tous les composants React pour les fonctionnalités
 * de formation et d'apprentissage du Krav Maga.
 */

// VideoUploader - Upload de vidéos avec drag & drop et caméra
export { VideoUploader } from './VideoUploader'
export type { VideoUploaderProps, UploadedVideo } from './VideoUploader'

// VideoPlayer - Lecteur vidéo optimisé mobile
export { VideoPlayer } from './VideoPlayer'
export type { VideoPlayerProps, VideoSource } from './VideoPlayer'

// BeltAssignment - Interface de gestion des ceintures
export { BeltAssignment } from './BeltAssignment'
export type { BeltAssignmentProps, Belt, Student } from './BeltAssignment'

// ProgressDashboard - Dashboard de progression instructeur
export { ProgressDashboard } from './ProgressDashboard'
export type { 
  ProgressDashboardProps, 
  StudentProgress, 
  ModuleStats 
} from './ProgressDashboard'

// OfflineIndicator - Indicateur de statut réseau
export { OfflineIndicator, useOnlineStatus } from './OfflineIndicator'
export type { OfflineIndicatorProps } from './OfflineIndicator'

// VideoDownloadButton - Bouton de téléchargement avec progression
export { VideoDownloadButton } from './VideoDownloadButton'
export type { VideoDownloadButtonProps } from './VideoDownloadButton'

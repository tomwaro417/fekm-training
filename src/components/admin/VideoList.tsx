'use client'

import { useState } from 'react'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Download,
  Trash2,
  Edit,
  Eye,
  Clock,
  Calendar,
  User,
  Film,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from './Modal'

interface Video {
  id: string
  filename: string
  title?: string
  description?: string
  duration?: number
  size: number
  createdAt: string
  type?: string // Supprimé - toutes les vidéos sont des démonstrations
  status: 'PROCESSING' | 'READY' | 'ERROR'
  thumbnailUrl?: string
  technique?: {
    id: string
    name: string
    module: {
      code: string
      belt: {
        name: string
        color: string
      }
    }
  }
  uploadedBy: {
    name: string
  }
  viewCount?: number
  tags: string[]
}

interface VideoListProps {
  videos: Video[]
  onDelete?: (videoId: string) => Promise<void>
  onEdit?: (video: Video) => void
  onPreview?: (video: Video) => void
  loading?: boolean
  className?: string
}

export function VideoList({ 
  videos, 
  onDelete, 
  onEdit, 
  onPreview,
  loading,
  className 
}: VideoListProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleDelete = async (videoId: string) => {
    if (!onDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(videoId)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setDeleteError('La suppression a échoué. Veuillez réessayer.')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: Video['status']) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3 mr-1" />
            Prête
          </span>
        )
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-1" />
            Traitement...
          </span>
        )
      case 'ERROR':
        return (
          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erreur
          </span>
        )
    }
  }

  // getTypeBadge supprimé - plus de distinction Coach/Démo

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-32 h-20 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className={cn('text-center py-12 bg-gray-50 rounded-xl', className)}>
        <Film className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucune vidéo uploadée</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Thumbnail */}
            <div 
              className="relative w-full sm:w-48 h-28 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group"
              onClick={() => onPreview?.(video)}
            >
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title || video.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Film className="w-8 h-8 text-gray-600" />
                </div>
              )}
              
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-10 h-10 text-white" />
              </div>

              {/* Duration Badge */}
              {video.duration && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                  {formatDuration(video.duration)}
                </div>
              )}

              {/* Status Overlay */}
              {video.status !== 'READY' && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  {video.status === 'PROCESSING' ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                      <span className="text-white text-xs">Traitement...</span>
                    </div>
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {video.title || video.filename}
                  </h3>
                  {video.technique && (
                    <p className="text-sm text-gray-500 mt-1">
                      {video.technique.module.belt.name} • {video.technique.module.code} • {video.technique.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(video.status)}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(video.createdAt)}
                </span>
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {video.uploadedBy.name}
                </span>
                <span>{formatFileSize(video.size)}</span>
                {video.viewCount !== undefined && (
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {video.viewCount} vues
                  </span>
                )}
              </div>

              {video.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {video.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreview?.(video)}
                disabled={video.status !== 'READY'}
              >
                <Play className="w-4 h-4" />
              </Button>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(video)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setDeleteConfirm(video.id)
                    setDeleteError(null)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="text-center py-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">
            Êtes-vous sûr de vouloir supprimer cette vidéo ?
            <br />
            Cette action est irréversible.
          </p>
          {deleteError && (
            <p className="text-red-600 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">
              {deleteError}
            </p>
          )}
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              loading={deleting}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Export pour utilisation dans d'autres composants
export type { Video }

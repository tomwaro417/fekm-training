'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter,
  Trash2,
  Edit,
  Eye,
  Link as LinkIcon,
  Film,
  RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { VideoList, Video } from './VideoList'
import { VideoMetadataEditor } from './VideoMetadataEditor'
import { VideoPreview } from './VideoPreview'
import { VideoLinkManager } from './VideoLinkManager'
import { Button } from '@/components/ui/Button'
import { showToast } from './Toast'

type FilterType = 'ALL' | 'COACH' | 'DEMONSTRATION' | 'UNLINKED'
type StatusFilter = 'ALL' | 'READY' | 'PROCESSING' | 'ERROR'

export function VideoManager() {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<FilterType>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  
  // Modal states
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null)
  const [editVideo, setEditVideo] = useState<Video | null>(null)
  const [linkVideo, setLinkVideo] = useState<Video | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/videos')
      if (!response.ok) throw new Error('Erreur lors de la récupération')
      const data = await response.json()
      setVideos(data.videos || [])
    } catch (error) {
      showToast('Erreur lors de la récupération des vidéos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (videoId: string) => {
    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Erreur lors de la suppression')
      
      setVideos(videos.filter(v => v.id !== videoId))
      showToast('Vidéo supprimée avec succès', 'success')
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error')
      throw error
    }
  }

  const handleEdit = async (videoId: string, metadata: {
    title: string
    description: string
    tags: string[]
  }) => {
    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata)
      })
      if (!response.ok) throw new Error('Erreur lors de la modification')
      
      setVideos(videos.map(v => 
        v.id === videoId 
          ? { ...v, ...metadata }
          : v
      ))
      showToast('Vidéo modifiée avec succès', 'success')
    } catch (error) {
      showToast('Erreur lors de la modification', 'error')
      throw error
    }
  }

  const handleLink = async (videoId: string, techniqueId: string) => {
    try {
      const response = await fetch(`/api/admin/videos/${videoId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ techniqueId })
      })
      if (!response.ok) throw new Error('Erreur lors du lien')
      
      await fetchVideos()
      showToast('Vidéo liée avec succès', 'success')
    } catch (error) {
      showToast('Erreur lors du lien', 'error')
      throw error
    }
  }

  const handleUnlink = async (videoId: string) => {
    try {
      const response = await fetch(`/api/admin/videos/${videoId}/link`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Erreur lors du déliage')
      
      await fetchVideos()
      showToast('Vidéo déliée avec succès', 'success')
    } catch (error) {
      showToast('Erreur lors du déliage', 'error')
      throw error
    }
  }

  // Filter videos
  const filteredVideos = videos.filter(video => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        (video.title || video.filename).toLowerCase().includes(query) ||
        video.technique?.name.toLowerCase().includes(query) ||
        video.technique?.module.belt.name.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'UNLINKED') {
        if (video.technique) return false
      } else if (video.type !== typeFilter) {
        return false
      }
    }

    // Status filter
    if (statusFilter !== 'ALL' && video.status !== statusFilter) {
      return false
    }

    return true
  })

  const stats = {
    total: videos.length,
    coach: videos.filter(v => v.type === 'COACH').length,
    demo: videos.filter(v => v.type === 'DEMONSTRATION').length,
    unlinked: videos.filter(v => !v.technique).length,
    processing: videos.filter(v => v.status === 'PROCESSING').length,
    errors: videos.filter(v => v.status === 'ERROR').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des vidéos</h1>
          <p className="text-gray-600 mt-1">
            {stats.total} vidéo(s) • {stats.coach} coach • {stats.demo} démos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchVideos}
            loading={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => router.push('/admin/videos/upload')}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle vidéo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-yellow-600 font-medium">Vidéos Coach</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.coach}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Démonstrations</p>
          <p className="text-2xl font-bold text-blue-700">{stats.demo}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium">Non liées</p>
          <p className="text-2xl font-bold text-orange-700">{stats.unlinked}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">En erreur</p>
          <p className="text-2xl font-bold text-red-700">{stats.errors}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Search */}
          <div className="sm:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une vidéo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FilterType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tous les types</option>
              <option value="COACH">Coach</option>
              <option value="DEMONSTRATION">Démonstration</option>
              <option value="UNLINKED">Non liées</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="READY">Prêtes</option>
              <option value="PROCESSING">En traitement</option>
              <option value="ERROR">En erreur</option>
            </select>
          </div>
        </div>
      </div>

      {/* Video List */}
      <VideoList
        videos={filteredVideos}
        onDelete={handleDelete}
        onEdit={setEditVideo}
        onPreview={setPreviewVideo}
        loading={loading}
      />

      {/* Empty State */}
      {!loading && filteredVideos.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune vidéo trouvée
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Essayez de modifier vos filtres'
              : 'Commencez par uploader une nouvelle vidéo'}
          </p>
          {!searchQuery && typeFilter === 'ALL' && statusFilter === 'ALL' && (
            <Button onClick={() => router.push('/admin/videos/upload')}>
              <Plus className="w-4 h-4 mr-2" />
              Uploader une vidéo
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      <VideoPreview
        video={previewVideo}
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
      />

      <VideoMetadataEditor
        video={editVideo}
        isOpen={!!editVideo}
        onClose={() => setEditVideo(null)}
        onSave={handleEdit}
      />

      <VideoLinkManager
        video={linkVideo}
        isOpen={!!linkVideo}
        onClose={() => setLinkVideo(null)}
        onLink={handleLink}
        onUnlink={handleUnlink}
      />
    </div>
  )
}

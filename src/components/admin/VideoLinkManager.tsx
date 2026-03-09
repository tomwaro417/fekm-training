'use client'

import { useState, useEffect } from 'react'
import { Link, Unlink, Search, Check, X, Film } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from '@/components/ui/Button'
import { Video } from './VideoList'

interface Technique {
  id: string
  name: string
  category: string
  order: number
  module: {
    id: string
    code: string
    name: string
    belt: {
      id: string
      name: string
      color: string
    }
  }
}

interface VideoLinkManagerProps {
  video: Video | null
  isOpen: boolean
  onClose: () => void
  onLink: (videoId: string, techniqueId: string) => Promise<void>
  onUnlink: (videoId: string) => Promise<void>
}

export function VideoLinkManager({
  video,
  isOpen,
  onClose,
  onLink,
  onUnlink
}: VideoLinkManagerProps) {
  const [techniques, setTechniques] = useState<Technique[]>([])
  const [filteredTechniques, setFilteredTechniques] = useState<Technique[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBelt, setSelectedBelt] = useState<string>('')
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [belts, setBelts] = useState<{id: string, name: string, color: string}[]>([])
  const [modules, setModules] = useState<{id: string, code: string, name: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [linking, setLinking] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchBelts()
      fetchTechniques()
    }
  }, [isOpen])

  useEffect(() => {
    filterTechniques()
  }, [searchQuery, selectedBelt, selectedModule, techniques])

  const fetchBelts = async () => {
    try {
      const response = await fetch('/api/belts')
      if (response.ok) {
        const data = await response.json()
        setBelts(data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des ceintures:', error)
    }
  }

  const fetchTechniques = async () => {
    setLoading(true)
    try {
      // Récupérer toutes les techniques de tous les modules
      const response = await fetch('/api/admin/techniques')
      if (response.ok) {
        const data = await response.json()
        setTechniques(data)
        setFilteredTechniques(data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des techniques:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTechniques = () => {
    let filtered = techniques

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedBelt) {
      filtered = filtered.filter(t => t.module.belt.id === selectedBelt)
    }

    if (selectedModule) {
      filtered = filtered.filter(t => t.module.id === selectedModule)
    }

    setFilteredTechniques(filtered)
  }

  const handleLink = async (techniqueId: string) => {
    if (!video) return
    setLinking(true)
    try {
      await onLink(video.id, techniqueId)
      onClose()
    } catch (error) {
      console.error('Erreur lors du lien:', error)
    } finally {
      setLinking(false)
    }
  }

  const handleUnlink = async () => {
    if (!video) return
    setLinking(true)
    try {
      await onUnlink(video.id)
      onClose()
    } catch (error) {
      console.error('Erreur lors du déliage:', error)
    } finally {
      setLinking(false)
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'FRAPPE_DE_FACE': 'Frappe de face',
      'FRAPPE_DE_COTE': 'Frappe de côté',
      'SAISISSEMENTS': 'Saisissements',
      'DEFENSES_SUR_ATTAQUES_PONCTUELLES': 'Défenses sur attaques ponctuelles',
      'STRANGULATIONS': 'Strangulations',
      'DEFENSES_SUR_ATTAQUES_CIRCULAIRES': 'Défenses sur attaques circulaires',
      'ATTAQUES_AU_SOL': 'Attaques au sol',
      'ATTAQUES_AVEC_ARMES_BLANCHES': 'Attaques avec armes blanches',
      'ATTAQUES_AVEC_BATON': 'Attaques avec bâton',
      'ATTAQUES_AVEC_ARMES_A_FEU': 'Attaques avec armes à feu',
      'AUTRES': 'Autres',
    }
    return labels[category] || category
  }

  const getBeltName = (name: string) => {
    const names: Record<string, string> = {
      'JAUNE': 'Jaune',
      'ORANGE': 'Orange',
      'VERTE': 'Verte',
      'BLEUE': 'Bleue',
      'MARRON': 'Marron',
      'NOIRE_1': 'Noire 1er Darga',
      'NOIRE_2': 'Noire 2e Darga',
      'NOIRE_3': 'Noire 3e Darga',
    }
    return names[name] || name
  }

  if (!video) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lier la vidéo à une technique"
      size="xl"
    >
      <div className="space-y-6">
        {/* Current Link Info */}
        {video.technique && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Vidéo actuellement liée à :
                </p>
                <p className="text-gray-900 font-medium mt-1">
                  {video.technique.name}
                </p>
                <p className="text-sm text-gray-500">
                  {video.technique.module.belt.name} • {video.technique.module.code}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlink}
                loading={linking}
                className="text-red-600 hover:bg-red-50"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Délier
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ceinture
            </label>
            <select
              value={selectedBelt}
              onChange={(e) => {
                setSelectedBelt(e.target.value)
                setSelectedModule('')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les ceintures</option>
              {belts.map((belt) => (
                <option key={belt.id} value={belt.id}>
                  {getBeltName(belt.name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Nom de la technique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-end">
            <p className="text-sm text-gray-500">
              {filteredTechniques.length} technique(s) trouvée(s)
            </p>
          </div>
        </div>

        {/* Techniques List */}
        <div className="border rounded-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredTechniques.length === 0 ? (
            <div className="text-center py-8">
              <Film className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune technique trouvée</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTechniques.map((technique) => (
                <div
                  key={technique.id}
                  className="p-4 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">
                        {technique.name}
                      </h4>
                      <span 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: technique.module.belt.color }}
                        title={technique.module.belt.name}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <span>{technique.module.code}</span>
                      <span>•</span>
                      <span>{getCategoryLabel(technique.category)}</span>
                    </div>
                  </div>

                  {video.technique?.id === technique.id ? (
                    <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      <Check className="w-4 h-4 mr-1" />
                      Liée
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLink(technique.id)}
                      loading={linking}
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Lier
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  )
}

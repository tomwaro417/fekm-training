'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Video, 
  Upload, 
  Search,
  ChevronRight,
  ChevronLeft,
  User,
  Film,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { ToastContainer, showToast } from '@/components/admin/Toast'

interface Belt {
  id: string
  name: string
  color: string
}

interface Module {
  id: string
  code: string
  name: string
  belt: Belt
}

interface Technique {
  id: string
  name: string
  category: string
  order: number
  module: Module
  videos: {
    id: string
    type: 'COACH' | 'DEMONSTRATION'
    video: {
      id: string
      filename: string
      duration?: number
    }
  }[]
}

export default function VideoManagementPage() {
  const { data: session } = useSession()
  const [belts, setBelts] = useState<Belt[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [techniques, setTechniques] = useState<Technique[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtres
  const [selectedBelt, setSelectedBelt] = useState<string>('')
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [search, setSearch] = useState('')
  
  // Upload
  const [uploadingTechnique, setUploadingTechnique] = useState<Technique | null>(null)
  const [uploadType, setUploadType] = useState<'COACH' | 'DEMONSTRATION'>('COACH')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchBelts()
  }, [])

  useEffect(() => {
    if (selectedBelt) {
      fetchModules(selectedBelt)
    } else {
      setModules([])
      setSelectedModule('')
    }
  }, [selectedBelt])

  useEffect(() => {
    if (selectedModule) {
      fetchTechniques(selectedModule)
    } else {
      setTechniques([])
    }
  }, [selectedModule, search])

  async function fetchBelts() {
    try {
      const response = await fetch('/api/belts')
      if (!response.ok) throw new Error('Erreur')
      const data = await response.json()
      setBelts(data)
    } catch (error) {
      showToast('Erreur lors de la récupération des ceintures', 'error')
    }
  }

  async function fetchModules(beltId: string) {
    try {
      const response = await fetch(`/api/belts/${beltId}`)
      if (!response.ok) throw new Error('Erreur')
      const data = await response.json()
      setModules(data.modules || [])
    } catch (error) {
      showToast('Erreur lors de la récupération des modules', 'error')
    }
  }

  async function fetchTechniques(moduleId: string) {
    setLoading(true)
    try {
      const response = await fetch(`/api/modules/${moduleId}`)
      if (!response.ok) throw new Error('Erreur')
      const data = await response.json()
      
      let techniques = data.techniques || []
      
      // Filtrer par recherche
      if (search) {
        techniques = techniques.filter((t: Technique) =>
          t.name.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      setTechniques(techniques)
    } catch (error) {
      showToast('Erreur lors de la récupération des techniques', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (!selectedFile || !uploadingTechnique) return

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('techniqueId', uploadingTechnique.id)
      formData.append('type', uploadType)

      const response = await fetch('/api/admin/videos/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'upload')
      }

      showToast('Vidéo uploadée avec succès', 'success')
      
      // Rafraîchir la liste
      if (selectedModule) {
        fetchTechniques(selectedModule)
      }
      
      // Fermer le modal
      setUploadingTechnique(null)
      setSelectedFile(null)
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de l\'upload', 'error')
    } finally {
      setUploading(false)
    }
  }

  const getBeltName = (name: string) => {
    const names: Record<string, string> = {
      'JAUNE': 'Jaune',
      'ORANGE': 'Orange',
      'VERTE': 'Verte',
      'BLEUE': 'Bleue',
      'MARRON': 'Marron',
      'NOIRE_1': 'Noire 1er Darga',
    }
    return names[name] || name
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

  return (
    <div>
      <ToastContainer />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des vidéos</h1>
        <p className="text-gray-600 mt-2">Uploadez les vidéos du coach et des démonstrations</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ceinture
            </label>
            <select
              value={selectedBelt}
              onChange={(e) => setSelectedBelt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner une ceinture</option>
              {belts.map((belt) => (
                <option key={belt.id} value={belt.id}>
                  {getBeltName(belt.name)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module
            </label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              disabled={!selectedBelt}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Sélectionner un module</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.code} - {module.name}
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!selectedModule}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des techniques */}
      {selectedModule && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {techniques.map((technique) => {
                const coachVideos = technique.videos.filter(v => v.type === 'COACH')
                const demoVideos = technique.videos.filter(v => v.type === 'DEMONSTRATION')
                
                return (
                  <div key={technique.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {technique.name}
                          </h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {getCategoryLabel(technique.category)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                          {technique.module.code} - {technique.module.belt.name}
                        </p>
                        
                        {/* Vidéos existantes */}
                        <div className="flex flex-wrap gap-4">
                          {coachVideos.length > 0 && (
                            <div className="flex items-center text-sm text-green-600">
                              <User className="w-4 h-4 mr-1" />
                              <span>{coachVideos.length} vidéo(s) coach</span>
                            </div>
                          )}
                          {demoVideos.length > 0 && (
                            <div className="flex items-center text-sm text-blue-600">
                              <Film className="w-4 h-4 mr-1" />
                              <span>{demoVideos.length} démonstration(s)</span>
                            </div>
                          )}
                          {technique.videos.length === 0 && (
                            <div className="flex items-center text-sm text-gray-400">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              <span>Aucune vidéo</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setUploadingTechnique(technique)
                            setUploadType('COACH')
                          }}
                          className="inline-flex items-center px-4 py-2 bg-yellow-500 text-gray-900 font-medium rounded-lg hover:bg-yellow-400 transition-colors"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Ajouter vidéo coach
                        </button>
                        <button
                          onClick={() => {
                            setUploadingTechnique(technique)
                            setUploadType('DEMONSTRATION')
                          }}
                          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-400 transition-colors"
                        >
                          <Film className="w-4 h-4 mr-2" />
                          Ajouter démo
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {techniques.length === 0 && (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune technique trouvée</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal d'upload */}
      {uploadingTechnique && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {uploadType === 'COACH' ? 'Vidéo du Coach' : 'Vidéo de démonstration'}
              </h3>
              <button
                onClick={() => {
                  setUploadingTechnique(null)
                  setSelectedFile(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Technique</p>
              <p className="font-medium text-gray-900">{uploadingTechnique.name}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de vidéo
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setUploadType('COACH')}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-colors ${
                    uploadType === 'COACH'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="w-5 h-5 mr-2" />
                  Coach
                </button>
                <button
                  onClick={() => setUploadType('DEMONSTRATION')}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-colors ${
                    uploadType === 'DEMONSTRATION'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Film className="w-5 h-5 mr-2" />
                  Démo
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier vidéo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-gray-600 font-medium">
                    {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner une vidéo'}
                  </span>
                  <span className="text-sm text-gray-400 mt-1">
                    MP4, MOV, AVI (max 500MB)
                  </span>
                </label>
              </div>
              
              {/* Option caméra pour mobile */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou utiliser la caméra
                </label>
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="camera-upload"
                />
                <label
                  htmlFor="camera-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Filmer avec le smartphone
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setUploadingTechnique(null)
                  setSelectedFile(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Upload en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

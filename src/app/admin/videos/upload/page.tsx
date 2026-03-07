'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  Video, 
  ChevronRight,
  User,
  Film,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { ToastContainer, showToast } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import { ProgressBar, Card, Badge } from '@/components/admin/FormComponents'

interface Belt {
  id: string
  name: string
  color: string
  order: number
}

interface Module {
  id: string
  code: string
  name: string
  beltId: string
}

interface Technique {
  id: string
  name: string
  category: string
  order: number
  moduleId: string
  videos: {
    id: string
    type: 'COACH' | 'DEMONSTRATION'
  }[]
}

type UploadStep = 'select' | 'technique' | 'upload' | 'success'

export default function VideoUploadPage() {
  const router = useRouter()
  const [step, setStep] = useState<UploadStep>('select')
  
  // Data
  const [belts, setBelts] = useState<Belt[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [techniques, setTechniques] = useState<Technique[]>([])
  
  // Selection
  const [selectedBelt, setSelectedBelt] = useState<string>('')
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [selectedTechnique, setSelectedTechnique] = useState<Technique | null>(null)
  const [videoType, setVideoType] = useState<'COACH' | 'DEMONSTRATION'>('COACH')
  
  // Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    fetchBelts()
  }, [])

  useEffect(() => {
    if (selectedBelt) {
      fetchModules(selectedBelt)
      setSelectedModule('')
      setSelectedTechnique(null)
    }
  }, [selectedBelt])

  useEffect(() => {
    if (selectedModule) {
      fetchTechniques(selectedModule)
      setSelectedTechnique(null)
    }
  }, [selectedModule])

  async function fetchBelts() {
    try {
      const response = await fetch('/api/belts')
      if (!response.ok) throw new Error('Erreur')
      const data = await response.json()
      setBelts(data.sort((a: Belt, b: Belt) => a.order - b.order))
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
    try {
      const response = await fetch(`/api/modules/${moduleId}`)
      if (!response.ok) throw new Error('Erreur')
      const data = await response.json()
      setTechniques(data.techniques || [])
    } catch (error) {
      showToast('Erreur lors de la récupération des techniques', 'error')
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      if (file.size > 500 * 1024 * 1024) {
        showToast('Le fichier ne doit pas dépasser 500MB', 'error')
        return
      }
      setSelectedFile(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        showToast('Le fichier ne doit pas dépasser 500MB', 'error')
        return
      }
      setSelectedFile(file)
    }
  }

  async function handleUpload() {
    if (!selectedFile || !selectedTechnique) return

    setUploading(true)
    setUploadProgress(0)

    // Simuler la progression
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 800)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('techniqueId', selectedTechnique.id)
      formData.append('type', videoType)

      const response = await fetch('/api/admin/videos/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'upload')
      }

      clearInterval(progressInterval)
      setUploadProgress(100)
      setStep('success')
      showToast('Vidéo uploadée avec succès !', 'success')
    } catch (error: any) {
      clearInterval(progressInterval)
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
      'NOIRE_2': 'Noire 2e Darga',
      'NOIRE_3': 'Noire 3e Darga',
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const canProceedToTechnique = selectedBelt && selectedModule
  const canProceedToUpload = selectedTechnique

  return (
    <div className="max-w-4xl mx-auto">
      <ToastContainer />
      
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/videos')}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour à la gestion des vidéos
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Upload de vidéo</h1>
        <p className="text-gray-600 mt-2">
          Uploadez une nouvelle vidéo pour une technique
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { id: 'select', label: 'Sélection' },
            { id: 'technique', label: 'Technique' },
            { id: 'upload', label: 'Upload' },
            { id: 'success', label: 'Terminé' },
          ].map((s, index) => {
            const isActive = step === s.id
            const isCompleted = 
              (step === 'technique' && s.id === 'select') ||
              (step === 'upload' && ['select', 'technique'].includes(s.id)) ||
              (step === 'success')
            
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-medium
                  ${isActive ? 'bg-blue-600 text-white' : ''}
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                `}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`
                  ml-3 text-sm font-medium hidden sm:block
                  ${isActive ? 'text-blue-600' : ''}
                  ${isCompleted ? 'text-green-600' : ''}
                  ${!isActive && !isCompleted ? 'text-gray-500' : ''}
                `}>
                  {s.label}
                </span>
                {index < 3 && (
                  <div className={`
                    flex-1 h-1 mx-4 rounded
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step 1: Selection */}
      {step === 'select' && (
        <Card title="Sélectionnez la ceinture et le module">
          <div className="space-y-6">
            {/* Belt Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Ceinture
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {belts.map((belt) => (
                  <button
                    key={belt.id}
                    onClick={() => setSelectedBelt(belt.id)}
                    className={`
                      flex items-center p-3 rounded-lg border-2 transition-all
                      ${selectedBelt === belt.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <span
                      className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                      style={{ backgroundColor: belt.color }}
                    />
                    <span className="font-medium text-gray-900">
                      {getBeltName(belt.name)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Module Selection */}
            {selectedBelt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Module
                </label>
                {modules.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modules.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => setSelectedModule(module.id)}
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all
                          ${selectedModule === module.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="font-medium text-gray-900">
                          {module.code}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {module.name}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Aucun module pour cette ceinture</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() => setStep('technique')}
                disabled={!canProceedToTechnique}
              >
                Continuer
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Technique Selection */}
      {step === 'technique' && (
        <Card 
          title="Sélectionnez la technique"
          subtitle={`${techniques.length} technique(s) disponible(s)`}
        >
          <div className="space-y-4">
            {techniques.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {techniques.map((technique) => {
                  const hasCoachVideo = technique.videos.some(v => v.type === 'COACH')
                  const hasDemoVideo = technique.videos.some(v => v.type === 'DEMONSTRATION')
                  
                  return (
                    <button
                      key={technique.id}
                      onClick={() => setSelectedTechnique(technique)}
                      className={`
                        p-4 rounded-lg border-2 text-left transition-all
                        ${selectedTechnique?.id === technique.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {technique.name}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {getCategoryLabel(technique.category)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {hasCoachVideo && (
                            <Badge variant="warning">Coach</Badge>
                          )}
                          {hasDemoVideo && (
                            <Badge variant="info">Démo</Badge>
                          )}
                          {!hasCoachVideo && !hasDemoVideo && (
                            <Badge variant="default">Nouveau</Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune technique dans ce module</p>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('select')}>
                Retour
              </Button>
              <Button
                onClick={() => setStep('upload')}
                disabled={!canProceedToUpload}
              >
                Continuer
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Upload */}
      {step === 'upload' && selectedTechnique && (
        <Card title="Uploader la vidéo">
          <div className="space-y-6">
            {/* Technique Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Technique sélectionnée</p>
              <p className="font-medium text-gray-900">{selectedTechnique.name}</p>
            </div>

            {/* Video Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type de vidéo
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setVideoType('COACH')}
                  className={`
                    flex items-center justify-center p-4 rounded-lg border-2 transition-all
                    ${videoType === 'COACH'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <User className="w-6 h-6 mr-3 text-yellow-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Coach</div>
                    <div className="text-xs text-gray-500">Démonstration instructeur</div>
                  </div>
                </button>
                <button
                  onClick={() => setVideoType('DEMONSTRATION')}
                  className={`
                    flex items-center justify-center p-4 rounded-lg border-2 transition-all
                    ${videoType === 'DEMONSTRATION'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <Film className="w-6 h-6 mr-3 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Démonstration</div>
                    <div className="text-xs text-gray-500">Exécution standard</div>
                  </div>
                </button>
              </div>
            </div>

            {/* File Upload */}
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-colors
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer block">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    Glissez-déposez une vidéo ou cliquez pour sélectionner
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    MP4, MOV, AVI (max 500MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <Video className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  {!uploading && (
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {uploading && (
                  <div className="mt-4">
                    <ProgressBar progress={uploadProgress} />
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Upload en cours... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Camera Option */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Ou utilisez votre appareil</p>
              <input
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                id="camera-upload"
              />
              <label
                htmlFor="camera-upload"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <Video className="w-5 h-5 mr-2" />
                Filmer avec le smartphone
              </label>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('technique')}>
                Retour
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Success */}
      {step === 'success' && (
        <Card className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Upload réussi !
          </h2>
          <p className="text-gray-600 mb-8">
            La vidéo a été uploadée avec succès pour la technique{' '}
            <span className="font-medium">{selectedTechnique?.name}</span>
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push('/admin/videos')}>
              Voir toutes les vidéos
            </Button>
            <Button onClick={() => {
              setStep('select')
              setSelectedBelt('')
              setSelectedModule('')
              setSelectedTechnique(null)
              setSelectedFile(null)
              setUploadProgress(0)
            }}>
              <Upload className="w-4 h-4 mr-2" />
              Uploader une autre vidéo
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

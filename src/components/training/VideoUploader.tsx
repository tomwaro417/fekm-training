'use client'

import React, { useCallback, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Upload, Camera, X, Video, FileVideo, AlertCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================
// TYPES
// ============================================

export interface VideoUploaderProps {
  /** ID de la technique associée */
  techniqueId: string
  /** Type de vidéo (débutant ou progression) */
  videoType: 'DEBUTANT' | 'PROGRESSION'
  /** Callback appelé après upload réussi */
  onUploadSuccess?: (video: UploadedVideo) => void
  /** Callback appelé en cas d'erreur */
  onUploadError?: (error: Error) => void
  /** URL de l'API d'upload */
  uploadUrl?: string
  /** Taille max en MB (défaut: 100) */
  maxSizeMB?: number
  /** Formats acceptés */
  acceptedFormats?: string[]
  /** Classes CSS additionnelles */
  className?: string
  /** Texte d'aide personnalisé */
  helperText?: string
}

export interface UploadedVideo {
  id: string
  url: string
  thumbnailUrl?: string
  duration?: number
  filename: string
  createdAt: string
}

interface UploadState {
  status: 'idle' | 'dragging' | 'uploading' | 'processing' | 'success' | 'error'
  progress: number
  error?: string
  video?: UploadedVideo
  fileSize?: number
  uploadedSize?: number
}

// ============================================
// CONSTANTES
// ============================================

const DEFAULT_MAX_SIZE_MB = 100
const DEFAULT_ACCEPTED_FORMATS = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/mov', 'video/*']

// ============================================
// COMPOSANT
// ============================================

export function VideoUploader({
  techniqueId,
  videoType,
  onUploadSuccess,
  onUploadError,
  uploadUrl = '/api/videos/upload',
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  className,
  helperText = 'Glissez-déposez une vidéo ou cliquez pour sélectionner',
}: VideoUploaderProps) {
  const [state, setState] = useState<UploadState>({ status: 'idle', progress: 0 })
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const recordedChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const dragCounterRef = useRef(0)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  // Détection mobile - fait côté client uniquement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
  }, [])

  // ============================================
  // VALIDATION
  // ============================================

  const validateFile = useCallback((file: File): string | null => {
    const isVideo = file.type.startsWith('video/') || acceptedFormats.includes(file.type)
    if (!isVideo && file.type !== '') {
      console.warn('Type de fichier non reconnu:', file.type, 'nom:', file.name)
    }
    if (file.size > maxSizeBytes) {
      return `Fichier trop volumineux. Taille max: ${maxSizeMB}MB`
    }
    return null
  }, [maxSizeBytes, maxSizeMB, acceptedFormats])

  // ============================================
  // UPLOAD
  // ============================================

  const uploadFile = useCallback(async (file: File) => {
    setState({ status: 'uploading', progress: 0, fileSize: file.size, uploadedSize: 0 })

    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('techniqueId', techniqueId)
      formData.append('slot', videoType)

      const xhr = new XMLHttpRequest()
      
      // Configurer la progression avant d'ouvrir la connexion
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          console.log('Upload progress:', progress, '%', event.loaded, '/', event.total)
          setState(prev => ({ ...prev, progress, uploadedSize: event.loaded }))
        } else {
          // Si lengthComputable est false, estimer la progression
          console.log('Upload progress: length not computable, estimating...')
          const estimatedProgress = Math.min(
            Math.round((event.loaded / file.size) * 100),
            99 // Max 99% jusqu'à confirmation
          )
          setState(prev => ({ 
            ...prev, 
            progress: estimatedProgress,
            uploadedSize: event.loaded 
          }))
        }
      }

      // Événement de démarrage
      xhr.upload.onloadstart = () => {
        console.log('Upload started')
        setState(prev => ({ ...prev, progress: 0 }))
      }

      // Événement de fin d'upload (données envoyées)
      xhr.upload.onload = () => {
        console.log('Upload data sent')
        setState(prev => ({ ...prev, progress: 100 }))
      }

      // Réponse du serveur reçue
      xhr.onload = () => {
        console.log('Upload response:', xhr.status, xhr.responseText)
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          setState({ status: 'success', progress: 100, video: response.video })
          // Forcer le rechargement de la page pour afficher la nouvelle vidéo
          setTimeout(() => {
            window.location.reload()
          }, 500)
          onUploadSuccess?.(response.video)
        } else {
          let errorMsg = 'Erreur lors de l\'upload'
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            errorMsg = errorResponse.error || errorMsg
          } catch (e) {
            errorMsg = `Erreur ${xhr.status}: ${xhr.statusText}`
          }
          console.error('Upload error:', xhr.status, errorMsg)
          setState({ status: 'error', progress: 0, error: errorMsg })
          onUploadError?.(new Error(errorMsg))
        }
      }

      xhr.onerror = () => {
        const error = 'Erreur réseau lors de l\'upload'
        setState({ status: 'error', progress: 0, error })
        onUploadError?.(new Error(error))
      }

      xhr.ontimeout = () => {
        const error = 'Timeout lors de l\'upload'
        setState({ status: 'error', progress: 0, error })
        onUploadError?.(new Error(error))
      }

      // Ouvrir et envoyer la requête
      xhr.open('POST', uploadUrl, true)
      xhr.send(formData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setState({ status: 'error', progress: 0, error: errorMessage })
      onUploadError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [techniqueId, videoType, uploadUrl, onUploadSuccess, onUploadError])

  // ============================================
  // GESTION DRAG & DROP
  // ============================================

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setState(prev => ({ ...prev, status: 'dragging' }))
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setState(prev => ({ ...prev, status: 'idle' }))
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      const error = validateFile(file)
      
      if (error) {
        setState({ status: 'error', progress: 0, error })
        onUploadError?.(new Error(error))
        return
      }
      
      uploadFile(file)
    } else {
      setState({ status: 'idle', progress: 0 })
    }
  }, [validateFile, uploadFile, onUploadError])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const error = validateFile(file)
      
      if (error) {
        setState({ status: 'error', progress: 0, error })
        onUploadError?.(new Error(error))
        return
      }
      
      uploadFile(file)
    }
  }, [validateFile, uploadFile, onUploadError])

  // ============================================
  // CAMÉRA
  // ============================================

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    setStream(null)
    setShowCamera(false)
    setIsRecording(false)
    recordedChunksRef.current = []
  }, [stream])

  const startCamera = useCallback(async () => {
    try {
      console.log('Démarrage caméra...')
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia non supporté')
      }
      
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      }
      
      console.log('Constraints:', constraints)
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      console.log('Stream obtenu:', mediaStream.active, 'tracks:', mediaStream.getTracks().length)
      
      setStream(mediaStream)
      setShowCamera(true)
    } catch (error) {
      console.error('Erreur caméra:', error)
      const errorMessage = error instanceof Error ? error.message : 'Impossible d\'accéder à la caméra'
      setState({ status: 'error', progress: 0, error: errorMessage })
      onUploadError?.(new Error(errorMessage))
    }
  }, [onUploadError])

  // Connecter le flux vidéo quand showCamera devient true
  useEffect(() => {
    console.log('useEffect caméra - showCamera:', showCamera, 'stream:', !!stream, 'videoRef:', !!videoRef.current)
    if (showCamera && stream && videoRef.current) {
      console.log('Connexion du stream à la vidéo...')
      videoRef.current.srcObject = stream
      videoRef.current.play().then(() => {
        console.log('Vidéo en lecture')
      }).catch(err => {
        console.error('Erreur lecture vidéo:', err)
      })
    }
  }, [showCamera, stream])

  const startRecording = useCallback(() => {
    if (!stream) {
      console.error('Pas de stream disponible')
      return
    }

    console.log('Démarrage enregistrement...')
    
    recordedChunksRef.current = []

    let mimeType = 'video/webm'
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      mimeType = 'video/webm;codecs=vp9,opus'
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
      mimeType = 'video/webm;codecs=vp8,opus'
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4'
    }
    
    console.log('MimeType choisi:', mimeType)

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      
      mediaRecorderRef.current = mediaRecorder
      
      let chunkCount = 0

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data?.size, 'bytes')
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
          chunkCount++
        }
      }

      mediaRecorder.onstop = () => {
        console.log('Enregistrement arrêté, chunks:', recordedChunksRef.current.length, 'total chunks received:', chunkCount)
        
        if (recordedChunksRef.current.length === 0) {
          setState({ status: 'error', progress: 0, error: 'Aucune donnée vidéo enregistrée' })
          onUploadError?.(new Error('Aucune donnée vidéo enregistrée'))
          stopCamera()
          return
        }
        
        const blob = new Blob(recordedChunksRef.current, { type: mimeType })
        console.log('Blob créé:', blob.size, 'bytes')
        
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const file = new File([blob], `recording-${Date.now()}.${extension}`, { type: mimeType })
        uploadFile(file)
        stopCamera()
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setState({ status: 'error', progress: 0, error: 'Erreur lors de l\'enregistrement' })
        onUploadError?.(new Error('Erreur lors de l\'enregistrement'))
        stopCamera()
      }

      mediaRecorder.start(100)
      console.log('MediaRecorder démarré')
      setIsRecording(true)
    } catch (error) {
      console.error('Erreur démarrage enregistrement:', error)
      setState({ status: 'error', progress: 0, error: 'Impossible de démarrer l\'enregistrement' })
      onUploadError?.(new Error('Impossible de démarrer l\'enregistrement'))
    }
  }, [stream, uploadFile, stopCamera, onUploadError])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // ============================================
  // RENDU
  // ============================================

  return (
    <div className={cn('w-full', className)}>
      <AnimatePresence mode="wait">
        {showCamera ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-black rounded-2xl overflow-hidden"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              controls={false}
              className="w-full aspect-video object-cover bg-black"
              onLoadedMetadata={() => console.log('Vidéo metadata loaded')}
              onCanPlay={() => console.log('Vidéo can play')}
              onError={(e) => console.error('Vidéo error:', e)}
            />
            
            {/* Overlay recording indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                REC
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
              <button
                onClick={stopCamera}
                className="p-3 bg-gray-800/80 text-white rounded-full hover:bg-gray-700/80 transition-colors"
                aria-label="Fermer la caméra"
              >
                <X className="w-6 h-6" />
              </button>
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center transition-all',
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-white hover:bg-gray-100'
                )}
                aria-label={isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement'}
              >
                {isRecording ? (
                  <div className="w-6 h-6 bg-white rounded-sm" />
                ) : (
                  <div className="w-12 h-12 bg-red-600 rounded-full" />
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="uploader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              'relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200',
              state.status === 'dragging' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-gray-50 hover:border-gray-400',
              state.status === 'uploading' && 'pointer-events-none',
              state.status === 'error' && 'border-red-300 bg-red-50'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Sélectionner un fichier vidéo"
            />

            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors',
                state.status === 'dragging' ? 'bg-blue-100' : 'bg-gray-100',
                state.status === 'error' && 'bg-red-100'
              )}>
                {state.status === 'uploading' ? (
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : state.status === 'success' ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : state.status === 'error' ? (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                ) : (
                  <Upload className={cn(
                    'w-8 h-8 transition-colors',
                    state.status === 'dragging' ? 'text-blue-600' : 'text-gray-400'
                  )} />
                )}
              </div>

              {/* Text */}
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {state.status === 'uploading' 
                  ? 'Upload en cours...' 
                  : state.status === 'success'
                  ? 'Upload terminé !'
                  : state.status === 'error'
                  ? 'Erreur'
                  : helperText}
              </h3>

              {state.status === 'uploading' && (
                <div className="w-full max-w-xs mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{state.progress}%</span>
                    <span>
                      {state.uploadedSize !== undefined && state.fileSize !== undefined
                        ? `${(state.uploadedSize / (1024 * 1024)).toFixed(1)}MB / ${(state.fileSize / (1024 * 1024)).toFixed(1)}MB`
                        : `${state.progress}%`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${state.progress}%` }}
                      transition={{ duration: 0.1, ease: "linear" }}
                    />
                  </div>
                </div>
              )}

              {state.status === 'error' && state.error && (
                <p className="text-sm text-red-600 mt-2">{state.error}</p>
              )}

              {state.status === 'success' && state.video && (
                <p className="text-sm text-green-600 mt-2">
                  {state.video.filename}
                </p>
              )}

              {/* Buttons */}
              {state.status === 'idle' && (
                <div className="flex flex-col gap-3 mt-6">
                  {/* Input file standard */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <FileVideo className="w-4 h-4" />
                    Choisir une vidéo
                  </button>
                  
                  {/* Input camera natif pour mobile */}
                  {isMobile && (
                    <>
                      <input
                        type="file"
                        accept="video/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="camera-input"
                      />
                      <label
                        htmlFor="camera-input"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        Filmer (caméra)
                      </label>
                    </>
                  )}
                  
                  {/* Caméra intégrée (expérimental) */}
                  {isMobile && (
                    <button
                      onClick={startCamera}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm"
                    >
                      <Video className="w-4 h-4" />
                      Caméra intégrée (test)
                    </button>
                  )}
                </div>
              )}

              {state.status === 'error' && (
                <button
                  onClick={() => setState({ status: 'idle', progress: 0 })}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Réessayer
                </button>
              )}

              {/* Info */}
              <p className="text-xs text-gray-500 mt-4">
                MP4, MOV, WebM jusqu'à {maxSizeMB}MB
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

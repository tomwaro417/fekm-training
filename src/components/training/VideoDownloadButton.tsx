'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  Download, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Pause,
  Play,
  FileVideo,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================
// TYPES
// ============================================

export interface VideoDownloadButtonProps {
  /** ID de la vidéo */
  videoId: string
  /** URL de la vidéo à télécharger */
  videoUrl: string
  /** Nom du fichier pour le téléchargement */
  filename?: string
  /** Taille du fichier en bytes (pour la progression) */
  fileSize?: number
  /** Format du fichier */
  format?: string
  /** Callback quand le téléchargement démarre */
  onDownloadStart?: () => void
  /** Callback quand le téléchargement se termine */
  onDownloadComplete?: () => void
  /** Callback quand une erreur survient */
  onDownloadError?: (error: Error) => void
  /** Variante d'affichage */
  variant?: 'button' | 'icon' | 'card'
  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg'
  /** Classes CSS additionnelles */
  className?: string
  /** Texte du bouton */
  buttonText?: string
  /** Désactiver le bouton */
  disabled?: boolean
  /** URL de l'API de téléchargement (si différente de videoUrl) */
  downloadApiUrl?: string
  /** Utiliser le téléchargement via API (pour auth) */
  useApiDownload?: boolean
}

type DownloadStatus = 'idle' | 'downloading' | 'paused' | 'completed' | 'error'

interface DownloadState {
  status: DownloadStatus
  progress: number
  downloadedBytes: number
  error?: string
  speed?: number // bytes/s
  eta?: number // seconds
}

// ============================================
// CONSTANTES
// ============================================

const CHUNK_SIZE = 1024 * 1024 // 1MB
const UPDATE_INTERVAL = 500 // ms

// ============================================
// HELPERS
// ============================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}m ${secs}s`
}

// ============================================
// COMPOSANT
// ============================================

export function VideoDownloadButton({
  videoId,
  videoUrl,
  filename = 'video.mp4',
  fileSize,
  format = 'mp4',
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
  variant = 'button',
  size = 'md',
  className,
  buttonText = 'Télécharger',
  disabled = false,
  downloadApiUrl,
  useApiDownload = false,
}: VideoDownloadButtonProps) {
  const [state, setState] = useState<DownloadState>({
    status: 'idle',
    progress: 0,
    downloadedBytes: 0,
  })
  const [showDetails, setShowDetails] = useState(false)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const downloadStartTimeRef = useRef<number>(0)
  const lastUpdateTimeRef = useRef<number>(0)
  const lastDownloadedBytesRef = useRef<number>(0)

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const downloadFile = useCallback(async () => {
    if (state.status === 'downloading') return

    setState({ status: 'downloading', progress: 0, downloadedBytes: 0 })
    setShowDetails(true)
    onDownloadStart?.()
    
    downloadStartTimeRef.current = Date.now()
    lastUpdateTimeRef.current = Date.now()
    lastDownloadedBytesRef.current = 0

    try {
      const url = useApiDownload && downloadApiUrl ? downloadApiUrl : videoUrl
      abortControllerRef.current = new AbortController()

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: useApiDownload ? { 'Accept': 'video/*' } : undefined,
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const contentLength = fileSize || parseInt(response.headers.get('content-length') || '0')
      const reader = response.body?.getReader()
      
      if (!reader) {
        throw new Error('Impossible de lire le flux')
      }

      const chunks: Uint8Array[] = []
      let receivedLength = 0

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        chunks.push(value)
        receivedLength += value.length

        // Calculer la progression
        const progress = contentLength > 0 
          ? Math.round((receivedLength / contentLength) * 100)
          : 0

        // Calculer la vitesse et ETA
        const now = Date.now()
        const timeDiff = (now - lastUpdateTimeRef.current) / 1000
        
        if (timeDiff >= UPDATE_INTERVAL / 1000) {
          const bytesDiff = receivedLength - lastDownloadedBytesRef.current
          const speed = bytesDiff / timeDiff
          const eta = speed > 0 && contentLength > 0
            ? (contentLength - receivedLength) / speed
            : undefined

          setState({
            status: 'downloading',
            progress,
            downloadedBytes: receivedLength,
            speed,
            eta,
          })

          lastUpdateTimeRef.current = now
          lastDownloadedBytesRef.current = receivedLength
        } else {
          setState(prev => ({
            ...prev,
            progress,
            downloadedBytes: receivedLength,
          }))
        }
      }

      // Créer le blob et télécharger
      const blob = new Blob(chunks as BlobPart[])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      setState({
        status: 'completed',
        progress: 100,
        downloadedBytes: receivedLength,
      })
      
      onDownloadComplete?.()

      // Cacher les détails après 3 secondes
      setTimeout(() => {
        setShowDetails(false)
        setState({ status: 'idle', progress: 0, downloadedBytes: 0 })
      }, 3000)

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setState({ status: 'idle', progress: 0, downloadedBytes: 0 })
        return
      }

      const errorMessage = error instanceof Error ? error.message : 'Erreur de téléchargement'
      setState({
        status: 'error',
        progress: 0,
        downloadedBytes: 0,
        error: errorMessage,
      })
      
      onDownloadError?.(error instanceof Error ? error : new Error(errorMessage))
    }
  }, [videoUrl, filename, fileSize, useApiDownload, downloadApiUrl, onDownloadStart, onDownloadComplete, onDownloadError, state.status])

  const cancelDownload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setState({ status: 'idle', progress: 0, downloadedBytes: 0 })
    setShowDetails(false)
  }, [])

  const retryDownload = useCallback(() => {
    setState({ status: 'idle', progress: 0, downloadedBytes: 0 })
    downloadFile()
  }, [downloadFile])

  // Classes selon la taille
  const sizeClasses = {
    sm: {
      button: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
    },
    md: {
      button: 'px-4 py-2 text-sm',
      icon: 'w-5 h-5',
    },
    lg: {
      button: 'px-6 py-3 text-base',
      icon: 'w-6 h-6',
    },
  }

  // Rendu selon la variante
  if (variant === 'icon') {
    return (
      <div className={cn('relative', className)}>
        <button
          onClick={state.status === 'downloading' ? cancelDownload : downloadFile}
          disabled={disabled || state.status === 'completed'}
          className={cn(
            'p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
            state.status === 'downloading' 
              ? 'bg-red-100 text-red-600 hover:bg-red-200 focus:ring-red-500'
              : state.status === 'completed'
              ? 'bg-green-100 text-green-600 cursor-default'
              : state.status === 'error'
              ? 'bg-red-100 text-red-600 hover:bg-red-200 focus:ring-red-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-blue-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={
            state.status === 'downloading' 
              ? 'Annuler le téléchargement' 
              : state.status === 'completed'
              ? 'Téléchargement terminé'
              : 'Télécharger la vidéo'
          }
        >
          <AnimatePresence mode="wait">
            {state.status === 'downloading' ? (
              <motion.div
                key="downloading"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="relative"
              >
                <X className={sizeClasses[size].icon} />
                {state.progress > 0 && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${state.progress * 2.83} 283`}
                      className="text-blue-600"
                    />
                  </svg>
                )}
              </motion.div>
            ) : state.status === 'completed' ? (
              <motion.div
                key="completed"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <CheckCircle2 className={sizeClasses[size].icon} />
              </motion.div>
            ) : state.status === 'error' ? (
              <motion.div
                key="error"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <AlertCircle className={sizeClasses[size].icon} />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Download className={sizeClasses[size].icon} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Tooltip avec progression */}
        <AnimatePresence>
          {showDetails && state.status === 'downloading' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10"
            >
              {state.progress}%
              {state.speed && ` • ${formatSpeed(state.speed)}`}
              {state.eta && ` • ${formatTime(state.eta)} restant`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        'bg-white rounded-xl border border-gray-200 p-4 transition-all',
        state.status === 'downloading' && 'border-blue-300 shadow-md',
        state.status === 'completed' && 'border-green-300 bg-green-50',
        state.status === 'error' && 'border-red-300 bg-red-50',
        className
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            state.status === 'downloading' ? 'bg-blue-100 text-blue-600' :
            state.status === 'completed' ? 'bg-green-100 text-green-600' :
            state.status === 'error' ? 'bg-red-100 text-red-600' :
            'bg-gray-100 text-gray-600'
          )}>
            <FileVideo className="w-6 h-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{filename}</h4>
            <p className="text-sm text-gray-500">
              {fileSize ? formatBytes(fileSize) : 'Taille inconnue'} • {format.toUpperCase()}
            </p>
          </div>

          <button
            onClick={state.status === 'downloading' ? cancelDownload : 
                     state.status === 'error' ? retryDownload : downloadFile}
            disabled={disabled || state.status === 'completed'}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              state.status === 'downloading' 
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : state.status === 'completed'
                ? 'bg-green-100 text-green-700 cursor-default'
                : state.status === 'error'
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-600 text-white hover:bg-blue-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {state.status === 'downloading' ? 'Annuler' :
             state.status === 'completed' ? 'Terminé' :
             state.status === 'error' ? 'Réessayer' :
             buttonText}
          </button>
        </div>

        {/* Progress bar */}
        <AnimatePresence>
          {showDetails && state.status === 'downloading' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-100"
            >
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{state.progress}%</span>
                <span>
                  {formatBytes(state.downloadedBytes)}
                  {fileSize && ` / ${formatBytes(fileSize)}`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="h-2 bg-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${state.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>
                  {state.speed && formatSpeed(state.speed)}
                </span>
                <span>
                  {state.eta && `${formatTime(state.eta)} restant`}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        <AnimatePresence>
          {state.status === 'error' && state.error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-red-200"
            >
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {state.error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Default: button variant
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={state.status === 'downloading' ? cancelDownload : 
                 state.status === 'error' ? retryDownload : downloadFile}
        disabled={disabled || state.status === 'completed'}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          sizeClasses[size].button,
          state.status === 'downloading' 
            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
            : state.status === 'completed'
            ? 'bg-green-600 text-white cursor-default'
            : state.status === 'error'
            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <AnimatePresence mode="wait">
          {state.status === 'downloading' ? (
            <motion.span
              key="downloading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Loader2 className={cn(sizeClasses[size].icon, 'animate-spin')} />
              {state.progress}%
            </motion.span>
          ) : state.status === 'completed' ? (
            <motion.span
              key="completed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className={sizeClasses[size].icon} />
              Téléchargé
            </motion.span>
          ) : state.status === 'error' ? (
            <motion.span
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <AlertCircle className={sizeClasses[size].icon} />
              Réessayer
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Download className={sizeClasses[size].icon} />
              {buttonText}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Progress popup */}
      <AnimatePresence>
        {showDetails && state.status === 'downloading' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-20"
          >
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">Téléchargement...</span>
              <span>{state.progress}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <motion.div
                className="h-2 bg-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${state.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatBytes(state.downloadedBytes)}</span>
              <span>
                {state.speed && formatSpeed(state.speed)}
                {state.eta && ` • ${formatTime(state.eta)}`}
              </span>
            </div>

            <button
              onClick={cancelDownload}
              className="mt-3 w-full py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

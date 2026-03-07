'use client'

import { useState, useCallback } from 'react'
import { Upload, X, FileVideo, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressBar } from './FormComponents'

interface VideoUploadProps {
  onUpload: (file: File) => Promise<void>
  onCancel?: () => void
  accept?: string
  maxSizeMB?: number
  className?: string
}

export function VideoUpload({ 
  onUpload, 
  onCancel,
  accept = 'video/*',
  maxSizeMB = 500,
  className 
}: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('video/')) {
      return 'Le fichier doit être une vidéo'
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Le fichier ne doit pas dépasser ${maxSizeMB}MB`
    }
    return null
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
    if (file) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      setError(null)
      setSelectedFile(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      setError(null)
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    setProgress(0)
    
    // Simuler la progression
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 500)

    try {
      await onUpload(selectedFile)
      setProgress(100)
      setTimeout(() => {
        setSelectedFile(null)
        setProgress(0)
      }, 1000)
    } catch (err) {
      setError('Erreur lors de l\'upload')
    } finally {
      clearInterval(progressInterval)
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('w-full', className)}>
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          )}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id="video-upload-input"
          />
          <label htmlFor="video-upload-input" className="cursor-pointer block">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              Glissez-déposez une vidéo ou cliquez pour sélectionner
            </p>
            <p className="text-sm text-gray-400 mt-1">
              MP4, MOV, AVI (max {maxSizeMB}MB)
            </p>
          </label>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <FileVideo className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            {!uploading && (
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {uploading ? (
            <div className="mt-4">
              <ProgressBar progress={progress} size="md" />
              <p className="text-sm text-gray-500 mt-2 text-center">
                Upload en cours... {progress}%
              </p>
            </div>
          ) : progress === 100 ? (
            <div className="flex items-center justify-center text-green-600 mt-4">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Upload terminé avec succès !</span>
            </div>
          ) : (
            <div className="flex gap-3 mt-4">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Annuler
                </button>
              )}
              <button
                onClick={handleUpload}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Uploader
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}

interface CameraCaptureProps {
  onCapture: (file: File) => void
  className?: string
}

export function CameraCapture({ onCapture, className }: CameraCaptureProps) {
  return (
    <div className={cn('w-full', className)}>
      <input
        type="file"
        accept="video/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onCapture(file)
        }}
        className="hidden"
        id="camera-capture"
      />
      <label
        htmlFor="camera-capture"
        className="flex items-center justify-center w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Filmer avec le smartphone
      </label>
    </div>
  )
}

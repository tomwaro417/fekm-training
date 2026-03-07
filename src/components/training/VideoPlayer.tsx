'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================
// TYPES
// ============================================

export interface VideoPlayerProps {
  /** URL de la vidéo */
  src: string
  /** URL de la miniature */
  poster?: string
  /** Titre de la vidéo */
  title?: string
  /** Durée en secondes (si connue) */
  duration?: number
  /** Lecture automatique */
  autoPlay?: boolean
  /** Mode boucle */
  loop?: boolean
  /** Muet par défaut */
  muted?: boolean
  /** Qualité par défaut */
  defaultQuality?: 'auto' | '1080p' | '720p' | '480p' | '360p'
  /** Sources multiples (pour qualités différentes) */
  sources?: VideoSource[]
  /** Callback quand la vidéo se termine */
  onEnded?: () => void
  /** Callback quand le temps change */
  onTimeUpdate?: (currentTime: number, duration: number) => void
  /** Callback quand la vidéo est prête */
  onLoaded?: () => void
  /** Callback quand une erreur survient */
  onError?: (error: Error) => void
  /** Classes CSS additionnelles */
  className?: string
}

export interface VideoSource {
  src: string
  quality: '1080p' | '720p' | '480p' | '360p'
  type: string
}

// ============================================
// CONSTANTES
// ============================================

const SEEK_STEP = 10 // secondes
const VOLUME_STEP = 0.1
const CONTROLS_HIDE_DELAY = 3000 // ms

// ============================================
// HELPERS
// ============================================

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatTimeWithHours(seconds: number): string {
  if (isNaN(seconds)) return '0:00'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ============================================
// COMPOSANT
// ============================================

export function VideoPlayer({
  src,
  poster,
  title,
  duration: initialDuration,
  autoPlay = false,
  loop = false,
  muted = false,
  defaultQuality = 'auto',
  sources = [],
  onEnded,
  onTimeUpdate,
  onLoaded,
  onError,
  className,
}: VideoPlayerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<number | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // State
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(initialDuration || 0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [currentQuality, setCurrentQuality] = useState(defaultQuality)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null)

  // ============================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ============================================

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false)
      }, CONTROLS_HIDE_DELAY)
    }
  }, [isPlaying])

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }, [isPlaying])

  const handleVolumeToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }, [])

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const handleFullscreenToggle = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }, [isFullscreen])

  const handleSkip = useCallback((seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds))
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [duration])

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
      setShowSettings(false)
    }
  }, [])

  const handleQualityChange = useCallback((quality: string) => {
    setCurrentQuality(quality as typeof currentQuality)
    setShowSettings(false)
    // TODO: Implémenter le changement de source vidéo
  }, [])

  // ============================================
  // ÉVÉNEMENTS VIDÉO
  // ============================================

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onTimeUpdate?.(video.currentTime, video.duration)
    }
    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
      onLoaded?.()
    }
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }
    const handleError = () => {
      const errorMsg = 'Erreur lors du chargement de la vidéo'
      setError(errorMsg)
      setIsLoading(false)
      onError?.(new Error(errorMsg))
    }
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [onEnded, onTimeUpdate, onLoaded, onError])

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  // ============================================
  // GESTION TACTILE (MOBILE)
  // ============================================

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStartX(touch.clientX)
    setTouchStartTime(currentTime)
    showControlsTemporarily()
  }, [currentTime, showControlsTemporarily])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX === null || !videoRef.current) return
    
    const touch = e.touches[0]
    const diffX = touch.clientX - touchStartX
    const seekAmount = (diffX / window.innerWidth) * duration * 0.5
    
    // Feedback visuel pendant le drag
    if (Math.abs(diffX) > 20) {
      e.preventDefault()
    }
  }, [touchStartX, duration])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX === null || !videoRef.current || touchStartTime === null) return
    
    const touch = e.changedTouches[0]
    const diffX = touch.clientX - touchStartX
    const seekAmount = (diffX / window.innerWidth) * duration * 0.5
    
    if (Math.abs(diffX) > 50) {
      // Seek
      const newTime = Math.max(0, Math.min(duration, touchStartTime + seekAmount))
      handleSeek(newTime)
    } else if (Math.abs(diffX) < 10) {
      // Tap - play/pause
      handlePlayPause()
    }
    
    setTouchStartX(null)
    setTouchStartTime(null)
  }, [touchStartX, touchStartTime, duration, handleSeek, handlePlayPause])

  // ============================================
  // GESTION CLAVIER
  // ============================================

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault()
        handlePlayPause()
        break
      case 'ArrowLeft':
        e.preventDefault()
        handleSkip(-SEEK_STEP)
        break
      case 'ArrowRight':
        e.preventDefault()
        handleSkip(SEEK_STEP)
        break
      case 'ArrowUp':
        e.preventDefault()
        handleVolumeChange(Math.min(1, volume + VOLUME_STEP))
        break
      case 'ArrowDown':
        e.preventDefault()
        handleVolumeChange(Math.max(0, volume - VOLUME_STEP))
        break
      case 'f':
        e.preventDefault()
        handleFullscreenToggle()
        break
      case 'm':
        e.preventDefault()
        handleVolumeToggle()
        break
    }
  }, [handlePlayPause, handleSkip, handleVolumeChange, volume, handleFullscreenToggle, handleVolumeToggle])

  // ============================================
  // RENDU
  // ============================================

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferProgress = duration > 0 ? (buffered / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative group bg-black rounded-xl overflow-hidden select-none',
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full',
        className
      )}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label={title || 'Lecteur vidéo'}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        className="w-full h-full object-contain"
        onClick={handlePlayPause}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Loading spinner */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80"
          >
            <div className="text-center text-white p-4">
              <p className="text-lg font-semibold mb-2">Erreur</p>
              <p className="text-sm opacity-80">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big play button (center) */}
      <AnimatePresence>
        {!isPlaying && !isLoading && !error && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
            aria-label="Lire la vidéo"
          >
            <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-10 h-10 text-gray-900 ml-1" fill="currentColor" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent"
          >
            {/* Title */}
            {title && (
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
                <h3 className="text-white font-medium truncate">{title}</h3>
              </div>
            )}

            {/* Progress bar */}
            <div className="px-4 pb-2">
              <div
                ref={progressBarRef}
                className="relative h-1.5 bg-white/30 rounded-full cursor-pointer group/progress"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const percent = (e.clientX - rect.left) / rect.width
                  handleSeek(percent * duration)
                }}
              >
                {/* Buffered */}
                <div
                  className="absolute h-full bg-white/40 rounded-full"
                  style={{ width: `${bufferProgress}%` }}
                />
                
                {/* Progress */}
                <motion.div
                  className="absolute h-full bg-blue-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
                
                {/* Thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress}% - 8px)` }}
                />
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <button
                  onClick={handlePlayPause}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Lecture'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" fill="currentColor" />
                  ) : (
                    <Play className="w-6 h-6" fill="currentColor" />
                  )}
                </button>

                {/* Skip backward */}
                <button
                  onClick={() => handleSkip(-SEEK_STEP)}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors hidden sm:block"
                  aria-label="Reculer 10 secondes"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {/* Skip forward */}
                <button
                  onClick={() => handleSkip(SEEK_STEP)}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors hidden sm:block"
                  aria-label="Avancer 10 secondes"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2 group/volume">
                  <button
                    onClick={handleVolumeToggle}
                    className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                    aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  
                  {/* Volume slider */}
                  <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-200">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      aria-label="Volume"
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="text-white text-sm font-medium tabular-nums">
                  {formatTime(currentTime)} / {formatTimeWithHours(duration)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Settings */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Paramètres"
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-xl p-2 min-w-[150px]"
                      >
                        {/* Playback speed */}
                        <div className="mb-2">
                          <p className="text-xs text-gray-400 px-2 py-1">Vitesse</p>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => handlePlaybackRateChange(rate)}
                              className={cn(
                                'w-full text-left px-2 py-1 text-sm rounded transition-colors',
                                playbackRate === rate
                                  ? 'bg-blue-600 text-white'
                                  : 'text-white hover:bg-white/10'
                              )}
                            >
                              {rate === 1 ? 'Normal' : `${rate}x`}
                            </button>
                          ))}
                        </div>

                        {/* Quality */}
                        {sources.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-400 px-2 py-1">Qualité</p>
                            {['auto', '1080p', '720p', '480p', '360p'].map((quality) => (
                              <button
                                key={quality}
                                onClick={() => handleQualityChange(quality)}
                                className={cn(
                                  'w-full text-left px-2 py-1 text-sm rounded transition-colors',
                                  currentQuality === quality
                                    ? 'bg-blue-600 text-white'
                                    : 'text-white hover:bg-white/10'
                                )}
                              >
                                {quality === 'auto' ? 'Auto' : quality}
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Fullscreen */}
                <button
                  onClick={handleFullscreenToggle}
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                  aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

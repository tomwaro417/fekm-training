'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================
// TYPES
// ============================================

export interface OfflineIndicatorProps {
  /** Callback quand le statut change */
  onStatusChange?: (isOnline: boolean) => void
  /** Afficher une notification toast quand on revient online */
  showReconnectionToast?: boolean
  /** Délai avant de considérer comme offline (ms) */
  offlineDelay?: number
  /** Classes CSS additionnelles */
  className?: string
  /** Position de l'indicateur */
  position?: 'top' | 'bottom' | 'static'
  /** Mode compact (juste l'icône) */
  compact?: boolean
}

type ConnectionStatus = 'online' | 'offline' | 'checking'

// ============================================
// COMPOSANT
// ============================================

export function OfflineIndicator({
  onStatusChange,
  showReconnectionToast = true,
  offlineDelay = 3000,
  className,
  position = 'top',
  compact = false,
}: OfflineIndicatorProps) {
  const [status, setStatus] = useState<ConnectionStatus>('checking')
  const [showToast, setShowToast] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Vérifier l'état initial
    const checkConnection = async () => {
      setStatus('checking')
      
      try {
        // Utiliser l'API Network Information si disponible
        if ('connection' in navigator) {
          const connection = (navigator as any).connection
          if (connection.effectiveType === 'none') {
            setStatus('offline')
            setWasOffline(true)
            onStatusChange?.(false)
            return
          }
        }
        
        // Fallback: vérifier navigator.onLine
        if (navigator.onLine) {
          setStatus('online')
          onStatusChange?.(true)
        } else {
          setStatus('offline')
          setWasOffline(true)
          onStatusChange?.(false)
        }
      } catch {
        setStatus('online')
        onStatusChange?.(true)
      }
    }

    checkConnection()

    // Gestionnaires d'événements
    let offlineTimeout: ReturnType<typeof setTimeout>

    const handleOnline = () => {
      clearTimeout(offlineTimeout)
      setStatus('online')
      
      if (wasOffline && showReconnectionToast) {
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      }
      
      setWasOffline(false)
      onStatusChange?.(true)
    }

    const handleOffline = () => {
      // Délai avant de considérer comme vraiment offline
      // Évite les faux positifs lors de courts moments de perte de connexion
      offlineTimeout = setTimeout(() => {
        setStatus('offline')
        setWasOffline(true)
        onStatusChange?.(false)
      }, offlineDelay)
    }

    // Écouter les changements de connexion
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Vérification périodique pour plus de fiabilité
    const intervalId = setInterval(checkConnection, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(intervalId)
      clearTimeout(offlineTimeout)
    }
  }, [offlineDelay, onStatusChange, showReconnectionToast, wasOffline])

  // Vérification manuelle
  const handleRetry = async () => {
    setStatus('checking')
    
    try {
      // Tentative de ping vers une URL
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-store'
      })
      
      if (response.ok) {
        setStatus('online')
        if (wasOffline) {
          setShowToast(true)
          setTimeout(() => setShowToast(false), 3000)
        }
        setWasOffline(false)
        onStatusChange?.(true)
      } else {
        throw new Error('Network error')
      }
    } catch {
      setStatus('offline')
      setWasOffline(true)
      onStatusChange?.(false)
    }
  }

  // Mode compact - juste l'icône
  if (compact) {
    return (
      <div className={cn('relative', className)}>
        <AnimatePresence mode="wait">
          {status === 'offline' ? (
            <motion.div
              key="offline"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="p-2 bg-red-100 rounded-full"
              title="Hors ligne"
            >
              <WifiOff className="w-4 h-4 text-red-600" />
            </motion.div>
          ) : status === 'checking' ? (
            <motion.div
              key="checking"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="p-2 bg-yellow-100 rounded-full"
              title="Vérification..."
            >
              <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="online"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="p-2 bg-green-100 rounded-full"
              title="En ligne"
            >
              <Wifi className="w-4 h-4 text-green-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-50',
    bottom: 'fixed bottom-0 left-0 right-0 z-50',
    static: '',
  }

  return (
    <>
      {/* Indicateur de statut */}
      <AnimatePresence>
        {status === 'offline' && (
          <motion.div
            initial={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
            className={cn(
              positionClasses[position],
              'bg-red-600 text-white px-4 py-3 shadow-lg',
              className
            )}
            role="alert"
            aria-live="polite"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WifiOff className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">Vous êtes hors ligne</p>
                  <p className="text-sm text-red-100">
                    Certaines fonctionnalités peuvent être limitées
                  </p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                aria-label="Vérifier la connexion"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Réessayer</span>
              </button>
            </div>
          </motion.div>
        )}

        {status === 'checking' && (
          <motion.div
            initial={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: position === 'top' ? -100 : 100, opacity: 0 }}
            className={cn(
              positionClasses[position],
              'bg-yellow-500 text-white px-4 py-3 shadow-lg',
              className
            )}
            role="status"
          >
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />
              <p className="font-medium">Vérification de la connexion...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast de reconnexion */}
      <AnimatePresence>
        {showToast && showReconnectionToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'fixed left-1/2 -translate-x-1/2 z-50',
              position === 'top' ? 'top-20' : 'bottom-20'
            )}
          >
            <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
              <Wifi className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">Connexion rétablie !</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================
// HOOK PERSONNALISÉ
// ============================================

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setIsOffline(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsOffline(true)
    }

    // État initial
    setIsOnline(navigator.onLine)
    setIsOffline(!navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, isOffline }
}

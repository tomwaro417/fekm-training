'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// TYPES
// ============================================

export interface SearchResult {
  id: string;
  name: string;
  type: 'technique' | 'module' | 'belt';
  description?: string;
  beltColor?: string;
  moduleCode?: string;
  beltName?: string;
  url: string;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
}

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

// ============================================
// HOOK useSearch
// ============================================

export function useSearch(debounceMs: number = 300) {
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    isLoading: false,
    error: null,
  });
  
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Nettoyer le cache expiré
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    for (const [key, entry] of cacheRef.current.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

  // Effectuer la recherche
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, results: [], isLoading: false, error: null }));
      return;
    }

    const trimmedQuery = query.trim().toLowerCase();

    // Vérifier le cache
    cleanExpiredCache();
    const cachedEntry = cacheRef.current.get(trimmedQuery);
    if (cachedEntry) {
      setState(prev => ({
        ...prev,
        results: cachedEntry.results,
        isLoading: false,
        error: null,
      }));
      return;
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(trimmedQuery)}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();
      
      // Mettre en cache les résultats
      cacheRef.current.set(trimmedQuery, {
        results: data.results,
        timestamp: Date.now(),
      });

      setState(prev => ({
        ...prev,
        results: data.results,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      setState(prev => ({
        ...prev,
        results: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      }));
    }
  }, [cleanExpiredCache]);

  // Mettre à jour la requête avec debounce
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));

    // Annuler le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Si la requête est vide, réinitialiser immédiatement
    if (!query.trim()) {
      setState(prev => ({ ...prev, results: [], isLoading: false, error: null }));
      return;
    }

    // Déclencher la recherche après le délai
    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);
  }, [debounceMs, performSearch]);

  // Effacer la recherche
  const clearSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      query: '',
      results: [],
      isLoading: false,
      error: null,
    });
  }, []);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query: state.query,
    results: state.results,
    isLoading: state.isLoading,
    error: state.error,
    setQuery,
    clearSearch,
    performSearch,
  };
}

// ============================================
// HOOK useKeyboardShortcut
// ============================================

export function useKeyboardShortcut(
  keyCombo: { key: string; metaKey?: boolean; ctrlKey?: boolean },
  callback: () => void
) {
  useEffect(() => {
    // Vérifier que keyCombo.key est défini
    if (!keyCombo?.key) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Vérifier que event.key et keyCombo.key sont définis
      if (!event.key || !keyCombo?.key) return;

      const keyMatch = event.key.toLowerCase() === keyCombo.key.toLowerCase();
      const metaMatch = keyCombo.metaKey ? event.metaKey : true;
      const ctrlMatch = keyCombo.ctrlKey ? event.ctrlKey : true;

      if (keyMatch && metaMatch && ctrlMatch) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyCombo, callback]);
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Trophy, BookOpen, Target } from 'lucide-react';
import { useSearch, useKeyboardShortcut, type SearchResult } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

// ============================================
// COMPOSANT: SearchBar
// ============================================

export function SearchBar({ className, placeholder = 'Rechercher...' }: SearchBarProps) {
  const router = useRouter();
  const { query, results, isLoading, error, setQuery, clearSearch } = useSearch(300);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Réinitialiser la sélection quand les résultats changent
  useEffect(() => {
    setSelectedIndex(results.length > 0 ? 0 : -1);
  }, [results]);

  // Ouvrir la recherche avec Cmd+K / Ctrl+K
  const openSearch = useCallback(() => {
    setIsOpen(true);
    inputRef.current?.focus();
  }, []);

  useKeyboardShortcut({ key: 'k', metaKey: true }, openSearch);
  useKeyboardShortcut({ key: 'k', ctrlKey: true }, openSearch);

  // Fermer la recherche
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setSelectedIndex(-1);
    clearSearch();
  }, [clearSearch]);

  // Sélectionner un résultat
  const handleSelectResult = useCallback((result: SearchResult) => {
    router.push(result.url);
    closeSearch();
  }, [router, closeSearch]);

  // Sélectionner le résultat actuellement surligné (ou le premier par défaut)
  const selectCurrentResult = useCallback(() => {
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    if (results[index]) {
      handleSelectResult(results[index]);
    }
  }, [results, selectedIndex, handleSelectResult]);

  // Navigation clavier dans les résultats
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        event.preventDefault();
        selectCurrentResult();
        break;
      case 'Escape':
        event.preventDefault();
        closeSearch();
        break;
    }
  }, [results, selectedIndex, closeSearch, selectCurrentResult]);

  // Fermer au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeSearch();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeSearch]);

  // Grouper les résultats par type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const groupOrder: Array<'technique' | 'module' | 'belt'> = ['technique', 'module', 'belt'];
  const groupLabels = {
    technique: 'Techniques',
    module: 'Modules',
    belt: 'Ceintures',
  };
  const groupIcons = {
    technique: Target,
    module: BookOpen,
    belt: Trophy,
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-2 bg-gray-100 border border-transparent rounded-lg',
            'text-sm text-gray-900 placeholder-gray-500',
            'focus:bg-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20',
            'transition-all duration-200'
          )}
        />
        
        {/* Raccourci clavier ou bouton effacer */}
        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        ) : (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-200 rounded">
              Ctrl K
            </kbd>
          </div>
        )}
      </div>

      {/* Dropdown des résultats */}
      {isOpen && (query.trim() || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[60vh] flex flex-col">
          {/* Header fixe */}
          <div className="flex-shrink-0 flex items-center justify-end px-3 py-2 border-b border-gray-100">
            <button
              onClick={closeSearch}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* État de chargement */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
              </div>
            )}

            {/* Erreur */}
            {error && !isLoading && (
              <div className="px-4 py-6 text-center">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Aucun résultat */}
            {!isLoading && !error && query.trim() && results.length === 0 && (
              <div className="px-4 py-6 text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aucun résultat pour &quot;{query}&quot;</p>
              </div>
            )}

            {/* Liste des résultats groupés */}
            {!isLoading && !error && results.length > 0 && (
              <div className="py-2">
                {groupOrder.map((groupType) => {
                  const groupResults = groupedResults[groupType];
                  if (!groupResults || groupResults.length === 0) return null;

                  const GroupIcon = groupIcons[groupType];
                  let globalIndex = 0;
                  
                  // Calculer l'index global pour la navigation
                  for (const type of groupOrder) {
                    if (type === groupType) break;
                    globalIndex += groupedResults[type]?.length || 0;
                  }

                  return (
                    <div key={groupType} className="mb-2 last:mb-0">
                      {/* En-tête du groupe */}
                      <div className="px-4 py-2 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <GroupIcon className="w-4 h-4" />
                        {groupLabels[groupType]}
                      </div>

                      {/* Résultats du groupe */}
                      {groupResults.map((result, idx) => {
                        const currentGlobalIndex = globalIndex + idx;
                        const isSelected = currentGlobalIndex === selectedIndex;

                        return (
                          <button
                            key={result.id}
                            onClick={() => handleSelectResult(result)}
                            onMouseEnter={() => setSelectedIndex(currentGlobalIndex)}
                            className={cn(
                              'w-full px-4 py-3 flex items-start gap-3 text-left transition-colors',
                              isSelected ? 'bg-yellow-50' : 'hover:bg-gray-50'
                            )}
                          >
                            {/* Indicateur de couleur pour les ceintures */}
                            {result.beltColor && (
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                                style={{ backgroundColor: result.beltColor }}
                              />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                'font-medium truncate',
                                isSelected ? 'text-yellow-900' : 'text-gray-900'
                              )}>
                                {result.name}
                              </div>
                              
                              {/* Description ou métadonnées */}
                              {(result.description || result.moduleCode || result.beltName) && (
                                <div className="text-sm text-gray-500 truncate">
                                  {result.description || (
                                    result.moduleCode && result.beltName
                                      ? `${result.moduleCode} • ${result.beltName}`
                                      : result.moduleCode || result.beltName
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Flèche pour l'élément sélectionné */}
                            {isSelected && (
                              <div className="text-yellow-600 text-sm">↵</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer fixe */}
          <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 opacity-75">
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-gray-600">↑↓</kbd>
                <span>naviguer</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectCurrentResult}
                disabled={results.length === 0}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white border border-gray-200 hover:bg-gray-100 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <kbd className="px-1 py-0.5 rounded text-gray-600">↵</kbd>
                <span>sélectionner</span>
              </button>
              <button
                onClick={closeSearch}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors"
              >
                <kbd className="px-1 py-0.5 rounded text-gray-600">esc</kbd>
                <span>fermer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT: SearchTrigger (pour mobile/header)
// ============================================

interface SearchTriggerProps {
  className?: string;
}

export function SearchTrigger({ className }: SearchTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-900 transition-colors',
          className
        )}
      >
        <Search className="w-5 h-5" />
        <span className="hidden lg:inline text-sm">Rechercher</span>
        <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-gray-400 bg-gray-100 rounded">
          Ctrl K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <SearchBar 
              placeholder="Rechercher une technique, un module..."
              className="w-full"
            />
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}

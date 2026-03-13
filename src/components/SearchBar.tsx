'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Trophy, BookOpen, Target, Command } from 'lucide-react';
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
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        closeSearch();
        break;
    }
  }, [results, selectedIndex, closeSearch]);

  // Sélectionner un résultat
  const handleSelectResult = useCallback((result: SearchResult) => {
    router.push(result.url);
    closeSearch();
  }, [router, closeSearch]);

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
              <Command className="w-3 h-3 mr-0.5" />
              K
            </kbd>
          </div>
        )}
      </div>

      {/* Dropdown des résultats */}
      {isOpen && (query.trim() || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
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

          {/* Pied de page avec astuce */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-gray-600">↑↓</kbd>
                <span>naviguer</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border rounded text-gray-600">↵</kbd>
                <span>sélectionner</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border rounded text-gray-600">esc</kbd>
              <span>fermer</span>
            </span>
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
          <Command className="w-3 h-3 mr-0.5" />
          K
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

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, 
  ChevronLeft, 
  Trophy, 
  Target,
  Play,
  FileText,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Belt {
  id: string;
  name: string;
  color: string;
}

enum TechniqueCategory {
  FRAPPE = 'FRAPPE',
  DEFENSE = 'DEFENSE',
  PROJECTION = 'PROJECTION',
  CLE = 'CLE',
  AU_SOL = 'AU_SOL',
  ARME_BLANCHE = 'ARME_BLANCHE',
  ARME_A_FEU = 'ARME_A_FEU',
  DEFENSE_SUR_LE_SOL = 'DEFENSE_SUR_LE_SOL',
}

interface Technique {
  id: string;
  name: string;
  category: TechniqueCategory;
  description: string;
  instructions: string;
  keyPoints: string[];
  order: number;
  _count: {
    videos: number;
  };
}

interface Module {
  id: string;
  code: string;
  name: string;
  description: string;
  belt: Belt;
  techniques: Technique[];
}

// ============================================
// HELPERS
// ============================================

const getBeltName = (name: string): string => {
  const names: Record<string, string> = {
    'JAUNE': 'Ceinture Jaune',
    'ORANGE': 'Ceinture Orange',
    'VERTE': 'Ceinture Verte',
    'BLEUE': 'Ceinture Bleue',
    'MARRON': 'Ceinture Marron',
    'NOIRE_1': 'Ceinture Noire 1er Darga',
  };
  return names[name] || name;
};

const getCategoryLabel = (category: TechniqueCategory): string => {
  const labels: Record<TechniqueCategory, string> = {
    'FRAPPE': 'Frappe',
    'DEFENSE': 'Défense',
    'PROJECTION': 'Projection',
    'CLE': 'Clé',
    'AU_SOL': 'Au sol',
    'ARME_BLANCHE': 'Arme blanche',
    'ARME_A_FEU': 'Arme à feu',
    'DEFENSE_SUR_LE_SOL': 'Défense au sol',
  };
  return labels[category] || category;
};

const getCategoryColor = (category: TechniqueCategory): { bg: string; text: string; border: string } => {
  const colors: Record<TechniqueCategory, { bg: string; text: string; border: string }> = {
    'FRAPPE': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'DEFENSE': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'PROJECTION': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'CLE': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'AU_SOL': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    'ARME_BLANCHE': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    'ARME_A_FEU': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'DEFENSE_SUR_LE_SOL': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  };
  return colors[category] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
};

// ============================================
// COMPONENTS
// ============================================

function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: '#FFD700' }}
        />
        <p className="text-gray-500 text-sm">Chargement du module...</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Module non trouvé</h2>
        <p className="text-gray-600 mb-6">
          Le module que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <Link
          href="/ceintures"
          className="inline-flex items-center justify-center px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-xl hover:bg-yellow-400 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Retour aux ceintures
        </Link>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ModuleDetailPage() {
  const params = useParams();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModule = async () => {
    if (!params.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/modules/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setModule(null);
          return;
        }
        throw new Error('Erreur lors du chargement du module');
      }

      const data = await response.json();
      setModule(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModule();
  }, [params.id]);

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} onRetry={fetchModule} />;
  }

  // Not found state
  if (!module) {
    return <NotFoundState />;
  }

  const beltColor = module.belt.color;
  const sortedTechniques = [...module.techniques].sort((a, b) => a.order - b.order);
  const totalVideos = sortedTechniques.reduce((sum, t) => sum + t._count.videos, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back links */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/ceintures"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Ceintures
          </Link>
          <span className="text-gray-300">/</span>
          <Link 
            href={`/ceintures/${module.belt.id}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            {getBeltName(module.belt.name)}
          </Link>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Top banner with belt color */}
          <div 
            className="h-24 md:h-32"
            style={{ backgroundColor: beltColor }}
          />
          
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1">
                {/* Module code badge */}
                <div 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mb-4"
                  style={{ 
                    backgroundColor: `${beltColor}20`,
                    color: beltColor
                  }}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {module.code}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {module.name}
                </h1>

                {/* Description */}
                {module.description && (
                  <p className="text-lg text-gray-600 max-w-3xl">
                    {module.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">
                    {sortedTechniques.length}
                  </div>
                  <div className="text-sm text-gray-500">Techniques</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">
                    {totalVideos}
                  </div>
                  <div className="text-sm text-gray-500">Vidéos</div>
                </div>
              </div>
            </div>

            {/* Parent belt link */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <Link
                href={`/ceintures/${module.belt.id}`}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <Trophy className="w-4 h-4 mr-2" style={{ color: beltColor }} />
                Partie de la {getBeltName(module.belt.name)}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Techniques List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Techniques ({sortedTechniques.length})
            </h2>
          </div>

          {sortedTechniques.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedTechniques.map((technique) => {
                const categoryStyle = getCategoryColor(technique.category);
                const hasVideos = technique._count.videos > 0;

                return (
                  <Link
                    key={technique.id}
                    href={`/techniques/${technique.id}`}
                    className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-start gap-4">
                      {/* Order indicator */}
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm"
                        style={{ 
                          backgroundColor: `${beltColor}15`,
                          color: beltColor
                        }}
                      >
                        {technique.order}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {/* Category badge */}
                            <span 
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                            >
                              {getCategoryLabel(technique.category)}
                            </span>

                            {/* Technique name */}
                            <h3 className="text-lg font-semibold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">
                              {technique.name}
                            </h3>
                          </div>

                          {/* Video indicator */}
                          {hasVideos && (
                            <div 
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${beltColor}15`,
                                color: beltColor
                              }}
                            >
                              <Play className="w-3 h-3" />
                              {technique._count.videos}
                            </div>
                          )}
                        </div>

                        {/* Description preview */}
                        {technique.description && (
                          <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                            {technique.description}
                          </p>
                        )}

                        {/* Key points preview */}
                        {technique.keyPoints && technique.keyPoints.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {technique.keyPoints.slice(0, 2).map((point, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                {point.length > 40 ? point.substring(0, 40) + '...' : point}
                              </span>
                            ))}
                            {technique.keyPoints.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{technique.keyPoints.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transform group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
              <Target className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune technique disponible
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Ce module ne contient pas encore de techniques. Revenez plus tard pour découvrir le contenu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, BookOpen, Play, CheckCircle, Target } from 'lucide-react';

interface Technique {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  keyPoints: string[];
  category: string;
  order: number;
}

interface Module {
  id: string;
  code: string;
  name: string;
  description: string | null;
  belt: {
    id: string;
    name: string;
    color: string;
  };
  techniques: Technique[];
}

const categoryLabels: Record<string, string> = {
  'FRAPPE_DE_FACE': 'Frappe de face',
  'FRAPPE_DE_COTE': 'Frappe de côté',
  'SAISISSEMENTS': 'Saisies',
  'DEFENSES_SUR_ATTAQUES_PONCTUELLES': 'Défenses ponctuelles',
  'STRANGULATIONS': 'Étranglements',
  'DEFENSES_SUR_ATTAQUES_CIRCULAIRES': 'Défenses circulaires',
  'ATTAQUES_AU_SOL': 'Techniques au sol',
  'ATTAQUES_AVEC_ARMES_BLANCHES': 'Armes blanches',
  'ATTAQUES_AVEC_BATON': 'Bâton',
  'ATTAQUES_AVEC_ARMES_A_FEU': 'Armes à feu',
  'AUTRES': 'Autres',
};

export default function ModuleDetailPage() {
  const params = useParams();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/modules/${params.id}`)
        .then(res => res.json())
        .then(data => {
          setModule(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Module non trouvé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link 
          href={`/ceintures/${module.belt.id}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Retour à {module.belt.name === 'JAUNE' ? 'la ceinture Jaune' : 
                    module.belt.name === 'ORANGE' ? 'la ceinture Orange' :
                    module.belt.name === 'VERTE' ? 'la ceinture Verte' :
                    module.belt.name === 'BLEUE' ? 'la ceinture Bleue' :
                    module.belt.name === 'MARRON' ? 'la ceinture Marron' : 
                    'la ceinture Noire'}
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div 
            className="h-24 md:h-32"
            style={{ backgroundColor: module.belt.color }}
          />
          <div className="p-6 md:p-8">
            <div className="flex items-center space-x-3 -mt-12 md:-mt-14 mb-4">
              <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl shadow-lg flex items-center justify-center"
                style={{ backgroundColor: module.belt.color }}
              >
                <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <div className="pt-4">
                <div className="text-sm font-medium" style={{ color: module.belt.color }}>
                  {module.code}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {module.name}
                </h1>
              </div>
            </div>
            {module.description && (
              <p className="text-gray-600 text-lg">
                {module.description}
              </p>
            )}
          </div>
        </div>

        {/* Techniques */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Techniques ({module.techniques?.length || 0})
          </h2>

          {module.techniques && module.techniques.length > 0 ? (
            <div className="space-y-4">
              {module.techniques
                .sort((a, b) => a.order - b.order)
                .map((technique) => (
                <div
                  key={technique.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                          {categoryLabels[technique.category] || technique.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {technique.name}
                      </h3>
                      {technique.description && (
                        <p className="text-gray-600 mb-3">
                          {technique.description}
                        </p>
                      )}
                      {technique.instructions && (
                        <div className="bg-blue-50 rounded-lg p-4 mb-3">
                          <h4 className="text-sm font-semibold text-blue-900 mb-1">Instructions</h4>
                          <p className="text-blue-800 text-sm">{technique.instructions}</p>
                        </div>
                      )}
                      {technique.keyPoints && technique.keyPoints.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-gray-700">Points clés</h4>
                          <ul className="space-y-1">
                            {technique.keyPoints.map((point, idx) => (
                              <li key={idx} className="flex items-start text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <button
                      className="ml-4 flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      title="Voir la vidéo"
                    >
                      <Play className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucune technique disponible pour ce module.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

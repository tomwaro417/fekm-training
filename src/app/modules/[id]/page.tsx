'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, BookOpen, Play, CheckCircle, Target, Upload, X } from 'lucide-react';

interface Technique {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  keyPoints: string[];
  category: string;
  order: number;
  progress?: 'NON_ACQUIS' | 'EN_COURS_DAPPRENTISSAGE' | 'ACQUIS' | 'MAITRISE';
  videos?: { id: string; slot: 'DEBUTANT' | 'PROGRESSION' }[];
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

type ProgressLevel = 'NON_ACQUIS' | 'EN_COURS_DAPPRENTISSAGE' | 'ACQUIS' | 'MAITRISE';

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

const progressLabels: Record<ProgressLevel, { label: string; color: string; bg: string }> = {
  'NON_ACQUIS': { label: 'Pas encore vu', color: 'text-gray-600', bg: 'bg-gray-100' },
  'EN_COURS_DAPPRENTISSAGE': { label: 'Vu', color: 'text-blue-600', bg: 'bg-blue-100' },
  'ACQUIS': { label: 'Connais', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  'MAITRISE': { label: 'Maîtrise', color: 'text-green-600', bg: 'bg-green-100' },
};

export default function ModuleDetailPage() {
  const params = useParams();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<'DEBUTANT' | 'PROGRESSION'>('DEBUTANT');

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id]);

  async function loadData() {
    try {
      // Charger le module
      const moduleRes = await fetch(`/api/modules/${params.id}`);
      const moduleData = await moduleRes.json();

      // Charger la progression
      const progressRes = await fetch(`/api/modules/${params.id}/progress`);
      let progressData: Record<string, string> = {};
      if (progressRes.ok) {
        progressData = await progressRes.json();
      }

      // Fusionner les données
      const techniquesWithProgress = moduleData.techniques.map((t: Technique) => ({
        ...t,
        progress: progressData[t.id] || 'NON_ACQUIS',
      }));

      setModule({ ...moduleData, techniques: techniquesWithProgress });
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setLoading(false);
    }
  }

  async function updateProgress(techniqueId: string, level: ProgressLevel) {
    setUpdating(techniqueId);
    try {
      const res = await fetch(`/api/modules/${params.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ techniqueId, level }),
      });

      if (res.ok) {
        // Mettre à jour localement
        setModule(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            techniques: prev.techniques.map(t =>
              t.id === techniqueId ? { ...t, progress: level } : t
            ),
          };
        });
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    }
    setUpdating(null);
  }

  async function uploadVideo(techniqueId: string, file: File, slot: 'DEBUTANT' | 'PROGRESSION') {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('techniqueId', techniqueId);
    formData.append('slot', slot);

    try {
      const res = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowVideoModal(null);
        loadData(); // Recharger pour voir la vidéo
      }
    } catch (error) {
      console.error('Erreur upload:', error);
    }
  }

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
                .map((technique) => {
                  const progress = progressLabels[technique.progress || 'NON_ACQUIS'];
                  return (
                    <div
                      key={technique.id}
                      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header avec catégorie et progression */}
                          <div className="flex items-center space-x-3 mb-3 flex-wrap gap-2">
                            <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                              {categoryLabels[technique.category] || technique.category}
                            </span>
                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${progress.bg} ${progress.color}`}>
                              {progress.label}
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
                            <div className="space-y-1 mb-4">
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

                          {/* Sélecteur de progression */}
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Niveau de maîtrise :
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {(['NON_ACQUIS', 'EN_COURS_DAPPRENTISSAGE', 'ACQUIS', 'MAITRISE'] as ProgressLevel[]).map((level) => (
                                <button
                                  key={level}
                                  onClick={() => updateProgress(technique.id, level)}
                                  disabled={updating === technique.id}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    technique.progress === level
                                      ? `${progressLabels[level].bg} ${progressLabels[level].color} ring-2 ring-offset-1 ring-gray-300`
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {progressLabels[level].label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Boutons vidéo */}
                        <div className="ml-4 flex flex-col space-y-2">
                          <button
                            onClick={() => setShowVideoModal(technique.id)}
                            className="w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                            title="Uploader une vidéo"
                          >
                            <Upload className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucune technique disponible pour ce module.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal upload vidéo */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ajouter une vidéo</h3>
              <button
                onClick={() => setShowVideoModal(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Type de vidéo
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedSlot('DEBUTANT')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedSlot === 'DEBUTANT'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Débutant
                  </button>
                  <button
                    onClick={() => setSelectedSlot('PROGRESSION')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedSlot === 'PROGRESSION'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Progression
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Fichier vidéo
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && showVideoModal) {
                      uploadVideo(showVideoModal, file, selectedSlot);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <p className="text-xs text-gray-500">
                Formats acceptés : MP4, MOV, AVI (max 100MB)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ChevronLeft, BookOpen, Target } from 'lucide-react';

interface Module {
  id: string;
  code: string;
  name: string;
  description: string | null;
  order: number;
}

interface Belt {
  id: string;
  name: string;
  color: string;
  order: number;
  description: string | null;
  modules: Module[];
}

export default function BeltDetailPage() {
  const params = useParams();
  const [belt, setBelt] = useState<Belt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/belts/${params.id}`)
        .then(res => res.json())
        .then(data => {
          setBelt(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [params.id]);

  const getBeltName = (name: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
      </div>
    );
  }

  if (!belt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Ceinture non trouvée</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link 
          href="/ceintures"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Retour aux ceintures
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div 
            className="h-32 md:h-48"
            style={{ backgroundColor: belt.color }}
          />
          <div className="p-6 md:p-8">
            <div className="flex items-center space-x-4 -mt-16 md:-mt-20 mb-4">
              <div 
                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl shadow-xl flex items-center justify-center"
                style={{ backgroundColor: belt.color }}
              >
                <Trophy className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {getBeltName(belt.name)}
            </h1>
            <p className="text-lg text-gray-600">
              {belt.description || 'Découvrez tous les modules et techniques de cette ceinture.'}
            </p>
          </div>
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Modules ({belt.modules?.length || 0})
          </h2>

          {belt.modules && belt.modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {belt.modules.sort((a, b) => a.order - b.order).map((module) => (
                <Link
                  key={module.id}
                  href={`/modules/${module.id}`}
                  className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 group"
                >
                  <div className="flex items-start space-x-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${belt.color}20` }}
                    >
                      <BookOpen 
                        className="w-6 h-6"
                        style={{ color: belt.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">{module.code}</div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {module.name}
                      </h3>
                      {module.description && (
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun module disponible pour cette ceinture.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

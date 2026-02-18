'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, ChevronRight } from 'lucide-react';

interface Belt {
  id: string;
  name: string;
  color: string;
  order: number;
  description: string | null;
}

export default function BeltsPage() {
  const [belts, setBelts] = useState<Belt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/belts')
      .then(res => res.json())
      .then(data => {
        setBelts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Les ceintures FEKM
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez les différents niveaux de progression en Krav Maga.
            Chaque ceinture représente une étape importante dans votre parcours.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {belts.sort((a, b) => a.order - b.order).map((belt, index) => (
              <Link
                key={belt.id}
                href={`/ceintures/${belt.id}`}
                className="block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="flex flex-col md:flex-row items-stretch">
                  {/* Color bar */}
                  <div 
                    className="w-full md:w-4 h-2 md:h-auto"
                    style={{ backgroundColor: belt.color }}
                  />
                  
                  {/* Content */}
                  <div className="flex-1 p-6 md:p-8 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: belt.color }}
                      >
                        <Trophy className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          Niveau {index + 1}
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                          {getBeltName(belt.name)}
                        </h2>
                        <p className="text-gray-600 mt-1">
                          {belt.description || 'Cliquez pour voir les modules et techniques'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="hidden md:flex items-center text-gray-400 group-hover:text-yellow-600 transition-colors">
                      <span className="mr-2 font-medium">Explorer</span>
                      <ChevronRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

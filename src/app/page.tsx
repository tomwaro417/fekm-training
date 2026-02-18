'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Shield, Target, Zap } from 'lucide-react';

interface Belt {
  id: string;
  name: string;
  color: string;
  order: number;
  description: string | null;
}

export default function Home() {
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

  const getBeltGradient = (color: string) => {
    const colors: Record<string, string> = {
      '#FFD700': 'from-yellow-300 to-yellow-500',
      '#FFA500': 'from-orange-300 to-orange-500',
      '#228B22': 'from-green-400 to-green-600',
      '#1E90FF': 'from-blue-400 to-blue-600',
      '#8B4513': 'from-amber-600 to-amber-800',
      '#000000': 'from-gray-700 to-gray-900',
    };
    return colors[color] || 'from-gray-400 to-gray-600';
  };

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Shield className="w-16 h-16 text-yellow-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Maîtrisez votre{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                progression
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Application officielle de la FEKM pour suivre votre évolution en Krav Maga. 
              Accédez à toutes les techniques, module par module.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/ceintures"
                className="inline-flex items-center justify-center px-8 py-4 bg-yellow-500 text-gray-900 font-bold rounded-xl hover:bg-yellow-400 transition-all transform hover:scale-105"
              >
                <Trophy className="w-5 h-5 mr-2" />
                Explorer les ceintures
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
              >
                <Target className="w-5 h-5 mr-2" />
                Mon dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Belts Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Les ceintures FEKM
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Progression officielle de la Fédération Européenne de Krav Maga. 
              Chaque ceinture représente un niveau de maîtrise distinct.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {belts.sort((a, b) => a.order - b.order).map((belt) => (
                <Link
                  key={belt.id}
                  href={`/ceintures/${belt.id}`}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className={`h-2 bg-gradient-to-r ${getBeltGradient(belt.color)}`} />
                  <div className="p-8">
                    <div 
                      className="w-16 h-16 rounded-xl mb-6 flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: belt.color }}
                    >
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {getBeltName(belt.name)}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {belt.description || 'Cliquez pour découvrir les modules et techniques de cette ceinture.'}
                    </p>
                    <div className="flex items-center text-yellow-600 font-semibold group-hover:text-yellow-700">
                      <span>Voir les modules</span>
                      <Zap className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités
            </h2>
            <p className="text-lg text-gray-600">
              Tout ce dont vous avez besoin pour progresser
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gray-50">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Suivi de progression</h3>
              <p className="text-gray-600">Suivez votre avancement technique ceinture par ceinture.</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gray-50">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Techniques détaillées</h3>
              <p className="text-gray-600">Accédez à toutes les techniques avec descriptions et points clés.</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gray-50">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Vidéos personnelles</h3>
              <p className="text-gray-600">Enregistrez vos propres vidéos pour suivre votre évolution.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

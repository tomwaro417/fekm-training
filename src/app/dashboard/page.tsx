'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Trophy, 
  Target, 
  TrendingUp,
  Clock,
  ChevronRight
} from 'lucide-react';

interface Progress {
  id: string;
  level: string;
  technique: {
    name: string;
    category: string;
    module: {
      code: string;
      belt: {
        name: string;
        color: string;
      };
    };
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetch('/api/progress')
        .then(res => res.json())
        .then(data => {
          setProgress(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
      </div>
    );
  }

  const stats = {
    total: progress.length,
    nonAcquis: progress.filter(p => p.level === 'NON_ACQUIS').length,
    enCours: progress.filter(p => p.level === 'EN_COURS_DAPPRENTISSAGE').length,
    acquis: progress.filter(p => p.level === 'ACQUIS').length,
    maitrise: progress.filter(p => p.level === 'MAITRISE').length,
  };

  const levelLabels: Record<string, string> = {
    NON_ACQUIS: 'Non acquis',
    EN_COURS_DAPPRENTISSAGE: 'En cours',
    ACQUIS: 'Acquis',
    MAITRISE: 'Maîtrisé',
  };

  const levelColors: Record<string, string> = {
    NON_ACQUIS: 'bg-gray-100 text-gray-700',
    EN_COURS_DAPPRENTISSAGE: 'bg-yellow-100 text-yellow-700',
    ACQUIS: 'bg-blue-100 text-blue-700',
    MAITRISE: 'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bonjour, {session?.user?.name || session?.user?.email}
          </h1>
          <p className="text-gray-600">
            Voici votre progression dans l&apos;apprentissage du Krav Maga.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Techniques</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.enCours}</p>
                <p className="text-sm text-gray-600">En cours</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.acquis + stats.maitrise}</p>
                <p className="text-sm text-gray-600">Acquis</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {session?.user?.beltName || 'Non assigné'}
                </p>
                <p className="text-sm text-gray-600">Ceinture</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Progress */}
        <div className="bg-white rounded-2xl shadow-md">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Progression récente
            </h2>
          </div>

          {progress.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {progress.slice(0, 10).map((p) => (
                <div key={p.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${p.technique.module.belt.color}20` }}
                    >
                      <Trophy 
                        className="w-5 h-5"
                        style={{ color: p.technique.module.belt.color }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.technique.name}</h3>
                      <p className="text-sm text-gray-600">
                        {p.technique.module.code} · {p.technique.module.belt.name}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelColors[p.level]}`}>
                    {levelLabels[p.level]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Vous n&apos;avez pas encore de progression enregistrée.</p>
              <Link
                href="/ceintures"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Commencer à apprendre
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

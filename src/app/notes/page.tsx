'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  StickyNote, 
  Loader2, 
  AlertCircle, 
  Trophy,
  BookOpen,
  Target,
  ChevronRight,
  Trash2,
  Edit3,
  X,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNotes, type PersonalNote } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

type GroupBy = 'belt' | 'module';

interface GroupedNotes {
  [key: string]: {
    label: string;
    color?: string;
    notes: PersonalNote[];
  };
}

// ============================================
// COMPOSANT: NoteCard
// ============================================

function NoteCard({ 
  note, 
  onDelete 
}: { 
  note: PersonalNote; 
  onDelete: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    onDelete(note.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* En-tête */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
        style={{ backgroundColor: `${note.beltColor}08` }}
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: note.beltColor }}
          />
          <span className="text-sm font-medium text-gray-700">{note.beltName}</span>
          <span className="text-gray-300">•</span>
          <span className="text-sm text-gray-500">{note.moduleCode}</span>
        </div>
        <div className="flex items-center space-x-1">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center space-x-1">
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded"
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        <Link 
          href={`/techniques/${note.techniqueId}`}
          className="group"
        >
          <h4 className="font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors flex items-center">
            <Target className="w-4 h-4 mr-2 text-gray-400" />
            {note.techniqueName}
            <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h4>
        </Link>

        <div className="mt-3">
          <p 
            className={cn(
              "text-gray-600 text-sm whitespace-pre-wrap",
              !isExpanded && "line-clamp-3"
            )}
          >
            {note.content}
          </p>
          {note.content.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-xs text-yellow-600 hover:text-yellow-700 font-medium"
            >
              {isExpanded ? 'Voir moins' : 'Voir plus'}
            </button>
          )}
        </div>

        <div className="mt-3 text-xs text-gray-400">
          Modifiée le {new Date(note.updatedAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPOSANT: EmptyState
// ============================================

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <StickyNote className="w-10 h-10 text-yellow-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Aucune note pour le moment
      </h3>
      <p className="text-gray-600 max-w-md mx-auto mb-6">
        Prenez des notes sur les techniques que vous apprenez pour mieux retenir les points clés et suivre votre progression.
      </p>
      <Link href="/ceintures">
        <Button>
          <Trophy className="w-4 h-4 mr-2" />
          Explorer les ceintures
        </Button>
      </Link>
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function NotesPage() {
  const { data: session, status } = useSession();
  const { notes, isLoading, error, fetchAllNotes, deleteNote } = useNotes();
  const [groupBy, setGroupBy] = useState<GroupBy>('belt');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Charger les notes au montage
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAllNotes();
    }
  }, [status, fetchAllNotes]);

  // Gérer la suppression
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteNote(id);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrer les notes par recherche
  const filteredNotes = notes.filter(note => 
    searchQuery.trim() === '' ||
    note.techniqueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.moduleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.beltName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grouper les notes
  const groupedNotes = filteredNotes.reduce((acc, note) => {
    const key = groupBy === 'belt' ? note.beltName : note.moduleCode;
    
    if (!acc[key]) {
      acc[key] = {
        label: groupBy === 'belt' ? note.beltName : `${note.moduleCode} - ${note.beltName}`,
        color: note.beltColor,
        notes: [],
      };
    }
    
    acc[key].notes.push(note);
    return acc;
  }, {} as GroupedNotes);

  // Trier les groupes
  const sortedGroups = Object.entries(groupedNotes).sort((a, b) => {
    // Si groupement par ceinture, trier par ordre des ceintures
    if (groupBy === 'belt') {
      const beltOrder = ['JAUNE', 'ORANGE', 'VERTE', 'BLEUE', 'MARRON', 'NOIRE'];
      const indexA = beltOrder.findIndex(b => a[0].toUpperCase().includes(b));
      const indexB = beltOrder.findIndex(b => b[0].toUpperCase().includes(b));
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    }
    return a[0].localeCompare(b[0]);
  });

  // État de chargement
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
          <p className="text-gray-600">Chargement de vos notes...</p>
        </div>
      </div>
    );
  }

  // Non authentifié
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <StickyNote className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connectez-vous pour voir vos notes
          </h2>
          <p className="text-gray-600 mb-6">
            Vos notes personnelles sur les techniques sont sauvegardées et accessibles après connexion.
          </p>
          <Link href="/login">
            <Button>
              Se connecter
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <StickyNote className="w-8 h-8 mr-3 text-yellow-500" />
                Mes Notes
              </h1>
              <p className="mt-2 text-gray-600">
                {notes.length} note{notes.length > 1 ? 's' : ''} sur vos techniques
              </p>
            </div>

            {/* Contrôles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Barre de recherche */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans mes notes..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                />
              </div>

              {/* Groupement */}
              <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setGroupBy('belt')}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center',
                    groupBy === 'belt' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Trophy className="w-4 h-4 mr-1.5" />
                  Par ceinture
                </button>
                <button
                  onClick={() => setGroupBy('module')}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center',
                    groupBy === 'module' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  Par module
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Contenu */}
        {notes.length === 0 ? (
          <EmptyState />
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune note ne correspond à votre recherche
            </h3>
            <p className="text-gray-600">
              Essayez avec d&apos;autres termes ou effacez la recherche
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Effacer la recherche
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedGroups.map(([groupKey, group]) => (
              <section key={groupKey}>
                {/* En-tête du groupe */}
                <div className="flex items-center space-x-3 mb-4">
                  {group.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                  )}
                  <h2 className="text-xl font-semibold text-gray-900">{group.label}</h2>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {group.notes.length}
                  </span>
                </div>

                {/* Grille de notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.notes
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onDelete={handleDelete}
                      />
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

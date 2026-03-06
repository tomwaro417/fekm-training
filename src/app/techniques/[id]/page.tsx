'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Trophy, 
  BookOpen, 
  Target, 
  CheckCircle, 
  AlertCircle, 
  Play,
  Video,
  Upload,
  Lightbulb,
  ListOrdered,
  FileText,
  ChevronRight as ChevronRightIcon,
  Loader2,
  Save,
  Info,
  Download,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VideoUploader } from '@/components/training/VideoUploader';
import { 
  type Technique, 
  type Module,
  type UserTechniqueProgress, 
  type TechniqueVideo,
  type UserTechniqueVideo,
  type VideoAsset,
  type ProgressLevel,
  type ProgressFormData,
  PROGRESS_LEVELS,
  CATEGORY_LABELS,
  formatDuration
} from '@/types/technique';

// ============================================
// COMPOSANTS
// ============================================

function Breadcrumb({ module, techniqueName }: { module: Module; techniqueName: string }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
      <Link 
        href="/ceintures" 
        className="hover:text-gray-900 transition-colors flex items-center"
      >
        <Trophy className="w-4 h-4 mr-1" />
        Ceintures
      </Link>
      <ChevronRightIcon className="w-4 h-4" />
      <Link 
        href={`/ceintures/${module.belt.id}`}
        className="hover:text-gray-900 transition-colors flex items-center"
        style={{ color: module.belt.color }}
      >
        <span 
          className="w-3 h-3 rounded-full mr-1.5"
          style={{ backgroundColor: module.belt.color }}
        />
        {module.belt.name}
      </Link>
      <ChevronRightIcon className="w-4 h-4" />
      <Link 
        href={`/modules/${module.id}`}
        className="hover:text-gray-900 transition-colors flex items-center"
      >
        <BookOpen className="w-4 h-4 mr-1" />
        {module.code}
      </Link>
      <ChevronRightIcon className="w-4 h-4" />
      <span className="text-gray-900 font-medium truncate max-w-[200px]">
        {techniqueName}
      </span>
    </nav>
  );
}

function ProgressSection({ 
  techniqueId, 
  progress, 
  beltColor,
  onProgressUpdate 
}: { 
  techniqueId: string; 
  progress?: UserTechniqueProgress;
  beltColor: string;
  onProgressUpdate: (progress: UserTechniqueProgress) => void;
}) {
  const [formData, setFormData] = useState<ProgressFormData>({
    level: progress?.level || 'NON_ACQUIS',
    notes: progress?.notes || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Met à jour le formulaire quand la progression change
  useEffect(() => {
    setFormData({
      level: progress?.level || 'NON_ACQUIS',
      notes: progress?.notes || '',
    });
  }, [progress]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          techniqueId,
          level: formData.level,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      const savedProgress = await response.json();
      onProgressUpdate(savedProgress);
      setSaveSuccess(true);
      
      // Cache le message de succès après 3 secondes
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError('Impossible de sauvegarder la progression');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedLevelConfig = PROGRESS_LEVELS.find(l => l.value === formData.level);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${beltColor}15` }}
        >
          <Target className="w-5 h-5" style={{ color: beltColor }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ma progression</h3>
          <p className="text-sm text-gray-500">Suivez votre niveau de maîtrise</p>
        </div>
      </div>

      {/* Sélecteur de niveau */}
      <div className="space-y-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Niveau de maîtrise</label>
        <div className="grid grid-cols-2 gap-3">
          {PROGRESS_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setFormData(prev => ({ ...prev, level: level.value }))}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                formData.level === level.value
                  ? `${level.bgColor} border-current ${level.color}`
                  : 'border-gray-100 hover:border-gray-200 bg-gray-50'
              }`}
            >
              <div className={`font-medium ${formData.level === level.value ? level.color : 'text-gray-700'}`}>
                {level.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Champ notes */}
      <div className="space-y-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Notes personnelles</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Ajoutez vos remarques, points à améliorer..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
        />
      </div>

      {/* Messages */}
      {saveError && (
        <div className="flex items-center space-x-2 text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>{saveError}</span>
        </div>
      )}
      
      {saveSuccess && (
        <div className="flex items-center space-x-2 text-green-600 text-sm mb-4 p-3 bg-green-50 rounded-lg">
          <CheckCircle className="w-4 h-4" />
          <span>Progression sauvegardée !</span>
        </div>
      )}

      {/* Bouton sauvegarder */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full"
        style={{ 
          backgroundColor: beltColor,
        }}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sauvegarde...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder ma progression
          </>
        )}
      </Button>
    </div>
  );
}

function VideoSection({
  videos,
  userVideos,
  beltColor,
  techniqueId,
  onVideoUploaded
}: {
  videos: TechniqueVideo[];
  userVideos: UserTechniqueVideo[];
  beltColor: string;
  techniqueId: string;
  onVideoUploaded: () => void;
}) {
  const coachVideos = videos.filter(v => v.type === 'COACH');
  const demoVideos = videos.filter(v => v.type === 'DEMONSTRATION');

  return (
    <div className="space-y-8">
      {/* Vidéo du Coach - Section dédiée */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" style={{ color: beltColor }} />
          Vidéo du Coach
        </h3>

        {coachVideos.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {coachVideos.map((video, index) => (
              <VideoCard
                key={`coach-${index}`}
                video={video.video}
                label="Démonstration par le coach"
                beltColor={beltColor}
                showDownload={true}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune vidéo du coach disponible pour cette technique.</p>
          </div>
        )}
      </div>

      {/* Vidéos de Démonstration */}
      {demoVideos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Video className="w-5 h-5 mr-2" style={{ color: beltColor }} />
            Démonstrations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoVideos.map((video, index) => (
              <VideoCard
                key={`demo-${index}`}
                video={video.video}
                label={`Démonstration ${index + 1}`}
                beltColor={beltColor}
                showDownload={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Vidéos personnelles */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Upload className="w-5 h-5 mr-2" style={{ color: beltColor }} />
          Mes vidéos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Slot débutant */}
          <PersonalVideoSlot
            type="PERSONAL_BEGINNER"
            label="Vidéo débutant"
            description="Enregistrez votre première tentative"
            userVideos={userVideos}
            beltColor={beltColor}
            techniqueId={techniqueId}
            onVideoUploaded={onVideoUploaded}
          />

          {/* Slot progression */}
          <PersonalVideoSlot
            type="PERSONAL_PROGRESSION"
            label="Vidéo progression"
            description="Comparez vos améliorations"
            userVideos={userVideos}
            beltColor={beltColor}
            techniqueId={techniqueId}
            onVideoUploaded={onVideoUploaded}
          />
        </div>
      </div>
    </div>
  );
}

function VideoCard({
  video,
  label,
  beltColor,
  showDownload = false
}: {
  video: VideoAsset;
  label: string;
  beltColor: string;
  showDownload?: boolean;
}) {
  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/videos/${video.id}/download`);
      if (!response.ok) throw new Error('Erreur lors du téléchargement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = video.title || 'video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      alert('Erreur lors du téléchargement de la vidéo');
    }
  };

  return (
    <div className="group relative bg-gray-900 rounded-xl overflow-hidden">
      {/* Zone vidéo avec aspect ratio */}
      <div className="relative aspect-video cursor-pointer">
        {/* Thumbnail ou placeholder */}
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title || label}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <Play className="w-16 h-16 text-gray-600" />
          </div>
        )}

        {/* Overlay play */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: beltColor }}
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>

        {/* Label */}
        <div className="absolute top-3 left-3">
          <span
            className="px-2 py-1 rounded-lg text-xs font-medium text-white"
            style={{ backgroundColor: beltColor }}
          >
            {label}
          </span>
        </div>

        {/* Duration */}
        {video.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-xs text-white">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Barre d'actions en dessous de la vidéo */}
      {showDownload && video.url && (
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-400 truncate flex-1 mr-4">
            {video.title || 'Vidéo'}
          </span>
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Télécharger
          </button>
        </div>
      )}
    </div>
  );
}

function PersonalVideoSlot({
  type,
  label,
  description,
  userVideos,
  beltColor,
  techniqueId,
  onVideoUploaded
}: {
  type: 'PERSONAL_BEGINNER' | 'PERSONAL_PROGRESSION';
  label: string;
  description: string;
  userVideos: UserTechniqueVideo[];
  beltColor: string;
  techniqueId: string;
  onVideoUploaded: () => void;
}) {
  const [showUploader, setShowUploader] = useState(false);
  const video = userVideos.find(v => v.type === type);

  if (video) {
    return (
      <VideoCard
        video={video.video}
        label={label}
        beltColor={beltColor}
        showDownload={true}
      />
    );
  }

  if (showUploader) {
    return (
      <div className="border-2 border-gray-200 rounded-xl p-4">
        <VideoUploader
          techniqueId={techniqueId}
          videoType={type}
          onUploadSuccess={() => {
            setShowUploader(false);
            onVideoUploaded();
          }}
          onUploadError={(error) => {
            console.error('Erreur upload:', error);
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full"
          onClick={() => setShowUploader(false)}
        >
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-gray-300 transition-colors aspect-video">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: `${beltColor}15` }}
      >
        <Upload className="w-6 h-6" style={{ color: beltColor }} />
      </div>
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      <p className="text-sm text-gray-500">{description}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        style={{ borderColor: beltColor, color: beltColor }}
        onClick={() => setShowUploader(true)}
      >
        Ajouter une vidéo
      </Button>
    </div>
  );
}

// formatDuration is imported from @/types/technique

function NavigationButtons({ 
  currentOrder, 
  moduleId,
  beltColor 
}: { 
  currentOrder: number; 
  moduleId: string;
  beltColor: string;
}) {
  return (
    <div className="flex justify-between items-center pt-8 border-t border-gray-200">
      <Link href="#">
        <Button 
          variant="ghost" 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Technique précédente</span>
          <span className="sm:hidden">Précédent</span>
        </Button>
      </Link>
      
      <Link href={`/modules/${moduleId}`}>
        <Button 
          variant="outline"
          style={{ borderColor: beltColor, color: beltColor }}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Voir le module
        </Button>
      </Link>
      
      <Link href="#">
        <Button 
          variant="ghost" 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <span className="hidden sm:inline">Technique suivante</span>
          <span className="sm:hidden">Suivant</span>
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </Link>
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function TechniqueDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [technique, setTechnique] = useState<Technique | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchTechnique();
    }
  }, [params.id]);

  const fetchTechnique = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/techniques/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Technique non trouvée');
        }
        throw new Error('Erreur lors du chargement');
      }

      const data = await response.json();
      setTechnique(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = (updatedProgress: UserTechniqueProgress) => {
    setTechnique(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        progress: updatedProgress,
      };
    });
  };

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Chargement de la technique...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error || !technique) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Technique non trouvée'}
          </h2>
          <p className="text-gray-600 mb-6">
            Impossible de charger cette technique. Vérifiez l&apos;URL ou retournez à la liste.
          </p>
          <Link href="/ceintures">
            <Button>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour aux ceintures
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const beltColor = technique.module.belt.color;
  const isLoggedIn = !!session;

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Breadcrumb module={technique.module} techniqueName={technique.name} />

        {/* Header avec titre */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {/* Bandeau couleur ceinture */}
          <div 
            className="h-3"
            style={{ backgroundColor: beltColor }}
          />
          
          <div className="p-6 md:p-8">
            {/* Catégorie */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: `${beltColor}15`, color: beltColor }}
              >
                {CATEGORY_LABELS[technique.category]}
              </span>
              {technique.subCategory && (
                <span className="text-gray-400">•</span>
              )}
              {technique.subCategory && (
                <span className="text-sm text-gray-600">
                  {technique.subCategory}
                </span>
              )}
            </div>

            {/* Titre */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {technique.name}
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-600 leading-relaxed">
              {technique.description}
            </p>

            {/* Métadonnées */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500">
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1.5" />
                <span>Module {technique.module.code}</span>
              </div>
              <div className="flex items-center">
                <ListOrdered className="w-4 h-4 mr-1.5" />
                <span>Technique n°{technique.order}</span>
              </div>
              {technique.progress && (
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1.5" style={{ color: beltColor }} />
                  <span style={{ color: beltColor }}>
                    {PROGRESS_LEVELS.find(l => l.value === technique.progress?.level)?.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Instructions */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="w-5 h-5 mr-2" style={{ color: beltColor }} />
                Instructions
              </h2>
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                  {technique.instructions}
                </div>
              </div>
            </section>

            {/* Points clés */}
            {technique.keyPoints && technique.keyPoints.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" style={{ color: beltColor }} />
                  Points clés
                </h2>
                <ul className="space-y-4">
                  {technique.keyPoints.map((point, index) => (
                    <li 
                      key={index}
                      className="flex items-start space-x-3 p-4 rounded-xl bg-gray-50"
                    >
                      <CheckCircle 
                        className="w-5 h-5 flex-shrink-0 mt-0.5" 
                        style={{ color: beltColor }} 
                      />
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Section vidéos */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <VideoSection 
                videos={technique.videos}
                userVideos={technique.userVideos}
                beltColor={beltColor}
                techniqueId={technique.id}
                onVideoUploaded={fetchTechnique}
              />
            </section>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-8">
            {/* Progression (si connecté) */}
            {isLoggedIn ? (
              <ProgressSection
                techniqueId={technique.id}
                progress={technique.progress}
                beltColor={beltColor}
                onProgressUpdate={handleProgressUpdate}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Info className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">Progression</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Connectez-vous pour suivre votre progression sur cette technique.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Se connecter
                  </Button>
                </Link>
              </div>
            )}

            {/* Info module */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Module</h3>
              <Link 
                href={`/modules/${technique.module.id}`}
                className="block p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm text-gray-500 mb-1">{technique.module.code}</div>
                <div className="font-medium text-gray-900">{technique.module.name}</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12">
          <NavigationButtons 
            currentOrder={technique.order}
            moduleId={technique.module.id}
            beltColor={beltColor}
          />
        </div>
      </div>
    </div>
  );
}

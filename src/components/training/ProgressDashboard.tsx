'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  Users, 
  Award, 
  Clock, 
  Target,
  Activity,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'

// ============================================
// TYPES
// ============================================

export interface StudentProgress {
  studentId: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string | null
  currentBeltId?: string | null
  currentBeltName?: string | null
  currentBeltColor?: string | null
  totalTechniques: number
  masteredTechniques: number
  acquiredTechniques: number
  learningTechniques: number
  notStartedTechniques: number
  lastActivityAt?: string | null
  videosUploaded: number
  modulesCompleted: number
}

export interface ModuleStats {
  moduleId: string
  moduleName: string
  beltName: string
  totalStudents: number
  averageProgress: number
  completionRate: number
}

export interface ProgressDashboardProps {
  /** Statistiques des élèves */
  students: StudentProgress[]
  /** Statistiques des modules */
  modules?: ModuleStats[]
  /** Nombre total de techniques dans le programme */
  totalTechniques: number
  /** Nombre total de modules */
  totalModules: number
  /** Callback quand on clique sur un élève */
  onStudentClick?: (studentId: string) => void
  /** Callback quand on clique sur un module */
  onModuleClick?: (moduleId: string) => void
  /** État de chargement */
  isLoading?: boolean
  /** Message d'erreur */
  error?: string | null
  /** Classes CSS additionnelles */
  className?: string
}

// ============================================
// HELPERS
// ============================================

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Jamais'
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200'
  if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
  if (percentage >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function getProgressBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 60) return 'bg-blue-500'
  if (percentage >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getBeltColorClass(color: string | null | undefined): string {
  if (!color) return 'bg-gray-200'
  const normalized = color.toUpperCase()
  const colors: Record<string, string> = {
    'JAUNE': 'bg-yellow-400',
    'ORANGE': 'bg-orange-400',
    'VERTE': 'bg-green-500',
    'BLEUE': 'bg-blue-500',
    'MARRON': 'bg-amber-700',
    'NOIRE': 'bg-gray-900',
    'BLANCHE': 'bg-white border-2 border-gray-300',
    'ROUGE': 'bg-red-500',
    'VIOLETTE': 'bg-purple-500',
  }
  return colors[normalized] || 'bg-gray-400'
}

// ============================================
// SOUS-COMPOSANTS
// ============================================

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  color?: string
}

function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              <TrendingUp className={cn('w-4 h-4', !trend.isPositive && 'rotate-180')} />
              {trend.value}%
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', colorClasses[color])}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  colorClass?: string
}

function ProgressBar({ 
  value, 
  max, 
  label, 
  showPercentage = true, 
  size = 'md',
  colorClass 
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0
  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-4' : 'h-2'
  
  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm mb-1">
          {label && <span className="text-gray-600">{label}</span>}
          {showPercentage && (
            <span className={cn('font-medium', getProgressColor(percentage).split(' ')[0])}>
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', heightClass)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', colorClass || getProgressBarColor(percentage))}
        />
      </div>
    </div>
  )
}

interface StudentRowProps {
  student: StudentProgress
  totalTechniques: number
  onClick?: () => void
  rank: number
}

function StudentRow({ student, totalTechniques, onClick, rank }: StudentRowProps) {
  const completionRate = totalTechniques > 0 
    ? Math.round(((student.masteredTechniques + student.acquiredTechniques) / totalTechniques) * 100)
    : 0
  
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-blue-300'
      )}
    >
      {/* Rank */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
        rank <= 3 
          ? 'bg-yellow-100 text-yellow-700' 
          : 'bg-gray-100 text-gray-600'
      )}>
        {rank}
      </div>

      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
        {student.avatarUrl ? (
          <img 
            src={student.avatarUrl} 
            alt={`${student.firstName} ${student.lastName}`}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 truncate">
            {student.firstName} {student.lastName}
          </h4>
          {student.currentBeltColor && (
            <span 
              className={cn(
                'w-3 h-3 rounded-full border border-black/20',
                getBeltColorClass(student.currentBeltColor)
              )}
              title={student.currentBeltName || undefined}
            />
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">{student.email}</p>
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(student.lastActivityAt)}
          </span>
          <span>{student.videosUploaded} vidéos</span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-32 hidden sm:block">
        <ProgressBar 
          value={student.masteredTechniques + student.acquiredTechniques} 
          max={totalTechniques}
          size="sm"
          showPercentage={false}
        />
        <p className="text-xs text-gray-500 mt-1 text-right">
          {completionRate}% complété
        </p>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-4 text-sm">
        <div className="text-center">
          <p className="font-semibold text-green-600">{student.masteredTechniques}</p>
          <p className="text-xs text-gray-400">Maîtrisées</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-blue-600">{student.acquiredTechniques}</p>
          <p className="text-xs text-gray-400">Acquises</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-yellow-600">{student.learningTechniques}</p>
          <p className="text-xs text-gray-400">En cours</p>
        </div>
      </div>

      {/* Arrow */}
      {onClick && (
        <ChevronRight className="w-5 h-5 text-gray-400" />
      )}
    </motion.div>
  )
}

interface ModuleCardProps {
  module: ModuleStats
  onClick?: () => void
}

function ModuleCard({ module, onClick }: ModuleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={cn(
        'p-4 bg-white rounded-xl border border-gray-200 transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-blue-300'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{module.moduleName}</h4>
          <p className="text-sm text-gray-500">{module.beltName}</p>
        </div>
        <div className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          getProgressColor(module.completionRate)
        )}>
          {Math.round(module.completionRate)}%
        </div>
      </div>
      
      <ProgressBar 
        value={module.averageProgress} 
        max={100}
        label={`Progression moyenne (${module.totalStudents} élèves)`}
        size="sm"
      />
    </motion.div>
  )
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function ProgressDashboard({
  students,
  modules = [],
  totalTechniques,
  totalModules,
  onStudentClick,
  onModuleClick,
  isLoading = false,
  error = null,
  className,
}: ProgressDashboardProps) {
  // Calcul des statistiques globales
  const stats = useMemo(() => {
    const totalStudents = students.length
    const activeStudents = students.filter(s => s.lastActivityAt && 
      new Date(s.lastActivityAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
    
    const totalMastered = students.reduce((sum, s) => sum + s.masteredTechniques, 0)
    const totalAcquired = students.reduce((sum, s) => sum + s.acquiredTechniques, 0)
    const totalVideos = students.reduce((sum, s) => sum + s.videosUploaded, 0)
    
    const averageCompletion = totalStudents > 0
      ? Math.round(((totalMastered + totalAcquired) / (totalStudents * totalTechniques)) * 100)
      : 0

    return {
      totalStudents,
      activeStudents,
      totalMastered,
      totalAcquired,
      totalVideos,
      averageCompletion,
    }
  }, [students, totalTechniques])

  // Trier les élèves par progression
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const aScore = a.masteredTechniques * 2 + a.acquiredTechniques
      const bScore = b.masteredTechniques * 2 + b.acquiredTechniques
      return bScore - aScore
    })
  }, [students])

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-20', className)}>
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-20 text-center', className)}>
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord instructeur</h1>
        <p className="text-gray-600 mt-1">
          Vue d'ensemble de la progression des élèves
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Élèves actifs"
          value={stats.activeStudents}
          subtitle={`sur ${stats.totalStudents} inscrits`}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Techniques maîtrisées"
          value={stats.totalMastered}
          subtitle={`+${stats.totalAcquired} acquises`}
          icon={<Award className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Progression moyenne"
          value={`${stats.averageCompletion}%`}
          subtitle="du programme complet"
          icon={<Target className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Vidéos uploadées"
          value={stats.totalVideos}
          subtitle="par les élèves"
          icon={<Activity className="w-6 h-6" />}
          color="yellow"
        />
      </div>

      {/* Students Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            Progression des élèves
          </h2>
          <span className="text-sm text-gray-500">
            {students.length} élève{students.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-2">
          {sortedStudents.map((student, index) => (
            <StudentRow
              key={student.studentId}
              student={student}
              totalTechniques={totalTechniques}
              onClick={onStudentClick ? () => onStudentClick(student.studentId) : undefined}
              rank={index + 1}
            />
          ))}
        </div>

        {students.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun élève pour le moment</p>
          </div>
        )}
      </div>

      {/* Modules Section */}
      {modules.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Progression par module
            </h2>
            <span className="text-sm text-gray-500">
              {modules.length} module{modules.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => (
              <ModuleCard
                key={module.moduleId}
                module={module}
                onClick={onModuleClick ? () => onModuleClick(module.moduleId) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

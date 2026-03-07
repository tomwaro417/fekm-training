'use client'

import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Check, 
  X,
  Users,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================
// TYPES
// ============================================

export interface Belt {
  id: string
  name: string
  color: string
  order: number
  description?: string | null
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  currentBeltId?: string | null
  avatarUrl?: string | null
  joinedAt?: string
}

export interface BeltAssignmentProps {
  /** Liste des ceintures disponibles */
  belts: Belt[]
  /** Liste des élèves */
  students: Student[]
  /** Callback quand une ceinture est assignée */
  onAssignBelt: (studentId: string, beltId: string) => Promise<void>
  /** Callback quand une ceinture est retirée */
  onRemoveBelt?: (studentId: string) => Promise<void>
  /** Classes CSS additionnelles */
  className?: string
  /** Titre de la section */
  title?: string
  /** Filtrer par ceinture par défaut */
  defaultFilterBeltId?: string
  /** Recherche par défaut */
  defaultSearchQuery?: string
}

interface AssignmentState {
  studentId: string | null
  beltId: string | null
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string
}

// ============================================
// CONSTANTES
// ============================================

const BELT_COLORS: Record<string, string> = {
  'JAUNE': 'bg-yellow-400 border-yellow-500',
  'ORANGE': 'bg-orange-400 border-orange-500',
  'VERTE': 'bg-green-500 border-green-600',
  'BLEUE': 'bg-blue-500 border-blue-600',
  'MARRON': 'bg-amber-700 border-amber-800',
  'NOIRE': 'bg-gray-900 border-black',
  'BLANCHE': 'bg-white border-gray-300',
  'ROUGE': 'bg-red-500 border-red-600',
  'VIOLETTE': 'bg-purple-500 border-purple-600',
}

// ============================================
// HELPERS
// ============================================

function getBeltColorClass(color: string): string {
  const normalizedColor = color.toUpperCase()
  return BELT_COLORS[normalizedColor] || 'bg-gray-400 border-gray-500'
}

function getBeltDisplayName(belt: Belt): string {
  return belt.name
}

// ============================================
// SOUS-COMPOSANTS
// ============================================

interface BeltBadgeProps {
  belt: Belt
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  onClick?: () => void
  isSelected?: boolean
}

function BeltBadge({ belt, size = 'md', showLabel = true, onClick, isSelected }: BeltBadgeProps) {
  const sizeClasses = {
    sm: 'w-6 h-4',
    md: 'w-8 h-5',
    lg: 'w-12 h-7',
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-2 py-1 rounded-lg border-2 transition-all',
        getBeltColorClass(belt.color),
        isSelected && 'ring-2 ring-offset-2 ring-blue-500',
        onClick && 'hover:opacity-80 cursor-pointer',
        !onClick && 'cursor-default'
      )}
      aria-label={`Ceinture ${belt.name}`}
    >
      <div className={cn('rounded-sm border border-black/20', sizeClasses[size])} />
      {showLabel && (
        <span className={cn(
          'font-semibold text-sm',
          belt.color.toUpperCase() === 'BLANCHE' || belt.color.toUpperCase() === 'JAUNE'
            ? 'text-gray-900'
            : 'text-white'
        )}>
          {getBeltDisplayName(belt)}
        </span>
      )}
    </button>
  )
}

interface StudentCardProps {
  student: Student
  currentBelt?: Belt
  availableBelts: Belt[]
  isAssigning: boolean
  onAssign: (beltId: string) => void
  onRemove: () => void
}

function StudentCard({ 
  student, 
  currentBelt, 
  availableBelts, 
  isAssigning, 
  onAssign, 
  onRemove 
}: StudentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase()

  return (
    <motion.div
      layout
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
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
          <div>
            <h4 className="font-semibold text-gray-900">
              {student.firstName} {student.lastName}
            </h4>
            <p className="text-sm text-gray-500">{student.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Current belt */}
          {currentBelt ? (
            <BeltBadge belt={currentBelt} size="sm" />
          ) : (
            <span className="text-sm text-gray-400 italic">Sans ceinture</span>
          )}
          
          {/* Expand icon */}
          <div className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 bg-gray-50"
          >
            <div className="p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-3">
                Assigner une ceinture
              </h5>
              
              {isAssigning ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableBelts.map((belt) => (
                    <button
                      key={belt.id}
                      onClick={() => onAssign(belt.id)}
                      disabled={currentBelt?.id === belt.id}
                      className={cn(
                        'relative transition-all',
                        currentBelt?.id === belt.id && 'opacity-50 cursor-not-allowed'
                      )}
                      aria-label={`Assigner la ceinture ${belt.name}`}
                    >
                      <BeltBadge 
                        belt={belt} 
                        size="md" 
                        isSelected={currentBelt?.id === belt.id}
                      />
                      {currentBelt?.id === belt.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {currentBelt && !isAssigning && (
                <button
                  onClick={onRemove}
                  className="mt-4 flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Retirer la ceinture actuelle
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function BeltAssignment({
  belts,
  students,
  onAssignBelt,
  onRemoveBelt,
  className,
  title = 'Gestion des ceintures',
  defaultFilterBeltId,
  defaultSearchQuery = '',
}: BeltAssignmentProps) {
  const [searchQuery, setSearchQuery] = useState(defaultSearchQuery)
  const [filterBeltId, setFilterBeltId] = useState<string | null>(defaultFilterBeltId || null)
  const [assignmentState, setAssignmentState] = useState<AssignmentState>({
    studentId: null,
    beltId: null,
    status: 'idle',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Trier les ceintures par ordre
  const sortedBelts = [...belts].sort((a, b) => a.order - b.order)

  // Filtrer les élèves
  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesBelt = filterBeltId 
      ? student.currentBeltId === filterBeltId
      : true

    return matchesSearch && matchesBelt
  })

  // Grouper par ceinture
  const studentsByBelt = sortedBelts.map((belt) => ({
    belt,
    students: filteredStudents.filter((s) => s.currentBeltId === belt.id),
  }))

  const unassignedStudents = filteredStudents.filter((s) => !s.currentBeltId)

  // Handlers
  const handleAssign = useCallback(async (studentId: string, beltId: string) => {
    setAssignmentState({ studentId, beltId, status: 'loading' })
    
    try {
      await onAssignBelt(studentId, beltId)
      setAssignmentState({ studentId, beltId, status: 'success' })
      
      // Reset après 2 secondes
      setTimeout(() => {
        setAssignmentState({ studentId: null, beltId: null, status: 'idle' })
      }, 2000)
    } catch (error) {
      setAssignmentState({ 
        studentId, 
        beltId, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur lors de l\'assignation'
      })
    }
  }, [onAssignBelt])

  const handleRemove = useCallback(async (studentId: string) => {
    if (!onRemoveBelt) return
    
    setAssignmentState({ studentId, beltId: null, status: 'loading' })
    
    try {
      await onRemoveBelt(studentId)
      setAssignmentState({ studentId, beltId: null, status: 'success' })
      
      setTimeout(() => {
        setAssignmentState({ studentId: null, beltId: null, status: 'idle' })
      }, 2000)
    } catch (error) {
      setAssignmentState({ 
        studentId, 
        beltId: null, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur lors du retrait'
      })
    }
  }, [onRemoveBelt])

  const getStudentBelt = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (!student?.currentBeltId) return undefined
    return belts.find((b) => b.id === student.currentBeltId)
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <p className="text-gray-600">
          {students.length} élève{students.length > 1 ? 's' : ''} • {belts.length} ceinture{belts.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Rechercher un élève"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors',
              showFilters || filterBeltId
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            )}
            aria-label="Afficher les filtres"
            aria-expanded={showFilters}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtres</span>
            {(showFilters || filterBeltId) && (
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Filtrer par ceinture</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterBeltId(null)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full border transition-colors',
                      filterBeltId === null
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    )}
                  >
                    Toutes
                  </button>
                  {sortedBelts.map((belt) => (
                    <button
                      key={belt.id}
                      onClick={() => setFilterBeltId(belt.id)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-full border transition-colors',
                        filterBeltId === belt.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      )}
                    >
                      {belt.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setFilterBeltId('none')}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full border transition-colors',
                      filterBeltId === 'none'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    )}
                  >
                    Sans ceinture
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error message */}
      {assignmentState.status === 'error' && assignmentState.error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{assignmentState.error}</p>
        </motion.div>
      )}

      {/* Students list */}
      <div className="space-y-4">
        {filterBeltId === null ? (
          // Vue groupée par ceinture
          <>
            {studentsByBelt.map(({ belt, students }) => (
              students.length > 0 && (
                <div key={belt.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <BeltBadge belt={belt} size="sm" />
                    <span className="text-sm text-gray-500">
                      {students.length} élève{students.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {students.map((student) => (
                      <StudentCard
                        key={student.id}
                        student={student}
                        currentBelt={belt}
                        availableBelts={sortedBelts}
                        isAssigning={
                          assignmentState.studentId === student.id && 
                          assignmentState.status === 'loading'
                        }
                        onAssign={(beltId) => handleAssign(student.id, beltId)}
                        onRemove={() => handleRemove(student.id)}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
            
            {unassignedStudents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-500">Sans ceinture</span>
                  <span className="text-sm text-gray-400">
                    {unassignedStudents.length} élève{unassignedStudents.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2">
                  {unassignedStudents.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      availableBelts={sortedBelts}
                      isAssigning={
                        assignmentState.studentId === student.id && 
                        assignmentState.status === 'loading'
                      }
                      onAssign={(beltId) => handleAssign(student.id, beltId)}
                      onRemove={() => handleRemove(student.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // Vue filtrée
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                currentBelt={getStudentBelt(student.id)}
                availableBelts={sortedBelts}
                isAssigning={
                  assignmentState.studentId === student.id && 
                  assignmentState.status === 'loading'
                }
                onAssign={(beltId) => handleAssign(student.id, beltId)}
                onRemove={() => handleRemove(student.id)}
              />
            ))}
          </div>
        )}

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun élève trouvé</p>
            {(searchQuery || filterBeltId) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilterBeltId(null)
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

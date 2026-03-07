'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Shield, 
  Award,
  Calendar,
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react'
import { ToastContainer, showToast } from '@/components/admin/Toast'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/admin/Modal'
import { Card, Badge, Input, Select } from '@/components/admin/FormComponents'
import { Tabs } from '@/components/admin/DataDisplay'

interface Belt {
  id: string
  name: string
  color: string
  order: number
}

interface BeltHistory {
  id: string
  belt: Belt
  assignedAt: string
  assignedBy: {
    name: string | null
    email: string
  }
}

interface UserProgress {
  techniqueId: string
  techniqueName: string
  moduleCode: string
  beltName: string
  level: 'NON_ACQUIS' | 'EN_COURS_DAPPRENTISSAGE' | 'ACQUIS' | 'MAITRISE'
  updatedAt: string
}

interface UserData {
  id: string
  name: string | null
  email: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
  belt: Belt | null
  createdAt: string
  updatedAt: string
  beltHistory: BeltHistory[]
  progress: UserProgress[]
  stats: {
    totalTechniques: number
    masteredTechniques: number
    acquiredTechniques: number
    inProgressTechniques: number
    videosUploaded: number
  }
}

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserData | null>(null)
  const [belts, setBelts] = useState<Belt[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<{
    name: string
    email: string
    role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
    beltId: string
  }>({
    name: '',
    email: '',
    role: 'STUDENT',
    beltId: ''
  })

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBeltModal, setShowBeltModal] = useState(false)
  const [selectedBeltId, setSelectedBeltId] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchUser()
    fetchBelts()
  }, [userId])

  async function fetchUser() {
    setLoading(true)
    try {
      // Pour l'instant, on utilise l'API existante
      // Plus tard, on pourrait créer une API dédiée avec plus de détails
      const response = await fetch(`/api/admin/users`)
      if (!response.ok) throw new Error('Erreur')
      const result = await response.json()
      // API returns { success: true, data: { users, pagination } }
      const users = result.data?.users || []
      const userData = users.find((u: any) => u.id === userId)
      
      if (!userData) {
        showToast('Utilisateur non trouvé', 'error')
        router.push('/admin/users')
        return
      }

      // Enrichir avec des données mockées pour la démo
      const enrichedUser: UserData = {
        ...userData,
        beltHistory: [
          {
            id: '1',
            belt: { id: '1', name: 'JAUNE', color: '#FFD700', order: 1 },
            assignedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            assignedBy: { name: 'Admin', email: 'admin@fekm.fr' }
          },
          {
            id: '2',
            belt: { id: '2', name: 'ORANGE', color: '#FFA500', order: 2 },
            assignedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            assignedBy: { name: 'Admin', email: 'admin@fekm.fr' }
          }
        ],
        progress: [
          {
            techniqueId: '1',
            techniqueName: 'Direct du bras avant',
            moduleCode: 'P1',
            beltName: 'JAUNE',
            level: 'MAITRISE',
            updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            techniqueId: '2',
            techniqueName: 'Crochet du bras avant',
            moduleCode: 'P1',
            beltName: 'JAUNE',
            level: 'ACQUIS',
            updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            techniqueId: '3',
            techniqueName: 'Uppercut du bras avant',
            moduleCode: 'P1',
            beltName: 'JAUNE',
            level: 'EN_COURS_DAPPRENTISSAGE',
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        stats: {
          totalTechniques: 45,
          masteredTechniques: 12,
          acquiredTechniques: 20,
          inProgressTechniques: 8,
          videosUploaded: 5
        }
      }

      setUser(enrichedUser)
      setEditForm({
        name: enrichedUser.name || '',
        email: enrichedUser.email,
        role: enrichedUser.role,
        beltId: enrichedUser.belt?.id || ''
      })
    } catch (error) {
      showToast('Erreur lors de la récupération des données', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function fetchBelts() {
    try {
      const response = await fetch('/api/belts')
      if (!response.ok) throw new Error('Erreur')
      const data = await response.json()
      setBelts(data.sort((a: Belt, b: Belt) => a.order - b.order))
    } catch (error) {
      showToast('Erreur lors de la récupération des ceintures', 'error')
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          beltId: editForm.beltId || null
        })
      })

      if (!response.ok) throw new Error('Erreur')
      
      showToast('Utilisateur mis à jour avec succès', 'success')
      setIsEditing(false)
      fetchUser()
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erreur')
      
      showToast('Utilisateur supprimé avec succès', 'success')
      router.push('/admin/users')
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error')
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  async function handleBeltChange() {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          beltId: selectedBeltId || null
        })
      })

      if (!response.ok) throw new Error('Erreur')
      
      showToast('Ceinture mise à jour avec succès', 'success')
      setShowBeltModal(false)
      fetchUser()
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error')
    }
  }

  const getBeltName = (name: string) => {
    const names: Record<string, string> = {
      'JAUNE': 'Jaune',
      'ORANGE': 'Orange',
      'VERTE': 'Verte',
      'BLEUE': 'Bleue',
      'MARRON': 'Marron',
      'NOIRE_1': 'Noire 1er Darga',
      'NOIRE_2': 'Noire 2e Darga',
      'NOIRE_3': 'Noire 3e Darga',
    }
    return names[name] || name
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="error"><Shield className="w-3 h-3 mr-1" />Admin</Badge>
      case 'INSTRUCTOR':
        return <Badge variant="warning"><Award className="w-3 h-3 mr-1" />Instructeur</Badge>
      default:
        return <Badge variant="info"><User className="w-3 h-3 mr-1" />Élève</Badge>
    }
  }

  const getProgressBadge = (level: string) => {
    switch (level) {
      case 'MAITRISE':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Maîtrisé</Badge>
      case 'ACQUIS':
        return <Badge variant="info"><CheckCircle className="w-3 h-3 mr-1" />Acquis</Badge>
      case 'EN_COURS_DAPPRENTISSAGE':
        return <Badge variant="warning"><Activity className="w-3 h-3 mr-1" />En cours</Badge>
      default:
        return <Badge variant="default">Non acquis</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div>
      <ToastContainer />
      
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/users')}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour à la liste
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.name || 'Sans nom'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{user.email}</span>
                <span className="mx-2">•</span>
                {getRoleBadge(user.role)}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Vue d\'ensemble', icon: <Activity className="w-4 h-4" /> },
          { id: 'belt-history', label: 'Historique des ceintures', icon: <Award className="w-4 h-4" /> },
          { id: 'progress', label: 'Progression', icon: <TrendingUp className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{user.stats.totalTechniques}</p>
                <p className="text-sm text-gray-500 mt-1">Techniques vues</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{user.stats.masteredTechniques}</p>
                <p className="text-sm text-gray-500 mt-1">Maîtrisées</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{user.stats.acquiredTechniques}</p>
                <p className="text-sm text-gray-500 mt-1">Acquises</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{user.stats.videosUploaded}</p>
                <p className="text-sm text-gray-500 mt-1">Vidéos uploadées</p>
              </div>
            </Card>
          </div>

          {/* User Info */}
          <Card title="Informations">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  label="Nom"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
                <Select
                  label="Rôle"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  options={[
                    { value: 'STUDENT', label: 'Élève' },
                    { value: 'INSTRUCTOR', label: 'Instructeur' },
                    { value: 'ADMIN', label: 'Administrateur' },
                  ]}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Nom</span>
                  <span className="font-medium">{user.name || '-'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Rôle</span>
                  {getRoleBadge(user.role)}
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Ceinture actuelle</span>
                  <div className="flex items-center">
                    {user.belt ? (
                      <>
                        <span
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: user.belt.color }}
                        />
                        <span className="font-medium">{getBeltName(user.belt.name)}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">Non assignée</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">Inscrit le</span>
                  <span className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Current Belt */}
          <Card 
            title="Ceinture actuelle" 
            action={
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedBeltId(user.belt?.id || '')
                  setShowBeltModal(true)
                }}
              >
                <Award className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            }
          >
            {user.belt ? (
              <div className="flex items-center">
                <div
                  className="w-24 h-24 rounded-lg mr-6 shadow-lg"
                  style={{ backgroundColor: user.belt.color }}
                />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Ceinture {getBeltName(user.belt.name)}
                  </h3>
                  <p className="text-gray-500 mt-1">
                    Assignée depuis le {new Date(user.beltHistory[0]?.assignedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune ceinture assignée</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowBeltModal(true)}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Assigner une ceinture
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Belt History Tab */}
      {activeTab === 'belt-history' && (
        <Card title="Historique des ceintures">
          {user.beltHistory.length > 0 ? (
            <div className="space-y-4">
              {user.beltHistory.map((history, index) => (
                <div 
                  key={history.id} 
                  className="flex items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-lg shadow"
                      style={{ backgroundColor: history.belt.color }}
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-900">
                        Ceinture {getBeltName(history.belt.name)}
                      </h4>
                      {index === 0 && (
                        <Badge variant="success" className="ml-2">Actuelle</Badge>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      Assignée le {new Date(history.assignedAt).toLocaleDateString('fr-FR')}
                      <span className="mx-2">•</span>
                      <User className="w-4 h-4 mr-1" />
                      Par {history.assignedBy.name || history.assignedBy.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun historique de ceinture</p>
            </div>
          )}
        </Card>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <Card title="Progression récente">
          {user.progress.length > 0 ? (
            <div className="divide-y">
              {user.progress.map((item) => (
                <div key={item.techniqueId} className="py-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.techniqueName}</h4>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs mr-2">
                        {item.moduleCode}
                      </span>
                      <span>{item.beltName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {getProgressBadge(item.level)}
                    <p className="text-xs text-gray-400 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune progression enregistrée</p>
            </div>
          )}
        </Card>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name || user.email}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        isLoading={isDeleting}
      />

      {/* Belt Modal */}
      <Modal
        isOpen={showBeltModal}
        onClose={() => setShowBeltModal(false)}
        title="Assigner une ceinture"
        size="md"
      >
        <div className="space-y-3">
          <button
            onClick={() => setSelectedBeltId('')}
            className={`
              w-full flex items-center p-3 rounded-lg border-2 transition-colors
              ${!selectedBeltId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            <span className="text-gray-500">Aucune ceinture</span>
          </button>
          {belts.map((belt) => (
            <button
              key={belt.id}
              onClick={() => setSelectedBeltId(belt.id)}
              className={`
                w-full flex items-center p-3 rounded-lg border-2 transition-colors
                ${selectedBeltId === belt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <span
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: belt.color }}
              />
              <span className="font-medium text-gray-900">{getBeltName(belt.name)}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowBeltModal(false)}>
            Annuler
          </Button>
          <Button onClick={handleBeltChange}>
            Confirmer
          </Button>
        </div>
      </Modal>
    </div>
  )
}

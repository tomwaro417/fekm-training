'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Users, 
  Search, 
  Award, 
  Shield, 
  UserCheck,
  Save,
  X,
  Filter
} from 'lucide-react'
import { ToastContainer, showToast } from '@/components/admin/Toast'

interface Belt {
  id: string
  name: string
  color: string
}

interface User {
  id: string
  name: string | null
  email: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
  belt: Belt | null
  createdAt: string
}

export default function UsersManagementPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [belts, setBelts] = useState<Belt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedBelt, setSelectedBelt] = useState<string>('')
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    fetchBelts()
    fetchUsers()
  }, [search, selectedBelt])

  async function fetchBelts() {
    try {
      const response = await fetch('/api/belts')
      if (!response.ok) throw new Error('Erreur lors de la récupération des ceintures')
      const data = await response.json()
      setBelts(data)
    } catch (error) {
      showToast('Erreur lors de la récupération des ceintures', 'error')
    }
  }

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedBelt) params.append('beltId', selectedBelt)
      
      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération des utilisateurs')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      showToast('Erreur lors de la récupération des utilisateurs', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function updateUserBelt(userId: string, beltId: string | null) {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, beltId }),
      })

      if (!response.ok) throw new Error('Erreur lors de la mise à jour')
      
      showToast('Ceinture assignée avec succès', 'success')
      fetchUsers()
      setEditingUser(null)
    } catch (error) {
      showToast('Erreur lors de l\'assignation de la ceinture', 'error')
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </span>
        )
      case 'INSTRUCTOR':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <UserCheck className="w-3 h-3 mr-1" />
            Instructeur
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Users className="w-3 h-3 mr-1" />
            Élève
          </span>
        )
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
    }
    return names[name] || name
  }

  return (
    <div>
      <ToastContainer />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p className="text-gray-600 mt-2">Assignez les ceintures et gérez les rôles</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedBelt}
              onChange={(e) => setSelectedBelt(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">Toutes les ceintures</option>
              {belts.map((belt) => (
                <option key={belt.id} value={belt.id}>
                  {getBeltName(belt.name)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ceinture
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscription
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'Sans nom'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.belt ? (
                        <div className="flex items-center">
                          <span
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: user.belt.color }}
                          />
                          <span className="text-sm text-gray-900">
                            {getBeltName(user.belt.name)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Non assignée</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-blue-600 hover:text-blue-900 flex items-center justify-end w-full"
                      >
                        <Award className="w-4 h-4 mr-1" />
                        Assigner ceinture
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Assigner une ceinture
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Utilisateur</p>
              <p className="font-medium text-gray-900">{editingUser.name || editingUser.email}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ceinture
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => updateUserBelt(editingUser.id, null)}
                  className={`w-full flex items-center p-3 rounded-lg border-2 transition-colors ${
                    !editingUser.belt
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-gray-500">Aucune ceinture</span>
                </button>
                {belts.map((belt) => (
                  <button
                    key={belt.id}
                    onClick={() => updateUserBelt(editingUser.id, belt.id)}
                    className={`w-full flex items-center p-3 rounded-lg border-2 transition-colors ${
                      editingUser.belt?.id === belt.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: belt.color }}
                    />
                    <span className="font-medium text-gray-900">
                      {getBeltName(belt.name)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

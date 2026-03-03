'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react'
import { Modal, ConfirmModal } from '@/components/admin/Modal'
import { ToastContainer, showToast } from '@/components/admin/Toast'

interface Belt {
  id: string
  name: string
  color: string
}

interface Module {
  id: string
  code: string
  name: string
  description: string | null
  order: number
  beltId: string
  belt: {
    id: string
    name: string
    color: string
  }
  _count: {
    techniques: number
  }
}

export default function ModulesManagement() {
  const [modules, setModules] = useState<Module[]>([])
  const [belts, setBelts] = useState<Belt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBelt, setSelectedBelt] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [deletingModule, setDeletingModule] = useState<Module | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    beltId: '',
    code: '',
    name: '',
    description: '',
    order: 1,
  })

  useEffect(() => {
    fetchBelts()
    fetchModules()
  }, [selectedBelt])

  async function fetchBelts() {
    try {
      const response = await fetch('/api/belts')
      if (!response.ok) throw new Error('Erreur')
      const data = await response.json()
      setBelts(data)
    } catch (error) {
      showToast('Erreur lors de la récupération des ceintures', 'error')
    }
  }

  async function fetchModules() {
    try {
      const url = selectedBelt 
        ? `/api/admin/modules?beltId=${selectedBelt}` 
        : '/api/admin/modules'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Erreur')
      const data = await response.json()
      setModules(data)
    } catch (error) {
      showToast('Erreur lors de la récupération des modules', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleAdd() {
    setEditingModule(null)
    setFormData({ 
      beltId: selectedBelt || (belts[0]?.id ?? ''), 
      code: '', 
      name: '', 
      description: '', 
      order: 1 
    })
    setIsModalOpen(true)
  }

  function handleEdit(module: Module) {
    setEditingModule(module)
    setFormData({
      beltId: module.beltId,
      code: module.code,
      name: module.name,
      description: module.description || '',
      order: module.order,
    })
    setIsModalOpen(true)
  }

  function handleDelete(module: Module) {
    setDeletingModule(module)
    setIsDeleteModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingModule 
        ? `/api/admin/modules/${editingModule.id}` 
        : '/api/admin/modules'
      const method = editingModule ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde')

      showToast(
        editingModule ? 'Module modifié avec succès' : 'Module créé avec succès',
        'success'
      )
      setIsModalOpen(false)
      fetchModules()
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deletingModule) return
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/modules/${deletingModule.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erreur lors de la suppression')

      showToast('Module supprimé avec succès', 'success')
      setIsDeleteModalOpen(false)
      fetchModules()
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error')
    } finally {
      setIsSubmitting(false)
      setDeletingModule(null)
    }
  }

  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <ToastContainer />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Modules</h1>
          <p className="text-gray-600 mt-1">Gérez les modules d'enseignement FEKM</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau module
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un module..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedBelt}
            onChange={(e) => setSelectedBelt(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes les ceintures</option>
            {belts.map((belt) => (
              <option key={belt.id} value={belt.id}>
                {belt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ceinture</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordre</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Techniques</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredModules.map((module) => (
              <tr key={module.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-mono font-medium bg-gray-100 text-gray-800">
                    {module.code}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{module.name}</p>
                    {module.description && (
                      <p className="text-xs text-gray-500 truncate max-w-xs">{module.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: module.belt.color }}
                    />
                    <span className="text-sm text-gray-900">{module.belt.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{module.order}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {module._count.techniques}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(module)}
                      className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(module)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredModules.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun module trouvé
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingModule ? 'Modifier le module' : 'Nouveau module'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ceinture</label>
            <select
              value={formData.beltId}
              onChange={(e) => setFormData({ ...formData, beltId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionner une ceinture</option>
              {belts.map((belt) => (
                <option key={belt.id} value={belt.id}>
                  {belt.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ex: UV1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min={1}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Sauvegarde...' : (editingModule ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le module"
        message={`Êtes-vous sûr de vouloir supprimer le module "${deletingModule?.code} - ${deletingModule?.name}" ? Cette action est irréversible.`}
        isLoading={isSubmitting}
      />
    </div>
  )
}
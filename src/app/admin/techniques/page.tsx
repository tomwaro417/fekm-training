'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Filter, X } from 'lucide-react'
import { Modal, ConfirmModal } from '@/components/admin/Modal'
import { ToastContainer, showToast } from '@/components/admin/Toast'
import { TechniqueCategory } from '@prisma/client'

const categories = Object.values(TechniqueCategory)

interface Belt {
  id: string
  name: string
  color: string
}

interface Module {
  id: string
  code: string
  name: string
  beltId: string
}

interface Technique {
  id: string
  name: string
  category: TechniqueCategory
  subCategory: string | null
  description: string | null
  instructions: string | null
  keyPoints: string[]
  order: number
  moduleId: string
  module: {
    id: string
    code: string
    name: string
    belt: {
      name: string
      color: string
    }
  }
}

export default function TechniquesManagement() {
  const [techniques, setTechniques] = useState<Technique[]>([])
  const [belts, setBelts] = useState<Belt[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [allModules, setAllModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBelt, setSelectedBelt] = useState<string>('')
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingTechnique, setEditingTechnique] = useState<Technique | null>(null)
  const [deletingTechnique, setDeletingTechnique] = useState<Technique | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<{
    moduleId: string
    name: string
    category: TechniqueCategory
    subCategory: string
    description: string
    instructions: string
    keyPoints: string[]
    order: number
  }>({
    moduleId: '',
    name: '',
    category: TechniqueCategory.FRAPPE_DE_FACE,
    subCategory: '',
    description: '',
    instructions: '',
    keyPoints: [],
    order: 1,
  })

  const [newKeyPoint, setNewKeyPoint] = useState('')

  useEffect(() => {
    fetchBelts()
    fetchAllModules()
    fetchTechniques()
  }, [selectedBelt, selectedModule, selectedCategory])

  useEffect(() => {
    if (selectedBelt) {
      setModules(allModules.filter(m => m.beltId === selectedBelt))
    } else {
      setModules(allModules)
    }
  }, [selectedBelt, allModules])

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

  async function fetchAllModules() {
    try {
      const response = await fetch('/api/admin/modules')
      if (!response.ok) throw new Error('Erreur')
      const data = await response.json()
      setAllModules(data)
      setModules(data)
    } catch (error) {
      showToast('Erreur lors de la récupération des modules', 'error')
    }
  }

  async function fetchTechniques() {
    try {
      const params = new URLSearchParams()
      if (selectedBelt) params.append('beltId', selectedBelt)
      if (selectedModule) params.append('moduleId', selectedModule)
      if (selectedCategory) params.append('category', selectedCategory)

      const url = `/api/admin/techniques?${params.toString()}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Erreur')
      const data = await response.json()
      setTechniques(data)
    } catch (error) {
      showToast('Erreur lors de la récupération des techniques', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleAdd() {
    setEditingTechnique(null)
    setFormData({
      moduleId: selectedModule || (modules[0]?.id ?? ''),
      name: '',
      category: TechniqueCategory.FRAPPE_DE_FACE,
      subCategory: '',
      description: '',
      instructions: '',
      keyPoints: [],
      order: 1,
    })
    setNewKeyPoint('')
    setIsModalOpen(true)
  }

  function handleEdit(technique: Technique) {
    setEditingTechnique(technique)
    setFormData({
      moduleId: technique.moduleId,
      name: technique.name,
      category: technique.category,
      subCategory: technique.subCategory || '',
      description: technique.description || '',
      instructions: technique.instructions || '',
      keyPoints: technique.keyPoints || [],
      order: technique.order,
    })
    setNewKeyPoint('')
    setIsModalOpen(true)
  }

  function handleDelete(technique: Technique) {
    setDeletingTechnique(technique)
    setIsDeleteModalOpen(true)
  }

  function addKeyPoint() {
    if (newKeyPoint.trim()) {
      setFormData({ ...formData, keyPoints: [...formData.keyPoints, newKeyPoint.trim()] })
      setNewKeyPoint('')
    }
  }

  function removeKeyPoint(index: number) {
    setFormData({
      ...formData,
      keyPoints: formData.keyPoints.filter((_, i) => i !== index),
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingTechnique 
        ? `/api/admin/techniques/${editingTechnique.id}` 
        : '/api/admin/techniques'
      const method = editingTechnique ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde')

      showToast(
        editingTechnique ? 'Technique modifiée avec succès' : 'Technique créée avec succès',
        'success'
      )
      setIsModalOpen(false)
      fetchTechniques()
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deletingTechnique) return
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/techniques/${deletingTechnique.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erreur lors de la suppression')

      showToast('Technique supprimée avec succès', 'success')
      setIsDeleteModalOpen(false)
      fetchTechniques()
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error')
    } finally {
      setIsSubmitting(false)
      setDeletingTechnique(null)
    }
  }

  const filteredTechniques = techniques.filter(technique =>
    technique.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function getCategoryLabel(category: TechniqueCategory) {
    return category.replace(/_/g, ' ').toLowerCase()
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Techniques</h1>
          <p className="text-gray-600 mt-1">Gérez les techniques du programme FEKM</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle technique
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une technique..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={selectedBelt}
            onChange={(e) => {
              setSelectedBelt(e.target.value)
              setSelectedModule('')
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes les ceintures</option>
            {belts.map((belt) => (
              <option key={belt.id} value={belt.id}>
                {belt.name}
              </option>
            ))}
          </select>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les modules</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.code} - {module.name}
              </option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {getCategoryLabel(category)}
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
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ceinture</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordre</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTechniques.map((technique) => (
              <tr key={technique.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{technique.name}</p>
                    {technique.subCategory && (
                      <p className="text-xs text-gray-500">{technique.subCategory}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {getCategoryLabel(technique.category)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono text-gray-600">{technique.module.code}</span>
                  <p className="text-xs text-gray-500">{technique.module.name}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: technique.module.belt.color }}
                    />
                    <span className="text-sm text-gray-900">{technique.module.belt.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{technique.order}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(technique)}
                      className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(technique)}
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
        {filteredTechniques.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucune technique trouvée
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTechnique ? 'Modifier la technique' : 'Nouvelle technique'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
              <select
                value={formData.moduleId}
                onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner un module</option>
                {allModules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.code} - {module.name}
                  </option>
                ))}
              </select>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TechniqueCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sous-catégorie</label>
              <input
                type="text"
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optionnel"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Points clés</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newKeyPoint}
                onChange={(e) => setNewKeyPoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addKeyPoint()
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ajouter un point clé..."
              />
              <button
                type="button"
                onClick={addKeyPoint}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Ajouter
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {formData.keyPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="flex-1 text-sm">{point}</span>
                  <button
                    type="button"
                    onClick={() => removeKeyPoint(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
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
              {isSubmitting ? 'Sauvegarde...' : (editingTechnique ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer la technique"
        message={`Êtes-vous sûr de vouloir supprimer la technique "${deletingTechnique?.name}" ? Cette action est irréversible.`}
        isLoading={isSubmitting}
      />
    </div>
  )
}
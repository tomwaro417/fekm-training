'use client'

import { useState } from 'react'
import { X, Save, Tag, FileText, Type } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from '@/components/ui/Button'
import { Video } from './VideoList'

interface VideoMetadataEditorProps {
  video: Video | null
  isOpen: boolean
  onClose: () => void
  onSave: (videoId: string, metadata: {
    title: string
    description: string
    tags: string[]
  }) => Promise<void>
}

export function VideoMetadataEditor({
  video,
  isOpen,
  onClose,
  onSave
}: VideoMetadataEditorProps) {
  const [title, setTitle] = useState(video?.title || '')
  const [description, setDescription] = useState(video?.description || '')
  const [tags, setTags] = useState<string[]>(video?.tags || [])
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset form when video changes
  if (video && isOpen) {
    if (title !== (video.title || '')) setTitle(video.title || '')
    if (description !== (video.description || '')) setDescription(video.description || '')
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSave = async () => {
    if (!video) return
    setSaving(true)
    try {
      await onSave(video.id, {
        title: title.trim() || video.filename,
        description: description.trim(),
        tags
      })
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!video) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Éditer les métadonnées"
      size="lg"
    >
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Type className="w-4 h-4 inline mr-1" />
            Titre
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={video.filename}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-400"
          />
          <p className="text-xs text-gray-500 mt-1">
            Si vide, le nom du fichier sera utilisé
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Description de la vidéo..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black placeholder-gray-400"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Tags
          </label>
          
          {/* Tag Input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Ajouter un tag..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-400"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
            >
              Ajouter
            </Button>
          </div>

          {/* Tag List */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-gray-400 italic">
                Aucun tag ajouté
              </p>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p><strong>Fichier:</strong> {video.filename}</p>
          <p><strong>Type:</strong> {video.type === 'COACH' ? 'Coach' : 'Démonstration'}</p>
          <p><strong>Uploadé le:</strong> {new Date(video.createdAt).toLocaleDateString('fr-FR')}</p>
          {video.technique && (
            <p><strong>Technique:</strong> {video.technique.name}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            loading={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>
    </Modal>
  )
}

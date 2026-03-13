'use client';

import { useState, useCallback, useEffect } from 'react';

// ============================================
// TYPES
// ============================================

export interface PersonalNote {
  id: string;
  techniqueId: string;
  techniqueName: string;
  moduleCode: string;
  beltName: string;
  beltColor: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteFormData {
  content: string;
}

interface NotesState {
  notes: PersonalNote[];
  currentNote: PersonalNote | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

// ============================================
// HOOK useNotes
// ============================================

export function useNotes(techniqueId?: string) {
  const [state, setState] = useState<NotesState>({
    notes: [],
    currentNote: null,
    isLoading: false,
    isSaving: false,
    error: null,
  });

  // Charger toutes les notes de l'utilisateur
  const fetchAllNotes = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/notes');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Vous devez être connecté pour voir vos notes');
        }
        throw new Error('Erreur lors du chargement des notes');
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        notes: data.notes,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      }));
    }
  }, []);

  // Charger la note pour une technique spécifique
  const fetchNoteForTechnique = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/notes?techniqueId=${encodeURIComponent(id)}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Vous devez être connecté pour voir vos notes');
        }
        throw new Error('Erreur lors du chargement de la note');
      }

      const data = await response.json();
      setState(prev => ({
        ...prev,
        currentNote: data.note || null,
        isLoading: false,
        error: null,
      }));
      return data.note || null;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      }));
      return null;
    }
  }, []);

  // Sauvegarder une note (créer ou mettre à jour)
  const saveNote = useCallback(async (techniqueId: string, content: string) => {
    setState(prev => ({ ...prev, isSaving: true, error: null }));

    // Optimistic update
    const previousNote = state.currentNote;
    setState(prev => ({
      ...prev,
      currentNote: previousNote
        ? { ...previousNote, content }
        : {
            id: 'temp-' + Date.now(),
            techniqueId,
            techniqueName: '',
            moduleCode: '',
            beltName: '',
            beltColor: '',
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
    }));

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ techniqueId, content }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Vous devez être connecté pour sauvegarder une note');
        }
        throw new Error('Erreur lors de la sauvegarde');
      }

      const savedNote = await response.json();
      
      setState(prev => ({
        ...prev,
        currentNote: savedNote,
        isSaving: false,
        error: null,
      }));

      // Mettre à jour la liste des notes si elle est chargée
      setState(prev => ({
        ...prev,
        notes: prev.notes.map(n => 
          n.techniqueId === techniqueId ? savedNote : n
        ),
      }));

      return savedNote;
    } catch (error) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        currentNote: previousNote,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      }));
      throw error;
    }
  }, [state.currentNote]);

  // Supprimer une note
  const deleteNote = useCallback(async (noteId: string) => {
    setState(prev => ({ ...prev, isSaving: true, error: null }));

    // Optimistic update
    const previousNote = state.currentNote;
    setState(prev => ({
      ...prev,
      currentNote: null,
      notes: prev.notes.filter(n => n.id !== noteId),
    }));

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Vous devez être connecté pour supprimer une note');
        }
        throw new Error('Erreur lors de la suppression');
      }

      setState(prev => ({
        ...prev,
        isSaving: false,
        error: null,
      }));
    } catch (error) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        currentNote: previousNote,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      }));
      throw error;
    }
  }, [state.currentNote, state.notes]);

  // Charger la note au montage si techniqueId est fourni
  useEffect(() => {
    if (techniqueId) {
      fetchNoteForTechnique(techniqueId);
    }
  }, [techniqueId, fetchNoteForTechnique]);

  return {
    notes: state.notes,
    currentNote: state.currentNote,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    fetchAllNotes,
    fetchNoteForTechnique,
    saveNote,
    deleteNote,
  };
}

// ============================================
// HOOK useLocalNotes (fallback sans API)
// ============================================

const STORAGE_KEY = 'fekm-notes';

export function useLocalNotes(techniqueId?: string) {
  const [state, setState] = useState<{
    notes: Record<string, string>;
    isLoading: boolean;
  }>({
    notes: {},
    isLoading: true,
  });

  // Charger les notes du localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState({ notes: parsed, isLoading: false });
      } catch {
        setState({ notes: {}, isLoading: false });
      }
    } else {
      setState({ notes: {}, isLoading: false });
    }
  }, []);

  // Sauvegarder dans le localStorage
  const saveNote = useCallback((id: string, content: string) => {
    setState(prev => {
      const updated = { ...prev.notes, [id]: content };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { ...prev, notes: updated };
    });
  }, []);

  // Supprimer une note
  const deleteNote = useCallback((id: string) => {
    setState(prev => {
      const updated = { ...prev.notes };
      delete updated[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { ...prev, notes: updated };
    });
  }, []);

  // Récupérer la note courante
  const currentNote = techniqueId ? state.notes[techniqueId] || '' : '';

  return {
    notes: state.notes,
    currentNote,
    isLoading: state.isLoading,
    saveNote,
    deleteNote,
  };
}

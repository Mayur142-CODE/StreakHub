'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotesItems,
  getNotesItemById,
  createNotesItem,
  updateNotesItem,
  saveNoteContent,
  deleteNotesItem,
  duplicateNotesFile,
} from '@/services/notes'
import type { NotesItem, NotesItemInsert, NotesItemUpdate } from '@/types/database'
import { toast } from 'sonner'

export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: getNotesItems,
  })
}

export function useNote(id: string | null) {
  return useQuery({
    queryKey: ['notes', id],
    queryFn: () => (id ? getNotesItemById(id) : null),
    enabled: !!id,
  })
}

export function useCreateNotesItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (item: Omit<NotesItemInsert, 'user_id'>) => createNotesItem(item),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success(`${data.type === 'folder' ? 'Folder' : 'File'} created!`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create item')
    },
  })
}

export function useUpdateNotesItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: NotesItemUpdate }) =>
      updateNotesItem(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['notes', data.id] })
      toast.success(`${data.type === 'folder' ? 'Folder' : 'File'} updated!`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update item')
    },
  })
}

export function useSaveNoteContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      saveNoteContent(id, content),
    onSuccess: (data) => {
      // Update cache in place so it stays responsive
      queryClient.setQueryData<NotesItem[]>(['notes'], (old) => {
        if (!old) return old
        return old.map((item) => (item.id === data.id ? { ...item, content: data.content, updated_at: data.updated_at } : item))
      })
      queryClient.setQueryData<NotesItem>(['notes', data.id], data)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to auto-save note')
    },
  })
}

export function useDeleteNotesItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteNotesItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success('Item deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete item')
    },
  })
}

export function useDuplicateNotesItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => duplicateNotesFile(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.success(`Duplicated "${data.name}"`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to duplicate file')
    },
  })
}

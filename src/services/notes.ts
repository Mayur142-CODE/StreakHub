import { createClient } from '@/lib/supabase/client'
import type { NotesItem, NotesItemInsert, NotesItemUpdate } from '@/types/database'
import {
  sanitizeFileName,
  sanitizeFolderName,
  isDuplicateName,
  isDescendantOrSelf,
} from '@/features/notes/utils/tree-utils'

const supabase = createClient()

export async function getNotesItems(): Promise<NotesItem[]> {
  const { data, error } = await supabase
    .from('notes_items')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getNotesItemById(id: string): Promise<NotesItem> {
  const { data, error } = await supabase
    .from('notes_items')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createNotesItem(
  item: Omit<NotesItemInsert, 'user_id'>
): Promise<NotesItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Validation
  const type = item.type
  let name = item.name.trim()

  if (type === 'file') {
    name = sanitizeFileName(name)
  } else {
    name = sanitizeFolderName(name)
  }

  // Check duplicate
  const existingItems = await getNotesItems()
  if (isDuplicateName(name, item.parent_id ?? null, null, existingItems)) {
    throw new Error(`An item named "${name}" already exists in this folder.`)
  }

  const payload: NotesItemInsert = {
    user_id: user.id,
    parent_id: item.parent_id ?? null,
    name,
    type,
    content: type === 'file' ? item.content ?? '' : null,
  }

  const { data, error } = await supabase
    .from('notes_items')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateNotesItem(
  id: string,
  updates: NotesItemUpdate
): Promise<NotesItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const existingItems = await getNotesItems()
  const currentItem = existingItems.find((i) => i.id === id)
  if (!currentItem) throw new Error('Item not found')

  const finalUpdates: NotesItemUpdate = { ...updates }

  // 1. If renaming
  if (updates.name !== undefined) {
    let cleanName = updates.name.trim()
    if (currentItem.type === 'file') {
      cleanName = sanitizeFileName(cleanName)
    } else {
      cleanName = sanitizeFolderName(cleanName)
    }
    finalUpdates.name = cleanName

    const targetParentId =
      updates.parent_id !== undefined ? updates.parent_id : currentItem.parent_id

    if (isDuplicateName(cleanName, targetParentId ?? null, id, existingItems)) {
      throw new Error(`An item named "${cleanName}" already exists in this folder.`)
    }
  }

  // 2. If moving (parent_id updated)
  if (updates.parent_id !== undefined && updates.parent_id !== currentItem.parent_id) {
    const targetParentId = updates.parent_id

    // Check circular move for folders
    if (currentItem.type === 'folder' && targetParentId) {
      if (isDescendantOrSelf(id, targetParentId, existingItems)) {
        throw new Error('Cannot move a folder into itself or one of its subfolders.')
      }
    }

    // Check duplicate name in destination folder
    const targetName = finalUpdates.name || currentItem.name
    if (isDuplicateName(targetName, targetParentId ?? null, id, existingItems)) {
      throw new Error(`An item named "${targetName}" already exists in the destination folder.`)
    }
  }

  const { data, error } = await supabase
    .from('notes_items')
    .update(finalUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveNoteContent(id: string, content: string): Promise<NotesItem> {
  const { data, error } = await supabase
    .from('notes_items')
    .update({ content })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteNotesItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function duplicateNotesFile(id: string): Promise<NotesItem> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const existingItems = await getNotesItems()
  const original = existingItems.find((i) => i.id === id)
  if (!original) throw new Error('File not found')
  if (original.type !== 'file') throw new Error('Cannot duplicate a folder')

  // Generate copy name
  const baseName = original.name.replace(/\.txt$/i, '')
  let copyIndex = 1
  let newName = `${baseName} (copy).txt`

  while (isDuplicateName(newName, original.parent_id, null, existingItems)) {
    copyIndex++
    newName = `${baseName} (${copyIndex}).txt`
  }

  const payload: NotesItemInsert = {
    user_id: user.id,
    parent_id: original.parent_id,
    name: newName,
    type: 'file',
    content: original.content ?? '',
  }

  const { data, error } = await supabase
    .from('notes_items')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

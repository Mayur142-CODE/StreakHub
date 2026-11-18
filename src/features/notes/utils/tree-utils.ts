import type { NotesItem } from '@/types/database'
import JSZip from 'jszip'

export interface NotesTreeNode extends NotesItem {
  children: NotesTreeNode[]
  totalFiles: number // Total .txt files in this folder and subfolders
  directFiles: number
  directFolders: number
  level: number
}

/**
 * Ensures a file name has a single .txt extension and no invalid filesystem characters
 */
export function sanitizeFileName(name: string): string {
  let cleaned = name.trim().replace(/[\\/:*?"<>|]/g, '_')
  if (!cleaned) cleaned = 'Untitled'
  if (!cleaned.toLowerCase().endsWith('.txt')) {
    cleaned = `${cleaned}.txt`
  }
  return cleaned
}

/**
 * Ensures a folder name has no invalid filesystem characters
 */
export function sanitizeFolderName(name: string): string {
  let cleaned = name.trim().replace(/[\\/:*?"<>|]/g, '_')
  if (!cleaned) cleaned = 'New Folder'
  return cleaned
}

/**
 * Checks if a proposed name already exists in the same parent folder (case-insensitive)
 */
export function isDuplicateName(
  name: string,
  parentId: string | null,
  currentId: string | null,
  items: NotesItem[]
): boolean {
  const normalized = name.trim().toLowerCase()
  return items.some(
    (item) =>
      item.id !== currentId &&
      (item.parent_id ?? null) === (parentId ?? null) &&
      item.name.trim().toLowerCase() === normalized
  )
}

/**
 * Checks if targetFolderId is the same as sourceFolderId or any descendant of sourceFolderId
 * Prevents circular folder moves
 */
export function isDescendantOrSelf(
  sourceFolderId: string,
  targetFolderId: string | null,
  items: NotesItem[]
): boolean {
  if (!targetFolderId) return false
  if (sourceFolderId === targetFolderId) return true

  const childrenMap = new Map<string, string[]>()
  for (const item of items) {
    if (item.type === 'folder' && item.parent_id) {
      const list = childrenMap.get(item.parent_id) || []
      list.push(item.id)
      childrenMap.set(item.parent_id, list)
    }
  }

  // BFS / DFS to check if targetFolderId is in the subtree of sourceFolderId
  const queue = [sourceFolderId]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === targetFolderId) return true
    if (!visited.has(current)) {
      visited.add(current)
      const children = childrenMap.get(current) || []
      for (const child of children) {
        if (!visited.has(child)) {
          queue.push(child)
        }
      }
    }
  }

  return false
}

/**
 * Gets all descendant IDs for a given folder (for confirmation dialog details)
 */
export function getDescendantCounts(
  folderId: string,
  items: NotesItem[]
): { folders: number; files: number } {
  const childrenMap = new Map<string, NotesItem[]>()
  for (const item of items) {
    if (item.parent_id) {
      const list = childrenMap.get(item.parent_id) || []
      list.push(item)
      childrenMap.set(item.parent_id, list)
    }
  }

  let folders = 0
  let files = 0
  const queue = [folderId]

  while (queue.length > 0) {
    const current = queue.shift()!
    const children = childrenMap.get(current) || []
    for (const child of children) {
      if (child.type === 'folder') {
        folders++
        queue.push(child.id)
      } else {
        files++
      }
    }
  }

  return { folders, files }
}

/**
 * Builds a hierarchical tree from a flat list of NotesItem
 */
export function buildNotesTree(
  items: NotesItem[],
  sortBy: 'name-asc' | 'name-desc' | 'updated-desc' | 'created-desc' = 'name-asc'
): NotesTreeNode[] {
  const itemMap = new Map<string, NotesTreeNode>()

  // 1. Initialize tree nodes
  for (const item of items) {
    itemMap.set(item.id, {
      ...item,
      children: [],
      totalFiles: 0,
      directFiles: 0,
      directFolders: 0,
      level: 0,
    })
  }

  const rootNodes: NotesTreeNode[] = []

  // 2. Assemble parent-child relationships
  for (const item of items) {
    const node = itemMap.get(item.id)!
    if (item.parent_id && itemMap.has(item.parent_id)) {
      const parent = itemMap.get(item.parent_id)!
      parent.children.push(node)
      if (node.type === 'file') {
        parent.directFiles++
      } else {
        parent.directFolders++
      }
    } else {
      rootNodes.push(node)
    }
  }

  // 3. Compute totalFiles recursively and assign levels
  function processNode(node: NotesTreeNode, level: number): number {
    node.level = level
    let count = node.type === 'file' ? 1 : 0

    for (const child of node.children) {
      count += processNode(child, level + 1)
    }

    node.totalFiles = node.type === 'folder' ? count : 0

    // Sort children: folders first, then files, then according to sortBy
    node.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      switch (sortBy) {
        case 'name-desc':
          return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' })
        case 'updated-desc':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'created-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      }
    })

    return count
  }

  // Process all roots
  for (const root of rootNodes) {
    processNode(root, 0)
  }

  // Sort root nodes
  rootNodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    switch (sortBy) {
      case 'name-desc':
        return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' })
      case 'updated-desc':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      case 'created-desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'name-asc':
      default:
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    }
  })

  return rootNodes
}

/**
 * Returns breadcrumb items from root down to the given item
 */
export function getBreadcrumbs(
  itemId: string | null,
  items: NotesItem[]
): NotesItem[] {
  if (!itemId) return []
  const itemsMap = new Map<string, NotesItem>(items.map((i) => [i.id, i]))
  const crumbs: NotesItem[] = []

  let curr = itemsMap.get(itemId)
  while (curr) {
    crumbs.unshift(curr)
    curr = curr.parent_id ? itemsMap.get(curr.parent_id) : undefined
  }

  return crumbs
}

/**
 * Returns a human-readable folder path string (e.g. "Programming / C++")
 */
export function getFolderPathString(
  parentId: string | null,
  items: NotesItem[]
): string {
  if (!parentId) return 'Root (StreakHub Notes)'
  const crumbs = getBreadcrumbs(parentId, items)
  return crumbs.map((c) => c.name).join(' / ')
}

/**
 * Triggers a browser download of an individual .txt file
 */
export function downloadIndividualFile(file: NotesItem): void {
  const filename = sanitizeFileName(file.name)
  const blob = new Blob([file.content ?? ''], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Recursively builds and downloads a ZIP file preserving folder structure
 */
export async function downloadFolderAsZip(
  folder: NotesItem,
  allItems: NotesItem[]
): Promise<void> {
  const zip = new JSZip()
  const itemsMap = new Map<string, NotesItem>(allItems.map((i) => [i.id, i]))

  // Map of parentId -> array of child items
  const childrenMap = new Map<string, NotesItem[]>()
  for (const item of allItems) {
    if (item.parent_id) {
      const list = childrenMap.get(item.parent_id) || []
      list.push(item)
      childrenMap.set(item.parent_id, list)
    }
  }

  // Recursive function to add folder contents into zip folder
  function addToZip(currentFolder: NotesItem, zipFolder: JSZip) {
    const children = childrenMap.get(currentFolder.id) || []
    for (const child of children) {
      if (child.type === 'file') {
        const fileName = sanitizeFileName(child.name)
        zipFolder.file(fileName, child.content ?? '')
      } else if (child.type === 'folder') {
        const subFolder = zipFolder.folder(child.name)
        if (subFolder) {
          addToZip(child, subFolder)
        }
      }
    }
  }

  // The root folder inside the zip has the name of the selected folder
  const rootZipFolder = zip.folder(folder.name) || zip
  addToZip(folder, rootZipFolder)

  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = `${folder.name}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

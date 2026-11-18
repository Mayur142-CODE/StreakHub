'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, FolderPlus, Folder } from 'lucide-react'
import type { NotesItem } from '@/types/database'
import { getBreadcrumbs, sanitizeFileName, sanitizeFolderName } from '@/features/notes/utils/tree-utils'

interface CreateItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialType?: 'file' | 'folder'
  initialParentId?: string | null
  items: NotesItem[]
  onCreate: (data: { name: string; type: 'file' | 'folder'; parent_id: string | null }) => void
  isSubmitting?: boolean
}

export function CreateItemDialog({
  open,
  onOpenChange,
  initialType = 'file',
  initialParentId = null,
  items,
  onCreate,
  isSubmitting = false,
}: CreateItemDialogProps) {
  const [type, setType] = React.useState<'file' | 'folder'>(initialType)
  const [name, setName] = React.useState('')
  const [parentId, setParentId] = React.useState<string | null>(initialParentId)
  const [error, setError] = React.useState<string | null>(null)

  // Reset fields when dialog opens
  React.useEffect(() => {
    if (open) {
      setType(initialType)
      setName(initialType === 'file' ? 'New Note.txt' : 'New Folder')
      setParentId(initialParentId)
      setError(null)
    }
  }, [open, initialType, initialParentId])

  // Get all available folders for parent selection
  const folders = React.useMemo(() => {
    return items
      .filter((i) => i.type === 'folder')
      .map((f) => {
        const crumbs = getBreadcrumbs(f.id, items)
        return {
          id: f.id,
          name: f.name,
          path: crumbs.map((c) => c.name).join(' / '),
        }
      })
      .sort((a, b) => a.path.localeCompare(b.path))
  }, [items])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const rawName = name.trim()
    if (!rawName) {
      setError('Please provide a name.')
      return
    }

    if (type === 'file') {
      // Disallow illegal extensions (e.g., .js, .pdf, .docx, .md)
      const lastDot = rawName.lastIndexOf('.')
      if (lastDot !== -1) {
        const ext = rawName.substring(lastDot).toLowerCase()
        if (ext !== '.txt') {
          setError(`Only .txt files are permitted. You entered "${ext}".`)
          return
        }
      }
      const clean = sanitizeFileName(rawName)
      onCreate({
        name: clean,
        type: 'file',
        parent_id: parentId,
      })
    } else {
      const clean = sanitizeFolderName(rawName)
      onCreate({
        name: clean,
        type: 'folder',
        parent_id: parentId,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                {type === 'file' ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <FolderPlus className="w-5 h-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {type === 'file' ? 'Create New Note' : 'Create New Folder'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {type === 'file'
                    ? 'Plain-text notes are saved with .txt extension.'
                    : 'Organize your notes into nested categories and topics.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Type Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 bg-secondary/50 rounded-lg gap-1 border border-border/40">
            <button
              type="button"
              onClick={() => {
                setType('file')
                if (!name.endsWith('.txt')) {
                  setName(name ? `${name.replace(/\.[^/.]+$/, '')}.txt` : 'New Note.txt')
                }
              }}
              className={`flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                type === 'file'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text File (.txt)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('folder')
                setName(name.replace(/\.txt$/i, '') || 'New Folder')
              }}
              className={`flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                type === 'folder'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Folder</span>
            </button>
          </div>

          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="item-name" className="text-xs font-medium">
              {type === 'file' ? 'File Name' : 'Folder Name'}
            </Label>
            <div className="relative">
              <Input
                id="item-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                placeholder={type === 'file' ? 'e.g. Arrays.txt' : 'e.g. Algorithms'}
                className="h-9 text-sm pr-12"
                autoFocus
              />
              {type === 'file' && (
                <span className="absolute right-3 top-2 text-xs font-mono text-muted-foreground select-none">
                  .txt
                </span>
              )}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Destination Folder */}
          <div className="space-y-2">
            <Label htmlFor="parent-folder" className="text-xs font-medium flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Location</span>
            </Label>
            <select
              id="parent-folder"
              value={parentId ?? ''}
              onChange={(e) => setParentId(e.target.value ? e.target.value : null)}
              className="w-full h-9 rounded-lg border border-input bg-background/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            >
              <option value="">📁 Root (StreakHub Notes/)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📂 {f.path}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting
                ? 'Creating...'
                : type === 'file'
                ? 'Create File'
                : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

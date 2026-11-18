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
import { Label } from '@/components/ui/label'
import { FolderInput, Folder, FileText } from 'lucide-react'
import type { NotesItem } from '@/types/database'
import {
  getBreadcrumbs,
  isDescendantOrSelf,
  isDuplicateName,
  getFolderPathString,
} from '@/features/notes/utils/tree-utils'

interface MoveItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: NotesItem | null
  items: NotesItem[]
  onMove: (id: string, newParentId: string | null) => void
  isSubmitting?: boolean
}

export function MoveItemDialog({
  open,
  onOpenChange,
  item,
  items,
  onMove,
  isSubmitting = false,
}: MoveItemDialogProps) {
  const [targetParentId, setTargetParentId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open && item) {
      setTargetParentId(item.parent_id)
      setError(null)
    }
  }, [open, item])

  if (!item) return null

  // Allowed destination folders:
  // If item is a folder, it cannot move into itself or any of its descendants!
  const validFolders = items
    .filter((f) => {
      if (f.type !== 'folder') return false
      if (item.type === 'folder') {
        return !isDescendantOrSelf(item.id, f.id, items)
      }
      return true
    })
    .map((f) => {
      const crumbs = getBreadcrumbs(f.id, items)
      return {
        id: f.id,
        name: f.name,
        path: crumbs.map((c) => c.name).join(' / '),
      }
    })
    .sort((a, b) => a.path.localeCompare(b.path))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (targetParentId === item.parent_id) {
      onOpenChange(false)
      return
    }

    // Check circular move safety
    if (item.type === 'folder' && targetParentId) {
      if (isDescendantOrSelf(item.id, targetParentId, items)) {
        setError('Cannot move a folder into itself or one of its subfolders.')
        return
      }
    }

    // Check duplicate name in target destination
    if (isDuplicateName(item.name, targetParentId, item.id, items)) {
      setError(
        `An item named "${item.name}" already exists in the selected destination folder.`
      )
      return
    }

    onMove(item.id, targetParentId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-secondary text-foreground rounded-xl">
                <FolderInput className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  Move {item.type === 'file' ? 'File' : 'Folder'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Select a destination folder for &quot;{item.name}&quot;.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Current location display */}
          <div className="p-3 bg-secondary/30 rounded-lg text-xs space-y-1 border border-border/30">
            <span className="text-muted-foreground font-medium">Current Location:</span>
            <div className="font-mono text-foreground flex items-center gap-1.5 truncate">
              {item.type === 'file' ? (
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="truncate">{getFolderPathString(item.parent_id, items)}</span>
            </div>
          </div>

          {/* Destination Selector */}
          <div className="space-y-2">
            <Label htmlFor="destination-folder" className="text-xs font-medium">
              Destination Location
            </Label>
            <select
              id="destination-folder"
              value={targetParentId ?? ''}
              onChange={(e) => {
                setTargetParentId(e.target.value ? e.target.value : null)
                setError(null)
              }}
              className="w-full h-10 rounded-lg border border-input bg-background/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            >
              <option value="">📁 Root (StreakHub Notes/)</option>
              {validFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  📂 {f.path}
                </option>
              ))}
            </select>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
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
              {isSubmitting ? 'Moving...' : 'Move Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

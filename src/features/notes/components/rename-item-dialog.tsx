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
import { Pencil } from 'lucide-react'
import type { NotesItem } from '@/types/database'
import { sanitizeFileName, sanitizeFolderName, isDuplicateName } from '@/features/notes/utils/tree-utils'

interface RenameItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: NotesItem | null
  items: NotesItem[]
  onRename: (id: string, newName: string) => void
  isSubmitting?: boolean
}

export function RenameItemDialog({
  open,
  onOpenChange,
  item,
  items,
  onRename,
  isSubmitting = false,
}: RenameItemDialogProps) {
  const [name, setName] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open && item) {
      if (item.type === 'file') {
        // Strip .txt for the input field to make editing clean
        setName(item.name.replace(/\.txt$/i, ''))
      } else {
        setName(item.name)
      }
      setError(null)
    }
  }, [open, item])

  if (!item) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const raw = name.trim()
    if (!raw) {
      setError('Name cannot be empty.')
      return
    }

    let finalName = raw
    if (item.type === 'file') {
      // Disallow illegal extensions typed by user
      const lastDot = raw.lastIndexOf('.')
      if (lastDot !== -1) {
        const ext = raw.substring(lastDot).toLowerCase()
        if (ext !== '.txt') {
          setError(`Only .txt extension is permitted. You typed "${ext}".`)
          return
        }
      }
      finalName = sanitizeFileName(raw)
    } else {
      finalName = sanitizeFolderName(raw)
    }

    if (finalName === item.name) {
      onOpenChange(false)
      return
    }

    if (isDuplicateName(finalName, item.parent_id, item.id, items)) {
      setError(`An item named "${finalName}" already exists in this folder.`)
      return
    }

    onRename(item.id, finalName)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-secondary text-foreground rounded-xl">
                <Pencil className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  Rename {item.type === 'file' ? 'File' : 'Folder'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Update the name of this {item.type}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rename-input" className="text-xs font-medium">
              Name
            </Label>
            <div className="relative">
              <Input
                id="rename-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                className="h-9 text-sm pr-12"
                autoFocus
              />
              {item.type === 'file' && (
                <span className="absolute right-3 top-2 text-xs font-mono text-muted-foreground select-none">
                  .txt
                </span>
              )}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
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
              {isSubmitting ? 'Saving...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
import { Trash2, AlertTriangle } from 'lucide-react'
import type { NotesItem } from '@/types/database'
import { getDescendantCounts } from '@/features/notes/utils/tree-utils'

interface DeleteNotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: NotesItem | null
  items: NotesItem[]
  onConfirm: () => void
  isDeleting?: boolean
}

export function DeleteNotesDialog({
  open,
  onOpenChange,
  item,
  items,
  onConfirm,
  isDeleting = false,
}: DeleteNotesDialogProps) {
  if (!item) return null

  const isFolder = item.type === 'folder'
  const counts = isFolder ? getDescendantCounts(item.id, items) : { folders: 0, files: 0 }
  const totalNested = counts.folders + counts.files

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive/10 rounded-full shrink-0">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Delete {isFolder ? 'Folder' : 'File'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </div>
          </div>

          <div className="pt-3 text-sm text-foreground/90 space-y-2">
            <p>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground underline decoration-destructive/40">
                {item.name}
              </span>
              ?
            </p>

            {isFolder && totalNested > 0 && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20 mt-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">All nested contents will also be deleted:</p>
                  <p>
                    {counts.files} {counts.files === 1 ? 'file' : 'files'}
                    {counts.folders > 0 && ` and ${counts.folders} subfolders`} will be permanently lost.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? 'Deleting...' : `Delete ${isFolder ? 'Folder' : 'File'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

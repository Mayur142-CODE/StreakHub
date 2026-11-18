'use client'

import * as React from 'react'
import {
  FilePlus,
  FolderPlus,
  Pencil,
  FolderInput,
  Download,
  Trash2,
  Menu,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import type { NotesItem } from '@/types/database'

interface NotesToolbarProps {
  selectedItem: NotesItem | null
  totalItemsCount: number
  onCreateFile: (parentId: string | null) => void
  onCreateFolder: (parentId: string | null) => void
  onRename: (item: NotesItem) => void
  onMove: (item: NotesItem) => void
  onDelete: (item: NotesItem) => void
  onDownload: (item: NotesItem) => void
  onDownloadAllAsZip: () => void
  onSeedSampleNotes?: () => void
  isMobileExplorerOpen: boolean
  setIsMobileExplorerOpen: (open: boolean) => void
  renderMobileExplorer: () => React.ReactNode
}

export function NotesToolbar({
  selectedItem,
  totalItemsCount,
  onCreateFile,
  onCreateFolder,
  onRename,
  onMove,
  onDelete,
  onDownload,
  onDownloadAllAsZip,
  onSeedSampleNotes,
  isMobileExplorerOpen,
  setIsMobileExplorerOpen,
  renderMobileExplorer,
}: NotesToolbarProps) {
  const currentParentId = selectedItem
    ? selectedItem.type === 'folder'
      ? selectedItem.id
      : selectedItem.parent_id
    : null

  return (
    <div className="flex items-center justify-between p-3 border-b border-border/40 bg-card rounded-t-xl select-none">
      {/* Left: Mobile trigger & Workbench Title */}
      <div className="flex items-center gap-3">
        {/* Mobile File Explorer Drawer */}
        <Sheet open={isMobileExplorerOpen} onOpenChange={setIsMobileExplorerOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden h-8 gap-1.5 text-xs"
              >
                <Menu className="w-4 h-4" />
                <span>Files</span>
              </Button>
            }
          />
          <SheetContent side="left" className="w-80 p-0">
            {renderMobileExplorer()}
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary hidden sm:flex">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
              Notes &amp; Knowledge Base
            </h1>
          </div>
        </div>
      </div>

      {/* Right/Top Actions Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Always visible: New File & New Folder */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 bg-secondary/30 hover:bg-secondary"
          onClick={() => onCreateFile(currentParentId)}
        >
          <FilePlus className="w-3.5 h-3.5 text-primary" />
          <span className="hidden sm:inline">New File</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 bg-secondary/30 hover:bg-secondary"
          onClick={() => onCreateFolder(currentParentId)}
        >
          <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">New Folder</span>
        </Button>

        {/* Actions relevant to current selection */}
        {selectedItem && (
          <>
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => onRename(selectedItem)}
              title="Rename selected item"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Rename</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => onMove(selectedItem)}
              title="Move selected item"
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Move</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => onDownload(selectedItem)}
              title={selectedItem.type === 'file' ? 'Download .txt' : 'Download folder as ZIP'}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Download</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(selectedItem)}
              title="Delete selected item"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
              <span className="hidden md:inline">Delete</span>
            </Button>
          </>
        )}

        {/* Global actions when nothing selected or downloading all */}
        {!selectedItem && totalItemsCount > 0 && (
          <>
            <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={onDownloadAllAsZip}
              title="Download entire Knowledge Base as ZIP"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export ZIP</span>
            </Button>
          </>
        )}

        {totalItemsCount === 0 && onSeedSampleNotes && (
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={onSeedSampleNotes}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">Sample Notes</span>
          </Button>
        )}
      </div>
    </div>
  )
}

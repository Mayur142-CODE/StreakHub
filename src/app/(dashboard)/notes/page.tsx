'use client'

import * as React from 'react'
import JSZip from 'jszip'
import {
  useNotes,
  useCreateNotesItem,
  useUpdateNotesItem,
  useSaveNoteContent,
  useDeleteNotesItem,
  useDuplicateNotesItem,
} from '@/hooks/use-notes'
import { NotesToolbar } from '@/features/notes/components/notes-toolbar'
import { NotesFileExplorer } from '@/features/notes/components/notes-file-explorer'
import { NotesEditor } from '@/features/notes/components/notes-editor'
import { CreateItemDialog } from '@/features/notes/components/create-item-dialog'
import { RenameItemDialog } from '@/features/notes/components/rename-item-dialog'
import { MoveItemDialog } from '@/features/notes/components/move-item-dialog'
import { DeleteNotesDialog } from '@/features/notes/components/delete-notes-dialog'
import {
  downloadIndividualFile,
  downloadFolderAsZip,
  sanitizeFileName,
} from '@/features/notes/utils/tree-utils'
import { seedSampleNotesStructure } from '@/features/notes/utils/sample-data'
import { Skeleton } from '@/components/ui/skeleton'
import type { NotesItem } from '@/types/database'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export default function NotesPage() {
  const queryClient = useQueryClient()
  const { data: items = [], isLoading } = useNotes()

  const createMutation = useCreateNotesItem()
  const updateMutation = useUpdateNotesItem()
  const saveContentMutation = useSaveNoteContent()
  const deleteMutation = useDeleteNotesItem()
  const duplicateMutation = useDuplicateNotesItem()

  // Selected file
  const [selectedFileId, setSelectedFileId] = React.useState<string | null>(null)
  const [isMobileExplorerOpen, setIsMobileExplorerOpen] = React.useState(false)

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [createType, setCreateType] = React.useState<'file' | 'folder'>('file')
  const [createParentId, setCreateParentId] = React.useState<string | null>(null)

  const [isRenameOpen, setIsRenameOpen] = React.useState(false)
  const [itemToRename, setItemToRename] = React.useState<NotesItem | null>(null)

  const [isMoveOpen, setIsMoveOpen] = React.useState(false)
  const [itemToMove, setItemToMove] = React.useState<NotesItem | null>(null)

  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<NotesItem | null>(null)

  const [isSeeding, setIsSeeding] = React.useState(false)

  // Currently active file object
  const activeFile = React.useMemo(() => {
    if (!selectedFileId) return null
    const found = items.find((i) => i.id === selectedFileId && i.type === 'file')
    return found || null
  }, [selectedFileId, items])

  // Select first file automatically if none selected and items exist
  React.useEffect(() => {
    if (!selectedFileId && items.length > 0) {
      const firstFile = items.find((i) => i.type === 'file')
      if (firstFile) {
        setSelectedFileId(firstFile.id)
      }
    }
  }, [items, selectedFileId])

  // Ensure active file is reset if it got deleted
  React.useEffect(() => {
    if (selectedFileId && !activeFile && items.length > 0) {
      const firstFile = items.find((i) => i.type === 'file')
      setSelectedFileId(firstFile ? firstFile.id : null)
    }
  }, [items, selectedFileId, activeFile])

  // Handlers
  const handleSelectFile = (fileId: string) => {
    setSelectedFileId(fileId)
    setIsMobileExplorerOpen(false) // Close mobile drawer when file opened
  }

  const handleOpenCreate = (type: 'file' | 'folder', parentId: string | null) => {
    setCreateType(type)
    setCreateParentId(parentId)
    setIsCreateOpen(true)
  }

  const handleCreateSubmit = async (data: {
    name: string
    type: 'file' | 'folder'
    parent_id: string | null
  }) => {
    try {
      const created = await createMutation.mutateAsync(data)
      setIsCreateOpen(false)
      if (created.type === 'file') {
        setSelectedFileId(created.id)
      }
    } catch {
      // Error handled by mutation toast
    }
  }

  const handleOpenRename = (item: NotesItem) => {
    setItemToRename(item)
    setIsRenameOpen(true)
  }

  const handleRenameSubmit = async (id: string, newName: string) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { name: newName } })
      setIsRenameOpen(false)
      setItemToRename(null)
    } catch {
      // Error handled by mutation toast
    }
  }

  const handleOpenMove = (item: NotesItem) => {
    setItemToMove(item)
    setIsMoveOpen(true)
  }

  const handleMoveSubmit = async (id: string, newParentId: string | null) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { parent_id: newParentId } })
      setIsMoveOpen(false)
      setItemToMove(null)
    } catch {
      // Error handled by mutation toast
    }
  }

  const handleOpenDelete = (item: NotesItem) => {
    setItemToDelete(item)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    const id = itemToDelete.id
    try {
      await deleteMutation.mutateAsync(id)
      if (selectedFileId === id) {
        setSelectedFileId(null)
      }
      setIsDeleteOpen(false)
      setItemToDelete(null)
    } catch {
      // Error handled by mutation toast
    }
  }

  const handleDuplicate = async (fileId: string) => {
    try {
      const duplicated = await duplicateMutation.mutateAsync(fileId)
      setSelectedFileId(duplicated.id)
    } catch {
      // Error handled by mutation toast
    }
  }

  const handleDownload = (item: NotesItem) => {
    if (item.type === 'file') {
      downloadIndividualFile(item)
    } else {
      downloadFolderAsZip(item, items).catch((err) => {
        console.error(err)
        toast.error('Failed to generate ZIP for this folder.')
      })
    }
  }

  const handleDownloadAllAsZip = async () => {
    if (items.length === 0) return
    try {
      const toastId = toast.loading('Exporting entire Knowledge Base as ZIP...')
      const zip = new JSZip()
      const rootFolder = zip.folder('StreakHub Notes') || zip

      const childrenMap = new Map<string, NotesItem[]>()
      for (const item of items) {
        if (item.parent_id) {
          const list = childrenMap.get(item.parent_id) || []
          list.push(item)
          childrenMap.set(item.parent_id, list)
        }
      }

      function addRecursive(parentId: string | null, targetZip: JSZip) {
        const currentItems = items.filter(
          (i) => (i.parent_id ?? null) === (parentId ?? null)
        )
        for (const item of currentItems) {
          if (item.type === 'file') {
            const fileName = sanitizeFileName(item.name)
            targetZip.file(fileName, item.content ?? '')
          } else {
            const sub = targetZip.folder(item.name)
            if (sub) {
              addRecursive(item.id, sub)
            }
          }
        }
      }

      addRecursive(null, rootFolder)

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'StreakHub_Notes.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.dismiss(toastId)
      toast.success('Knowledge Base exported successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export notes as ZIP')
    }
  }

  const handleSeedSampleNotes = async () => {
    if (isSeeding) return
    setIsSeeding(true)
    const toastId = toast.loading('Generating sample notes structure...')
    try {
      await seedSampleNotesStructure()
      await queryClient.invalidateQueries({ queryKey: ['notes'] })
      toast.dismiss(toastId)
      toast.success('Sample Notes & Folders loaded successfully!')
    } catch (err: unknown) {
      toast.dismiss(toastId)
      const msg = err instanceof Error ? err.message : 'Failed to seed sample notes'
      toast.error(msg)
    } finally {
      setIsSeeding(false)
    }
  }

  const renderExplorer = (className?: string) => (
    <NotesFileExplorer
      items={items}
      selectedFileId={selectedFileId}
      onSelectFile={handleSelectFile}
      onCreateItem={handleOpenCreate}
      onRename={handleOpenRename}
      onMove={handleOpenMove}
      onDelete={handleOpenDelete}
      onDuplicate={handleDuplicate}
      onDownloadFile={handleDownload}
      onDownloadZip={handleDownload}
      onSeedSampleNotes={items.length === 0 ? handleSeedSampleNotes : undefined}
      className={className}
    />
  )

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex flex-col border border-border/40 rounded-2xl bg-card overflow-hidden shadow-xs">
        <div className="h-12 border-b border-border/40 p-3 flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-72 border-r border-border/40 p-3 space-y-3 hidden lg:block">
            <Skeleton className="h-8 w-full" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
              <Skeleton className="h-6 w-4/6" />
              <Skeleton className="h-6 w-5/6" />
            </div>
          </div>
          <div className="flex-1 p-6 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-[calc(100vh-6.5rem)] flex flex-col border border-border/40 rounded-2xl bg-card overflow-hidden shadow-xs">
        {/* Top/Right Toolbar */}
        <NotesToolbar
          selectedItem={activeFile}
          totalItemsCount={items.length}
          onCreateFile={(parentId) => handleOpenCreate('file', parentId)}
          onCreateFolder={(parentId) => handleOpenCreate('folder', parentId)}
          onRename={handleOpenRename}
          onMove={handleOpenMove}
          onDelete={handleOpenDelete}
          onDownload={handleDownload}
          onDownloadAllAsZip={handleDownloadAllAsZip}
          onSeedSampleNotes={handleSeedSampleNotes}
          isMobileExplorerOpen={isMobileExplorerOpen}
          setIsMobileExplorerOpen={setIsMobileExplorerOpen}
          renderMobileExplorer={() => renderExplorer('w-full h-full border-r-0')}
        />

        {/* Workbench: File Explorer (Left) + Text Editor (Center) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Left File Explorer */}
          <div className="w-72 xl:w-80 shrink-0 hidden lg:flex h-full">
            {renderExplorer('w-full h-full')}
          </div>

          {/* Center Text Editor Panel */}
          <div className="flex-1 flex h-full overflow-hidden">
            <NotesEditor
              file={activeFile}
              items={items}
              onSaveContent={async (id, content) => {
                await saveContentMutation.mutateAsync({ id, content })
              }}
              onRename={handleOpenRename}
              onMove={handleOpenMove}
              onDelete={handleOpenDelete}
              onDuplicate={handleDuplicate}
              onCreateNewNote={() => handleOpenCreate('file', null)}
              onCreateNewFolder={() => handleOpenCreate('folder', null)}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateItemDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        initialType={createType}
        initialParentId={createParentId}
        items={items}
        onCreate={handleCreateSubmit}
        isSubmitting={createMutation.isPending}
      />

      <RenameItemDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        item={itemToRename}
        items={items}
        onRename={handleRenameSubmit}
        isSubmitting={updateMutation.isPending}
      />

      <MoveItemDialog
        open={isMoveOpen}
        onOpenChange={setIsMoveOpen}
        item={itemToMove}
        items={items}
        onMove={handleMoveSubmit}
        isSubmitting={updateMutation.isPending}
      />

      <DeleteNotesDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        item={itemToDelete}
        items={items}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </>
  )
}

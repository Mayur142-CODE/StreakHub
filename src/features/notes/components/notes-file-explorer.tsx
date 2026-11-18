'use client'

import * as React from 'react'
import {
  Search,
  X,
  FilePlus,
  FolderPlus,
  ChevronsUpDown,
  ChevronsDownUp,
  Folder,
  FileText,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotesTreeItem } from '@/features/notes/components/notes-tree-item'
import {
  buildNotesTree,
  getBreadcrumbs,
  getFolderPathString,
  type NotesTreeNode,
} from '@/features/notes/utils/tree-utils'
import type { NotesItem } from '@/types/database'
import { cn } from '@/lib/utils'

type SortOption = 'name-asc' | 'name-desc' | 'updated-desc' | 'created-desc'

interface NotesFileExplorerProps {
  items: NotesItem[]
  selectedFileId: string | null
  onSelectFile: (fileId: string) => void
  onCreateItem: (type: 'file' | 'folder', parentId: string | null) => void
  onRename: (item: NotesItem) => void
  onMove: (item: NotesItem) => void
  onDelete: (item: NotesItem) => void
  onDuplicate: (fileId: string) => void
  onDownloadFile: (item: NotesItem) => void
  onDownloadZip: (item: NotesItem) => void
  onSeedSampleNotes?: () => void
  className?: string
}

export function NotesFileExplorer({
  items,
  selectedFileId,
  onSelectFile,
  onCreateItem,
  onRename,
  onMove,
  onDelete,
  onDuplicate,
  onDownloadFile,
  onDownloadZip,
  onSeedSampleNotes,
  className,
}: NotesFileExplorerProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortBy, setSortBy] = React.useState<SortOption>('name-asc')
  const [expandedFolderIds, setExpandedFolderIds] = React.useState<Set<string>>(() => {
    // Expand root-level folders by default
    const roots = items.filter((i) => i.type === 'folder' && !i.parent_id)
    return new Set(roots.map((r) => r.id))
  })

  // Whenever a file is selected, ensure its ancestor folders are expanded
  React.useEffect(() => {
    if (selectedFileId) {
      const crumbs = getBreadcrumbs(selectedFileId, items)
      setExpandedFolderIds((prev) => {
        const next = new Set(prev)
        for (const crumb of crumbs) {
          if (crumb.type === 'folder') {
            next.add(crumb.id)
          }
        }
        return next
      })
    }
  }, [selectedFileId, items])

  // Tree representation
  const treeNodes = React.useMemo(() => {
    return buildNotesTree(items, sortBy)
  }, [items, sortBy])

  // All folder IDs for expand all / collapse all
  const allFolderIds = React.useMemo(() => {
    return items.filter((i) => i.type === 'folder').map((f) => f.id)
  }, [items])

  const areAllExpanded =
    allFolderIds.length > 0 &&
    allFolderIds.every((id) => expandedFolderIds.has(id))

  const handleToggleAll = () => {
    if (areAllExpanded) {
      setExpandedFolderIds(new Set())
    } else {
      setExpandedFolderIds(new Set(allFolderIds))
    }
  }

  const handleToggleExpand = (folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  // Filtered search results
  const searchResults = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return null

    return items
      .filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(query)
        const contentMatch =
          item.type === 'file' &&
          (item.content ?? '').toLowerCase().includes(query)
        return nameMatch || contentMatch
      })
      .map((item) => {
        const nameMatch = item.name.toLowerCase().includes(query)
        const content = item.content ?? ''
        let snippet: string | null = null

        if (!nameMatch && item.type === 'file') {
          const idx = content.toLowerCase().indexOf(query)
          if (idx !== -1) {
            const start = Math.max(0, idx - 20)
            const end = Math.min(content.length, idx + query.length + 30)
            snippet = (start > 0 ? '...' : '') + content.substring(start, end).replace(/\n/g, ' ') + (end < content.length ? '...' : '')
          }
        }

        return {
          ...item,
          pathString: getFolderPathString(item.parent_id, items),
          snippet,
        }
      })
  }, [items, searchQuery])

  const totalFiles = React.useMemo(
    () => items.filter((i) => i.type === 'file').length,
    [items]
  )
  const totalFolders = React.useMemo(
    () => items.filter((i) => i.type === 'folder').length,
    [items]
  )

  const sortLabels: Record<SortOption, string> = {
    'name-asc': 'Name (A to Z)',
    'name-desc': 'Name (Z to A)',
    'updated-desc': 'Recently Modified',
    'created-desc': 'Creation Date',
  }

  return (
    <div className={cn('flex flex-col h-full bg-card border-r border-border/40 select-none', className)}>
      {/* Top Header */}
      <div className="p-3 border-b border-border/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              File Explorer
            </h2>
            <p className="text-[11px] text-muted-foreground/70">
              {totalFolders} {totalFolders === 1 ? 'folder' : 'folders'}, {totalFiles} {totalFiles === 1 ? 'file' : 'files'}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="New File (.txt)"
              onClick={() => onCreateItem('file', null)}
            >
              <FilePlus className="w-4 h-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="New Folder"
              onClick={() => onCreateItem('folder', null)}
            >
              <FolderPlus className="w-4 h-4 text-amber-400" />
            </Button>
            {allFolderIds.length > 0 && !searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title={areAllExpanded ? 'Collapse All' : 'Expand All'}
                onClick={handleToggleAll}
              >
                {areAllExpanded ? (
                  <ChevronsDownUp className="w-4 h-4" />
                ) : (
                  <ChevronsUpDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files, folders, notes content..."
            className="h-8 pl-8 pr-7 text-xs bg-secondary/40 border-border/40 placeholder:text-muted-foreground/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
          <span className="flex items-center gap-1 font-medium">
            <ArrowUpDown className="w-3 h-3" />
            Sort:
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-1 text-[11px] hover:text-foreground transition-colors font-medium cursor-pointer">
                  <span>{sortLabels[sortBy]}</span>
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-44 text-xs">
              <DropdownMenuItem
                onClick={() => setSortBy('name-asc')}
                className="cursor-pointer"
              >
                Name (A to Z)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('name-desc')}
                className="cursor-pointer"
              >
                Name (Z to A)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('updated-desc')}
                className="cursor-pointer"
              >
                Recently Modified
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('created-desc')}
                className="cursor-pointer"
              >
                Creation Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Explorer Content / Tree View */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* Case 1: Search Query active */}
        {searchResults !== null ? (
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Search Results ({searchResults.length})
            </div>

            {searchResults.length === 0 ? (
              <div className="py-8 text-center px-4">
                <p className="text-xs text-muted-foreground">
                  No matches found for &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-1 mt-1">
                {searchResults.map((result) => {
                  const isFolder = result.type === 'folder'
                  const isSelected = selectedFileId === result.id

                  return (
                    <div
                      key={result.id}
                      onClick={() => {
                        if (!isFolder) {
                          onSelectFile(result.id)
                        } else {
                          // Expand this folder and open tree
                          setExpandedFolderIds((prev) => new Set([...prev, result.id]))
                          setSearchQuery('')
                        }
                      }}
                      className={cn(
                        'p-2 rounded-lg cursor-pointer transition-colors text-xs border border-transparent',
                        isSelected
                          ? 'bg-secondary text-foreground font-medium border-border/40'
                          : 'hover:bg-secondary/50 text-foreground/90'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isFolder ? (
                          <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                        )}
                        <span className="font-medium truncate">{result.name}</span>
                      </div>

                      <div className="text-[10px] text-muted-foreground truncate mt-1 flex items-center gap-1 font-mono">
                        <span>📁 {result.pathString}</span>
                      </div>

                      {result.snippet && (
                        <div className="text-[10px] text-muted-foreground/80 font-mono bg-secondary/30 p-1 rounded mt-1 line-clamp-1 italic">
                          &quot;{result.snippet}&quot;
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : items.length === 0 ? (
          /* Case 2: Tree is completely empty */
          <div className="py-12 px-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/50 border border-border/40 flex items-center justify-center mx-auto text-muted-foreground">
              <FolderPlus className="w-6 h-6 text-primary/70" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">No notes or folders</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Create a folder or plain-text (.txt) file to organize your knowledge.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 h-8"
                onClick={() => onCreateItem('file', null)}
              >
                <FilePlus className="w-3.5 h-3.5 text-primary" />
                <span>New Note (.txt)</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs gap-1.5 h-8"
                onClick={() => onCreateItem('folder', null)}
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>New Folder</span>
              </Button>
              {onSeedSampleNotes && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs gap-1.5 h-8 mt-2"
                  onClick={onSeedSampleNotes}
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Load Sample Notes</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Case 3: Display Hierarchical Folder Tree */
          treeNodes.map((node) => (
            <NotesTreeItem
              key={node.id}
              node={node}
              selectedFileId={selectedFileId}
              expandedFolderIds={expandedFolderIds}
              onToggleExpand={handleToggleExpand}
              onSelectFile={onSelectFile}
              onCreateItem={(type, parentId) => onCreateItem(type, parentId)}
              onRename={onRename}
              onMove={onMove}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onDownloadFile={onDownloadFile}
              onDownloadZip={onDownloadZip}
            />
          ))
        )}
      </div>
    </div>
  )
}

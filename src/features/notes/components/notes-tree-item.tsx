'use client'

import * as React from 'react'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  MoreVertical,
  Plus,
  FolderPlus,
  Pencil,
  FolderInput,
  Download,
  Copy,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NotesTreeNode } from '@/features/notes/utils/tree-utils'
import type { NotesItem } from '@/types/database'

interface NotesTreeItemProps {
  node: NotesTreeNode
  selectedFileId: string | null
  expandedFolderIds: Set<string>
  onToggleExpand: (folderId: string) => void
  onSelectFile: (fileId: string) => void
  onCreateItem: (type: 'file' | 'folder', parentId: string) => void
  onRename: (item: NotesItem) => void
  onMove: (item: NotesItem) => void
  onDelete: (item: NotesItem) => void
  onDuplicate: (fileId: string) => void
  onDownloadFile: (item: NotesItem) => void
  onDownloadZip: (item: NotesItem) => void
}

export function NotesTreeItem({
  node,
  selectedFileId,
  expandedFolderIds,
  onToggleExpand,
  onSelectFile,
  onCreateItem,
  onRename,
  onMove,
  onDelete,
  onDuplicate,
  onDownloadFile,
  onDownloadZip,
}: NotesTreeItemProps) {
  const isFolder = node.type === 'folder'
  const isExpanded = expandedFolderIds.has(node.id)
  const isSelected = selectedFileId === node.id

  const paddingLeft = node.level * 16 + 12

  if (isFolder) {
    return (
      <div className="select-none text-xs">
        {/* Folder Row */}
        <div
          className={cn(
            'group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-colors duration-150',
            'hover:bg-secondary/60 text-foreground/80 hover:text-foreground'
          )}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => onToggleExpand(node.id)}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              type="button"
              className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand(node.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500/90 shrink-0" />
            )}

            <span className="truncate font-medium text-[13px]">{node.name}</span>

            {/* Total nested files count */}
            {node.totalFiles > 0 && (
              <span className="text-[10px] text-muted-foreground/70 bg-secondary/80 px-1.5 py-0.2 rounded-full font-mono shrink-0 ml-1">
                {node.totalFiles}
              </span>
            )}
          </div>

          {/* Context menu for folder */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44 rounded-xl text-xs shadow-lg">
                <DropdownMenuItem
                  onClick={() => onCreateItem('file', node.id)}
                  className="cursor-pointer gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>New Note (.txt)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onCreateItem('folder', node.id)}
                  className="cursor-pointer gap-2"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Subfolder</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRename(node)}
                  className="cursor-pointer gap-2"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onMove(node)}
                  className="cursor-pointer gap-2"
                >
                  <FolderInput className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Move</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDownloadZip(node)}
                  className="cursor-pointer gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download ZIP</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(node)}
                  className="cursor-pointer gap-2 text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Children (subfolders and files) */}
        {isExpanded && node.children.length > 0 && (
          <div className="space-y-0.5 mt-0.5">
            {node.children.map((child) => (
              <NotesTreeItem
                key={child.id}
                node={child}
                selectedFileId={selectedFileId}
                expandedFolderIds={expandedFolderIds}
                onToggleExpand={onToggleExpand}
                onSelectFile={onSelectFile}
                onCreateItem={onCreateItem}
                onRename={onRename}
                onMove={onMove}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onDownloadFile={onDownloadFile}
                onDownloadZip={onDownloadZip}
              />
            ))}
          </div>
        )}

        {/* Empty folder indicator */}
        {isExpanded && node.children.length === 0 && (
          <div
            className="py-1 text-[11px] text-muted-foreground/60 italic select-none"
            style={{ paddingLeft: `${paddingLeft + 24}px` }}
          >
            Empty folder
          </div>
        )}
      </div>
    )
  }

  // File Row
  return (
    <div
      className={cn(
        'group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-all duration-150 text-xs',
        isSelected
          ? 'bg-secondary font-medium text-foreground shadow-xs'
          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
      )}
      style={{ paddingLeft: `${paddingLeft + 16}px` }}
      onClick={() => onSelectFile(node.id)}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <FileText
          className={cn(
            'w-3.5 h-3.5 shrink-0 transition-colors',
            isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80'
          )}
        />
        <span className="truncate text-[13px]">{node.name}</span>
      </div>

      {/* Context menu for file */}
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-6 w-6 p-0 transition-opacity text-muted-foreground hover:text-foreground',
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-40 rounded-xl text-xs shadow-lg">
            <DropdownMenuItem
              onClick={() => onSelectFile(node.id)}
              className="cursor-pointer gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Open Note</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRename(node)}
              className="cursor-pointer gap-2"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onMove(node)}
              className="cursor-pointer gap-2"
            >
              <FolderInput className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Move</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDuplicate(node.id)}
              className="cursor-pointer gap-2"
            >
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Duplicate</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDownloadFile(node)}
              className="cursor-pointer gap-2"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download (.txt)</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(node)}
              className="cursor-pointer gap-2 text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

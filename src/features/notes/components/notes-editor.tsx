'use client'

import * as React from 'react'
import {
  FileText,
  Save,
  Check,
  Loader2,
  AlertCircle,
  Download,
  Copy,
  FolderInput,
  Trash2,
  Clock,
  Sparkles,
  FilePlus,
  FolderPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { NotesItem } from '@/types/database'
import { getBreadcrumbs, downloadIndividualFile } from '@/features/notes/utils/tree-utils'
import { cn } from '@/lib/utils'

interface NotesEditorProps {
  file: NotesItem | null
  items: NotesItem[]
  onSaveContent: (id: string, content: string) => Promise<unknown>
  onRename: (file: NotesItem) => void
  onMove: (file: NotesItem) => void
  onDelete: (file: NotesItem) => void
  onDuplicate: (fileId: string) => void
  onCreateNewNote?: () => void
  onCreateNewFolder?: () => void
}

type SaveState = 'saved' | 'saving' | 'dirty' | 'error'

export function NotesEditor({
  file,
  items,
  onSaveContent,
  onRename,
  onMove,
  onDelete,
  onDuplicate,
  onCreateNewNote,
  onCreateNewFolder,
}: NotesEditorProps) {
  const [content, setContent] = React.useState<string>('')
  const [saveState, setSaveState] = React.useState<SaveState>('saved')
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null)

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = React.useRef<HTMLDivElement>(null)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const latestContentRef = React.useRef<string>('')
  const currentFileIdRef = React.useRef<string | null>(null)

  // Sync state whenever active file changes
  React.useEffect(() => {
    // If switching files and previous file had unsaved changes, flush save
    if (
      currentFileIdRef.current &&
      currentFileIdRef.current !== file?.id &&
      saveState === 'dirty'
    ) {
      onSaveContent(currentFileIdRef.current, latestContentRef.current).catch(() => {})
    }

    if (file) {
      setContent(file.content ?? '')
      latestContentRef.current = file.content ?? ''
      currentFileIdRef.current = file.id
      setSaveState('saved')
      setLastSavedAt(new Date(file.updated_at))
    } else {
      setContent('')
      latestContentRef.current = ''
      currentFileIdRef.current = null
      setSaveState('saved')
      setLastSavedAt(null)
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  }, [file?.id])

  // Prevent leaving window with unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveState === 'dirty' || saveState === 'saving') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveState])

  // Trigger save function
  const executeSave = React.useCallback(
    async (fileToSaveId: string, textToSave: string) => {
      if (!fileToSaveId) return
      setSaveState('saving')
      try {
        await onSaveContent(fileToSaveId, textToSave)
        setSaveState('saved')
        setLastSavedAt(new Date())
      } catch (err) {
        console.error('Failed to auto-save note:', err)
        setSaveState('error')
      }
    },
    [onSaveContent]
  )

  // Handle text change with 800ms auto-save debounce
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setContent(newText)
    latestContentRef.current = newText
    setSaveState('dirty')

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    if (file) {
      saveTimeoutRef.current = setTimeout(() => {
        executeSave(file.id, newText)
      }, 800)
    }
  }

  // Keyboard shortcut Ctrl+S / Cmd+S and Tab indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      if (file) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        executeSave(file.id, content)
      }
    }

    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const spaces = '  ' // 2 spaces

      const updated = content.substring(0, start) + spaces + content.substring(end)
      setContent(updated)
      latestContentRef.current = updated
      setSaveState('dirty')

      // Maintain cursor position after inserted spaces
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length
      })

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (file) {
        saveTimeoutRef.current = setTimeout(() => {
          executeSave(file.id, updated)
        }, 800)
      }
    }
  }

  // Synchronize scroll between textarea and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  // Statistics
  const breadcrumbs = React.useMemo(() => {
    if (!file) return []
    return getBreadcrumbs(file.id, items)
  }, [file, items])

  const stats = React.useMemo(() => {
    const lines = content.split('\n')
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    const chars = content.length
    return {
      lineCount: lines.length,
      wordCount: words,
      charCount: chars,
    }
  }, [content])

  // Empty state when no file is selected
  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card select-none">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-secondary/60 border border-border/50 flex items-center justify-center mx-auto text-muted-foreground shadow-xs">
            <FileText className="w-8 h-8 text-primary/70" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-foreground">
              No Note Selected
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select a .txt file from the explorer on the left to read and edit, or create a new note to start writing.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            {onCreateNewNote && (
              <Button
                size="sm"
                variant="default"
                onClick={onCreateNewNote}
                className="text-xs gap-1.5 h-8"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>New Note (.txt)</span>
              </Button>
            )}
            {onCreateNewFolder && (
              <Button
                size="sm"
                variant="outline"
                onClick={onCreateNewFolder}
                className="text-xs gap-1.5 h-8"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>New Folder</span>
              </Button>
            )}
          </div>

          <div className="pt-6 border-t border-border/30 text-[11px] text-muted-foreground/70 space-y-1">
            <p>💡 Tip: Use <kbd className="px-1.5 py-0.5 rounded bg-secondary text-foreground font-mono text-[10px]">Ctrl + S</kbd> anytime to save instantly.</p>
            <p>Organize with unlimited folders and download as .txt or ZIP.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-card overflow-hidden">
      {/* Editor Header */}
      <div className="p-3 border-b border-border/40 flex flex-wrap items-center justify-between gap-2 bg-card/80 backdrop-blur-xs select-none">
        <div className="flex flex-col min-w-0">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono truncate">
            <span>Notes</span>
            {breadcrumbs.slice(0, -1).map((b) => (
              <React.Fragment key={b.id}>
                <span>/</span>
                <span className="truncate">{b.name}</span>
              </React.Fragment>
            ))}
          </div>

          {/* File Name & Extension Badge */}
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-sm font-semibold text-foreground truncate">
              {file.name}
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 h-4.5 bg-primary/10 text-primary border-primary/20">
              TXT
            </Badge>
          </div>
        </div>

        {/* Right side: Save state & Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Save Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-secondary/50 border border-border/40 font-mono">
            {saveState === 'saved' && (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-muted-foreground text-[11px]">Saved</span>
              </>
            )}
            {saveState === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-primary text-[11px]">Saving...</span>
              </>
            )}
            {saveState === 'dirty' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 text-[11px]">Unsaved</span>
              </>
            )}
            {saveState === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-destructive text-[11px]">Error saving</span>
              </>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              title="Save changes (Ctrl + S)"
              onClick={() => {
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
                executeSave(file.id, content)
              }}
              disabled={saveState === 'saving'}
            >
              <Save className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Save</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Download as .txt"
              onClick={() => downloadIndividualFile(file)}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Duplicate file"
              onClick={() => onDuplicate(file.id)}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Move file"
              onClick={() => onMove(file)}
            >
              <FolderInput className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Delete file"
              onClick={() => onDelete(file)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Body: Line numbers + Monospace Textarea */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-11 shrink-0 py-3 pr-2 text-right font-mono text-xs text-muted-foreground/40 bg-secondary/20 border-r border-border/30 select-none overflow-hidden leading-relaxed"
        >
          {Array.from({ length: stats.lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder="Start typing your notes here..."
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          className="flex-1 h-full w-full resize-none p-3 font-mono text-xs sm:text-sm leading-relaxed bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none overflow-y-auto selection:bg-primary/20"
        />
      </div>

      {/* Footer Info Bar */}
      <div className="px-3 py-1.5 border-t border-border/40 bg-secondary/30 flex items-center justify-between text-[11px] font-mono text-muted-foreground select-none">
        <div className="flex items-center gap-4">
          <span>{stats.lineCount} {stats.lineCount === 1 ? 'line' : 'lines'}</span>
          <span>{stats.wordCount} {stats.wordCount === 1 ? 'word' : 'words'}</span>
          <span>{stats.charCount} chars</span>
        </div>

        <div className="flex items-center gap-2">
          {lastSavedAt && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70 hidden sm:flex">
              <Clock className="w-3 h-3" />
              {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/60">UTF-8 • Plain Text</span>
        </div>
      </div>
    </div>
  )
}

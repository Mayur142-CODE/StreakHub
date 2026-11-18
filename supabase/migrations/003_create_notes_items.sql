-- StreakHub Migration: Add notes_items table for Notes & Knowledge Base module
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notes_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES notes_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('folder', 'file')),
    content TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Folder must not contain content; file may have content
    CONSTRAINT chk_folder_content CHECK (
        (type = 'folder' AND content IS NULL) OR
        (type = 'file')
    ),

    -- All files MUST have .txt extension
    CONSTRAINT chk_file_extension CHECK (
        (type = 'folder') OR
        (type = 'file' AND name LIKE '%.txt')
    )
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notes_items_user ON notes_items(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_items_parent ON notes_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_notes_items_user_parent ON notes_items(user_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_notes_items_type ON notes_items(type);

-- Ensure unique names per folder for each user (root has parent_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_items_unique_root_name 
    ON notes_items(user_id, name) 
    WHERE parent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_items_unique_child_name 
    ON notes_items(user_id, parent_id, name) 
    WHERE parent_id IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE notes_items ENABLE ROW LEVEL SECURITY;

-- Users can CRUD only their own notes_items
CREATE POLICY "Users can view own notes_items"
    ON notes_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes_items"
    ON notes_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes_items"
    ON notes_items FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes_items"
    ON notes_items FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================
-- Auto-update updated_at on change
DROP TRIGGER IF EXISTS update_notes_items_updated_at ON notes_items;
CREATE TRIGGER update_notes_items_updated_at
    BEFORE UPDATE ON notes_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

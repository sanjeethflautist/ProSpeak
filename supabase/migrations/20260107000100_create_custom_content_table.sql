-- ============================================
-- CUSTOM CONTENT TABLE
-- Allows users to create and practice with their own content
-- ============================================

CREATE TABLE IF NOT EXISTS custom_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  title TEXT,
  category TEXT DEFAULT 'custom',
  difficulty_level TEXT DEFAULT 'medium',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_custom_content_user_id ON custom_content(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_content_created_at ON custom_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_content_is_favorite ON custom_content(is_favorite);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE custom_content ENABLE ROW LEVEL SECURITY;

-- Users can view their own custom content
DROP POLICY IF EXISTS "Users can view their own custom content" ON custom_content;
CREATE POLICY "Users can view their own custom content"
  ON custom_content FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own custom content
DROP POLICY IF EXISTS "Users can insert their own custom content" ON custom_content;
CREATE POLICY "Users can insert their own custom content"
  ON custom_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own custom content
DROP POLICY IF EXISTS "Users can update their own custom content" ON custom_content;
CREATE POLICY "Users can update their own custom content"
  ON custom_content FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own custom content
DROP POLICY IF EXISTS "Users can delete their own custom content" ON custom_content;
CREATE POLICY "Users can delete their own custom content"
  ON custom_content FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- UPDATE PRACTICE SESSIONS TO SUPPORT CUSTOM CONTENT
-- ============================================

-- Add a column to track if the session was with custom content
ALTER TABLE practice_sessions 
ADD COLUMN IF NOT EXISTS custom_content_id UUID REFERENCES custom_content(id) ON DELETE CASCADE;

-- Make sentence_id nullable since custom content might not have a sentence_id
ALTER TABLE practice_sessions 
ALTER COLUMN sentence_id DROP NOT NULL;

-- Add a check constraint to ensure either sentence_id or custom_content_id is present
ALTER TABLE practice_sessions 
ADD CONSTRAINT check_sentence_or_custom 
CHECK (
  (sentence_id IS NOT NULL AND custom_content_id IS NULL) OR 
  (sentence_id IS NULL AND custom_content_id IS NOT NULL)
);

-- Create index for custom content sessions
CREATE INDEX IF NOT EXISTS idx_practice_sessions_custom_content_id ON practice_sessions(custom_content_id);

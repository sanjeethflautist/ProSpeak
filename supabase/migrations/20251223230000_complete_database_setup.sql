-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. DAILY SENTENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_sentences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sentence TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty_level TEXT DEFAULT 'medium',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sentence, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_sentences_date ON daily_sentences(date);
CREATE INDEX IF NOT EXISTS idx_daily_sentences_category ON daily_sentences(category);

-- ============================================
-- 2. USER PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sessions INTEGER DEFAULT 0,
  total_sentences INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_practice_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- ============================================
-- 3. PRACTICE SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sentence_id UUID NOT NULL REFERENCES daily_sentences(id) ON DELETE CASCADE,
  accuracy_score DECIMAL(5,2) NOT NULL,
  ai_score INTEGER,
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_sentence_id ON practice_sessions(sentence_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON practice_sessions(created_at);

-- ============================================
-- 4. USER SETTINGS TABLE (with encryption)
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_api_key_encrypted TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Daily Sentences: Public read access
ALTER TABLE daily_sentences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view daily sentences" ON daily_sentences;
CREATE POLICY "Anyone can view daily sentences"
  ON daily_sentences FOR SELECT
  USING (true);

-- User Progress: Users can only access their own progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;

CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Practice Sessions: Users can only access their own sessions
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON practice_sessions;

CREATE POLICY "Users can view their own sessions"
  ON practice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Settings: Users can only access their own settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. ENCRYPTION FUNCTIONS
-- ============================================

-- Function to encrypt API key
CREATE OR REPLACE FUNCTION encrypt_api_key(api_key TEXT, user_secret UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    encrypt(
      api_key::bytea,
      user_secret::text::bytea,
      'aes'
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt API key
CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key TEXT, user_secret UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(
    decrypt(
      decode(encrypted_key, 'base64'),
      user_secret::text::bytea,
      'aes'
    ),
    'utf8'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. HELPER FUNCTION FOR USER DELETION
-- ============================================

-- Function to delete user account (called from client)
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

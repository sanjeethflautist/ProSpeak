-- Check and create missing tables
DO $$ 
BEGIN
  -- Create daily_sentences if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_sentences') THEN
    CREATE TABLE daily_sentences (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sentence TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty_level TEXT DEFAULT 'medium',
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(sentence, date)
    );
    CREATE INDEX idx_daily_sentences_date ON daily_sentences(date);
    CREATE INDEX idx_daily_sentences_category ON daily_sentences(category);
  END IF;

  -- Create user_progress if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_progress') THEN
    CREATE TABLE user_progress (
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
    CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
  END IF;

  -- Create practice_sessions if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'practice_sessions') THEN
    CREATE TABLE practice_sessions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      sentence_id UUID NOT NULL REFERENCES daily_sentences(id) ON DELETE CASCADE,
      accuracy_score DECIMAL(5,2) NOT NULL,
      ai_score INTEGER,
      duration_seconds INTEGER,
      completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
    CREATE INDEX idx_practice_sessions_sentence_id ON practice_sessions(sentence_id);
    CREATE INDEX idx_practice_sessions_created_at ON practice_sessions(created_at);
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE daily_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate all policies
DROP POLICY IF EXISTS "Anyone can view daily sentences" ON daily_sentences;
CREATE POLICY "Anyone can view daily sentences"
  ON daily_sentences FOR SELECT
  USING (true);

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

DROP POLICY IF EXISTS "Users can view their own sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON practice_sessions;

CREATE POLICY "Users can view their own sessions"
  ON practice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON practice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

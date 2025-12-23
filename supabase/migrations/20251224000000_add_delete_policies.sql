-- Add DELETE policies for users to delete their own data

-- Practice Sessions: Allow users to delete their own sessions
DROP POLICY IF EXISTS "Users can delete their own sessions" ON practice_sessions;
CREATE POLICY "Users can delete their own sessions"
  ON practice_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- User Progress: Allow users to update their own progress (already exists, but ensure it's there)
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;
CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- LEADERBOARD FIX MIGRATION
-- ============================================
-- This migration fixes the leaderboard by:
-- 1. Creating missing user_progress records
-- 2. Fixing RLS policies to allow leaderboard viewing
-- 3. Recalculating progress from practice_sessions

BEGIN;

-- ============================================
-- STEP 1: CREATE MISSING USER_PROGRESS RECORDS
-- ============================================

-- Create user_progress for users who have profiles but no progress
INSERT INTO user_progress (
  user_id,
  total_sessions,
  total_sentences,
  average_accuracy,
  current_streak,
  longest_streak,
  created_at,
  updated_at
)
SELECT 
  up.user_id,
  0,
  0,
  0,
  0,
  0,
  NOW(),
  NOW()
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM user_progress WHERE user_id = up.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- STEP 2: FIX RLS POLICIES FOR LEADERBOARD
-- ============================================

-- Drop old policy
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Anyone can view leaderboard progress" ON user_progress;

-- Create new policy that allows:
-- 1. Users to see their own progress
-- 2. Anyone to see progress of users who opted into leaderboard
CREATE POLICY "Anyone can view leaderboard progress"
  ON user_progress FOR SELECT
  USING (
    -- User can see their own progress
    auth.uid() = user_id 
    OR
    -- Anyone can see progress of users who opted into leaderboard
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = user_progress.user_id
      AND user_profiles.show_in_leaderboard = true
    )
  );

-- ============================================
-- STEP 3: RECALCULATE PROGRESS FROM PRACTICE SESSIONS
-- ============================================

-- Function to recalculate a single user's progress
CREATE OR REPLACE FUNCTION recalculate_user_progress(target_user_id UUID)
RETURNS void AS $$
DECLARE
  session_count INTEGER;
  completed_count INTEGER;
  avg_acc DECIMAL;
  practice_dates DATE[];
  current_streak_val INTEGER := 0;
  longest_streak_val INTEGER := 0;
  last_practice DATE;
BEGIN
  -- Get session stats
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true),
    COALESCE(AVG(accuracy_score), 0),
    ARRAY_AGG(DISTINCT DATE(created_at) ORDER BY DATE(created_at) DESC)
  INTO session_count, completed_count, avg_acc, practice_dates
  FROM practice_sessions
  WHERE user_id = target_user_id;
  
  -- If no sessions, set to 0
  IF session_count IS NULL OR session_count = 0 THEN
    UPDATE user_progress
    SET
      total_sessions = 0,
      total_sentences = 0,
      average_accuracy = 0,
      current_streak = 0,
      longest_streak = 0,
      last_practice_date = NULL,
      updated_at = NOW()
    WHERE user_id = target_user_id;
    RETURN;
  END IF;
  
  -- Calculate streaks
  IF practice_dates IS NOT NULL AND array_length(practice_dates, 1) > 0 THEN
    DECLARE
      today DATE := CURRENT_DATE;
      yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
      temp_streak INTEGER := 1;
      i INTEGER;
    BEGIN
      last_practice := practice_dates[1];
      
      -- Calculate current streak
      IF practice_dates[1] = today OR practice_dates[1] = yesterday THEN
        current_streak_val := 1;
        
        FOR i IN 2..array_length(practice_dates, 1) LOOP
          IF practice_dates[i] = practice_dates[i-1] - INTERVAL '1 day' THEN
            current_streak_val := current_streak_val + 1;
          ELSE
            EXIT;
          END IF;
        END LOOP;
      END IF;
      
      -- Calculate longest streak
      longest_streak_val := 1;
      temp_streak := 1;
      
      FOR i IN 2..array_length(practice_dates, 1) LOOP
        IF practice_dates[i] = practice_dates[i-1] - INTERVAL '1 day' THEN
          temp_streak := temp_streak + 1;
          longest_streak_val := GREATEST(longest_streak_val, temp_streak);
        ELSE
          temp_streak := 1;
        END IF;
      END LOOP;
      
      longest_streak_val := GREATEST(longest_streak_val, current_streak_val);
    END;
  END IF;
  
  -- Update user_progress
  UPDATE user_progress
  SET
    total_sessions = session_count,
    total_sentences = completed_count,
    average_accuracy = avg_acc,
    current_streak = current_streak_val,
    longest_streak = longest_streak_val,
    last_practice_date = last_practice,
    updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate for all users with practice sessions
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN 
    SELECT DISTINCT user_id FROM practice_sessions
  LOOP
    PERFORM recalculate_user_progress(user_rec.user_id);
  END LOOP;
END $$;

-- ============================================
-- STEP 4: VERIFY RESULTS
-- ============================================

-- Log summary
DO $$
DECLARE
  profile_count INTEGER;
  progress_count INTEGER;
  with_data_count INTEGER;
  session_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM user_profiles WHERE show_in_leaderboard = true;
  SELECT COUNT(*) INTO progress_count FROM user_progress;
  SELECT COUNT(*) INTO with_data_count FROM user_progress WHERE total_sentences > 0;
  SELECT COUNT(*) INTO session_count FROM practice_sessions;
  
  RAISE NOTICE '';
  RAISE NOTICE '========== LEADERBOARD FIX SUMMARY ==========';
  RAISE NOTICE 'User profiles (opted in): %', profile_count;
  RAISE NOTICE 'User progress records: %', progress_count;
  RAISE NOTICE 'Users with activity: %', with_data_count;
  RAISE NOTICE 'Practice sessions: %', session_count;
  RAISE NOTICE '============================================';
END $$;

COMMIT;

-- Display top 10 for verification
SELECT 
  up.username,
  prog.total_sentences,
  ROUND(prog.average_accuracy, 1) as avg_accuracy,
  prog.current_streak,
  prog.last_practice_date
FROM user_progress prog
INNER JOIN user_profiles up ON prog.user_id = up.user_id
WHERE up.show_in_leaderboard = true
ORDER BY prog.total_sentences DESC, prog.average_accuracy DESC
LIMIT 10;

-- Fix for leaderboard: Ensure user_progress records exist and RLS allows viewing
-- This script will:
-- 1. Create user_progress records for all users who don't have one
-- 2. Update RLS policies to allow leaderboard viewing
-- 3. Recalculate progress from practice_sessions if any exist

-- ============================================
-- 1. CREATE MISSING USER_PROGRESS RECORDS
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
WHERE up.user_id NOT IN (SELECT user_id FROM user_progress)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 2. UPDATE RLS POLICIES FOR LEADERBOARD
-- ============================================

-- Allow viewing progress for leaderboard (users who opted in)
DROP POLICY IF EXISTS "Anyone can view leaderboard progress" ON user_progress;

CREATE POLICY "Anyone can view leaderboard progress"
  ON user_progress FOR SELECT
  USING (
    -- User can see their own progress
    auth.uid() = user_id 
    OR
    -- Or can see progress of users who opted into leaderboard
    user_id IN (
      SELECT user_id FROM user_profiles 
      WHERE show_in_leaderboard = true
    )
  );

-- Keep the existing insert and update policies for the user themselves
-- (These should already exist from the migrations)

-- ============================================
-- 3. RECALCULATE PROGRESS FROM PRACTICE SESSIONS
-- ============================================

-- Update progress for users who have practice sessions
DO $$
DECLARE
  user_record RECORD;
  session_data RECORD;
  total_count INTEGER;
  completed_count INTEGER;
  avg_acc DECIMAL;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id FROM practice_sessions
  LOOP
    -- Get session stats
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE completed = true) as completed,
      COALESCE(AVG(accuracy_score), 0) as avg_accuracy
    INTO session_data
    FROM practice_sessions
    WHERE user_id = user_record.user_id;
    
    -- Update user_progress
    UPDATE user_progress
    SET
      total_sessions = session_data.total,
      total_sentences = session_data.completed,
      average_accuracy = session_data.avg_accuracy,
      updated_at = NOW()
    WHERE user_id = user_record.user_id;
    
    RAISE NOTICE 'Updated progress for user %: % sessions, % sentences, % accuracy',
      user_record.user_id,
      session_data.total,
      session_data.completed,
      session_data.avg_accuracy;
  END LOOP;
END $$;

-- ============================================
-- 4. VERIFY RESULTS
-- ============================================

-- Show summary
DO $$
DECLARE
  profile_count INTEGER;
  progress_count INTEGER;
  with_data_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM user_profiles WHERE show_in_leaderboard = true;
  SELECT COUNT(*) INTO progress_count FROM user_progress;
  SELECT COUNT(*) INTO with_data_count FROM user_progress WHERE total_sentences > 0;
  
  RAISE NOTICE '';
  RAISE NOTICE '========== LEADERBOARD FIX SUMMARY ==========';
  RAISE NOTICE 'User profiles (opted in): %', profile_count;
  RAISE NOTICE 'User progress records: %', progress_count;
  RAISE NOTICE 'Users with activity: %', with_data_count;
  RAISE NOTICE '============================================';
END $$;

-- Show top 10 leaderboard
SELECT 
  up.username,
  prog.total_sentences,
  prog.average_accuracy,
  prog.current_streak
FROM user_progress prog
INNER JOIN user_profiles up ON prog.user_id = up.user_id
WHERE up.show_in_leaderboard = true
ORDER BY prog.total_sentences DESC
LIMIT 10;

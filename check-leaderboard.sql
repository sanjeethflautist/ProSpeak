-- Check if user_profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
);

-- Check if there are any user profiles
SELECT COUNT(*) FROM user_profiles;

-- Check if there is any user progress
SELECT COUNT(*) FROM user_progress;

-- Try the actual leaderboard query
SELECT 
  up.user_id,
  up.total_sessions,
  up.total_sentences,
  up.average_accuracy,
  up.current_streak,
  prof.username,
  prof.avatar_url
FROM user_progress up
INNER JOIN user_profiles prof ON up.user_id = prof.user_id
ORDER BY up.total_sentences DESC
LIMIT 5;

-- ============================================
-- FALLBACK: Manual Profile Creation RPC
-- ============================================
-- This allows the app to create profiles if the trigger fails
-- ============================================

CREATE OR REPLACE FUNCTION create_user_profile_manual(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  random_username TEXT;
  random_avatar TEXT;
  avatar_options TEXT[] := ARRAY[
    'avatar1.svg', 'avatar2.svg', 'avatar3.svg', 'avatar4.svg', 
    'avatar5.svg', 'avatar6.svg', 'avatar7.svg', 'avatar8.svg',
    'avatar9.svg', 'avatar10.svg', 'avatar11.svg', 'avatar12.svg'
  ];
BEGIN
  -- Generate random username and avatar
  random_username := generate_random_username();
  random_avatar := avatar_options[floor(random() * array_length(avatar_options, 1) + 1)];
  
  -- Create user profile (if doesn't exist)
  INSERT INTO public.user_profiles (user_id, username, avatar_url)
  VALUES (p_user_id, random_username, random_avatar)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create user progress (if doesn't exist)
  INSERT INTO public.user_progress (
    user_id,
    total_sessions,
    total_sentences,
    average_accuracy,
    current_streak,
    longest_streak,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    0,
    0,
    0,
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION create_user_profile_manual IS 'Fallback function to manually create user profile and progress if trigger fails';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile_manual(UUID) TO authenticated;

SELECT 'RPC function created successfully' as status;

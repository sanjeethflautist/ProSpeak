-- Add show_video_on_practice column to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS show_video_on_practice BOOLEAN DEFAULT false;

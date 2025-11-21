-- Comprehensive Schema Update for Chat2077 Features

-- 1. Ensure Reactions Table Exists and is Correct
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint to prevent duplicate reactions from same user on same message
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS unique_reaction;
ALTER TABLE reactions ADD CONSTRAINT unique_reaction UNIQUE (message_id, user_id, emoji);

-- Enable RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Policies for Reactions
DROP POLICY IF EXISTS "Users can view reactions" ON reactions;
CREATE POLICY "Users can view reactions" ON reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add reactions" ON reactions;
CREATE POLICY "Users can add reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own reactions" ON reactions;
CREATE POLICY "Users can remove their own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- 2. Update Messages Table for New Media Types
-- Check if media_type column exists, if not add it (already exists in some versions, but ensuring)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'media_type') THEN
        ALTER TABLE messages ADD COLUMN media_type TEXT;
    END IF;
END $$;

-- 3. Create Read Receipts Table
CREATE TABLE IF NOT EXISTS read_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_read_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE read_receipts ENABLE ROW LEVEL SECURITY;

-- Policies for Read Receipts
DROP POLICY IF EXISTS "Users can view read receipts" ON read_receipts;
CREATE POLICY "Users can view read receipts" ON read_receipts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own read receipts" ON read_receipts;
CREATE POLICY "Users can insert their own read receipts" ON read_receipts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own read receipts" ON read_receipts;
CREATE POLICY "Users can update their own read receipts" ON read_receipts FOR UPDATE USING (auth.uid() = user_id);

-- 4. Add Theme Color to Profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'theme_color') THEN
        ALTER TABLE profiles ADD COLUMN theme_color TEXT DEFAULT 'blue';
    END IF;
END $$;

-- 5. Enable Realtime for New Tables
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE messages, rooms, room_members, profiles, reactions, read_receipts;
COMMIT;

-- Fix Storage Buckets and Policies for Avatars and Chat Media

-- 1. Create 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create 'chat-media' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Policies for 'avatars' bucket
-- Allow public access to view avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow users to update their own avatars
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- 4. Policies for 'chat-media' bucket
-- Allow public access to view chat media
DROP POLICY IF EXISTS "Chat media is publicly accessible" ON storage.objects;
CREATE POLICY "Chat media is publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat-media' );

-- Allow authenticated users to upload chat media
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'chat-media' AND auth.role() = 'authenticated' );

-- Allow users to delete their own chat media (optional, but good practice)
DROP POLICY IF EXISTS "Users can delete their own chat media" ON storage.objects;
CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
USING ( bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1] );

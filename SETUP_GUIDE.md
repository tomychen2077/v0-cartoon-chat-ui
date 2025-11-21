# Setup Guide - Chat2077 Features

This guide covers all the setup required for the new features added to Chat2077.

## Table of Contents
1. [Database Migrations](#database-migrations)
2. [Supabase Storage Setup](#supabase-storage-setup)
3. [Feature Overview](#feature-overview)

---

## Database Migrations

Run these SQL scripts in your Supabase SQL Editor (in order):

### 1. Friends Table
**File:** `scripts/010_create_friends.sql`

```sql
-- Create friends table for user relationships
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending', -- 'pending', 'accepted', 'blocked'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, friend_id),
  check (user_id != friend_id)
);

-- Create index for faster queries
create index if not exists friends_user_id_idx on public.friends(user_id);
create index if not exists friends_friend_id_idx on public.friends(friend_id);
create index if not exists friends_status_idx on public.friends(status);

-- Enable RLS
alter table public.friends enable row level security;

-- Create policies
create policy "friends_select_own"
  on public.friends for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "friends_insert_own"
  on public.friends for insert
  with check (auth.uid() = user_id);

create policy "friends_update_own"
  on public.friends for update
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "friends_delete_own"
  on public.friends for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);
```

### 2. Max Members Column
**File:** `scripts/011_add_max_members.sql`

```sql
-- Add max_members column to rooms table
alter table public.rooms add column if not exists max_members integer;
```

### 3. Media Columns for Messages
**File:** `scripts/012_add_media_to_messages.sql`

```sql
-- Add media columns to messages table
alter table public.messages add column if not exists media_url text;
alter table public.messages add column if not exists media_type text;
```

---

## Supabase Storage Setup

### 1. Avatars Bucket (Profile Images)

1. Go to **Supabase Dashboard → Storage**
2. Click **New Bucket**
3. Name: `avatars`
4. Set to **Public**
5. Click **Create Bucket**

**Storage Policies:**

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Avatar images are publicly accessible
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

### 2. Chat Media Bucket (Chat Photos)

1. Go to **Supabase Dashboard → Storage**
2. Click **New Bucket**
3. Name: `chat-media`
4. Set to **Public**
5. Click **Create Bucket**

**Storage Policies:**

```sql
-- Allow authenticated users to upload media
CREATE POLICY "Users can upload media to rooms"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-media' 
  AND auth.role() = 'authenticated'
);

-- Media files are publicly accessible
CREATE POLICY "Media files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');
```

---

## Feature Overview

### ✅ Part 1: Message Options & Mobile Responsiveness
- **Message Options:** Copy, Share, Delete (own messages only)
- **Mobile-First Design:** Optimized for mobile devices with compact layouts
- **Touch-Friendly:** All buttons and interactions work well on mobile

### ✅ Part 2: Profile & Friends
- **Profile Image Upload:** Upload custom avatars or choose from presets
- **Friends System:**
  - Search users by username
  - Send friend requests
  - Accept/decline pending requests
  - View friends list
  - Remove friends
  - View friend profiles

### ✅ Part 3: Room Management & Media
- **Max Members:** Set member limit when creating rooms (optional)
- **Edit Room:** Room owners can edit room details
- **Delete Room:** Room owners can delete their rooms
- **Photo Upload:** Send photos in chat rooms (max 5MB, images only)

---

## API Endpoints

### Friends
- `POST /api/friends/add` - Send friend request
- `GET /api/friends/get?status=accepted|pending` - Get friends list
- `POST /api/friends/accept` - Accept friend request
- `DELETE /api/friends/remove?friend_id=...` - Remove friend

### Profile
- `POST /api/profile/upload-avatar` - Upload profile image

### Rooms
- `PUT /api/rooms/update` - Update room details
- `DELETE /api/rooms/delete?id=...` - Delete room

### Chat
- `POST /api/chat/upload-media` - Upload media file
- `POST /api/chat/send-message` - Send message (now supports media)
- `DELETE /api/chat/delete-message?id=...` - Delete message

---

## Testing Checklist

After setup, test these features:

- [ ] Upload profile image
- [ ] Search for users
- [ ] Send friend request
- [ ] Accept friend request
- [ ] View friend profile
- [ ] Create room with max members
- [ ] Edit room details
- [ ] Delete room
- [ ] Upload photo in chat
- [ ] View photo in chat
- [ ] Delete own message
- [ ] Copy/share message
- [ ] Test on mobile device

---

## Troubleshooting

### Images not uploading?
- Check storage bucket exists and is public
- Verify storage policies are set correctly
- Check file size (max 5MB for photos)

### Friends feature not working?
- Verify friends table exists
- Check RLS policies are enabled
- Ensure user is authenticated

### Room edit/delete not showing?
- Only room owners see these options
- Check `created_by` field matches current user

### Media not displaying in chat?
- Verify `media_url` and `media_type` columns exist in messages table
- Check storage bucket is public
- Verify file was uploaded successfully

---

## Notes

- All file uploads are limited to 5MB
- Only image files (JPEG, PNG, GIF, WebP) are supported for chat media
- Room owners have full control over their rooms
- Friends system uses a pending/accepted status model
- All features are mobile-responsive

---

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify all SQL migrations ran successfully
3. Ensure storage buckets are created and public
4. Check Supabase logs for API errors


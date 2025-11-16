# Supabase Realtime Setup for Chat

## Enable Realtime on Messages Table

To enable real-time chat functionality, you need to enable Realtime on the `messages` table in Supabase:

### Steps:

#### Option 1: Using SQL Query (Recommended)

Run this SQL query in your Supabase SQL Editor:

```sql
-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

**How to run:**
1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Paste the SQL query above
4. Click **Run** (or press Ctrl+Enter)

#### Option 2: Using Dashboard UI

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Database** → **Replication**

2. **Enable Realtime for Messages Table**
   - Find the `messages` table in the list
   - Toggle the switch to **enable** Realtime replication
   - This allows the app to listen for new messages in real-time

### Verify RLS Policies

Make sure your Row Level Security (RLS) policies allow:
- **SELECT**: Everyone can read messages (for public rooms)
- **INSERT**: Authenticated users can send messages
- Check: **Database** → **Tables** → `messages` → **Policies**

### What This Enables:

✅ **Real-time message updates** - New messages appear instantly for all users  
✅ **Live chat experience** - No page refresh needed  
✅ **Better user experience** - Messages sync across all connected clients  

### If Realtime is Not Enabled:

The chat will still work, but:
- Users need to refresh to see new messages
- Messages won't appear instantly
- Less interactive experience

### Testing:

1. Open the chat room in two different browser windows
2. Send a message from one window
3. It should appear instantly in the other window (if Realtime is enabled)

---

**Note:** Realtime is available on Supabase's free tier, so you can enable it without any additional cost!


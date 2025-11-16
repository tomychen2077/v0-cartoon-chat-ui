-- Enable Realtime for messages table
-- This allows the app to listen for new messages in real-time

-- Add the messages table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Verify the table is added (optional - just for checking)
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Note: If you get an error that the publication doesn't exist, 
-- Supabase will create it automatically when you enable Realtime via the dashboard.
-- This query works when Realtime is already enabled for your project.


-- Enable realtime for admin panel functionality
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
ALTER PUBLICATION supabase_realtime ADD TABLE sheets;

-- Set replica identity to full for better real-time tracking
ALTER TABLE questions REPLICA IDENTITY FULL;
ALTER TABLE sheets REPLICA IDENTITY FULL;
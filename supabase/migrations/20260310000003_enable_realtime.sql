-- Enable Realtime for core tables
BEGIN;
  -- Remove existing if any (to avoid duplicates if someone manually did it)
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS submissions;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS contests;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS comments;

  -- Add tables to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
  ALTER PUBLICATION supabase_realtime ADD TABLE contests;
  ALTER PUBLICATION supabase_realtime ADD TABLE comments;
COMMIT;

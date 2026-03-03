-- Enable Realtime for the submissions table
-- In Supabase UI: Database > Replication > Enable Realtime for 'submissions'

-- Contests Table
CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  is_practice BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problems Table
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  oj TEXT NOT NULL CHECK (oj IN ('CF', 'AC')),
  external_id TEXT NOT NULL, -- e.g. '123A' for CF, 'abc123_a' for AtCoder
  title TEXT NOT NULL,
  point_value INTEGER DEFAULT 100,
  problem_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  verdict TEXT DEFAULT 'Pending', -- 'AC', 'WA', 'TLE', 'RE', 'Judging', etc.
  verdict_details TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Simple Policies (adjust as needed for security)
CREATE POLICY "Public read contests" ON contests FOR SELECT USING (true);
CREATE POLICY "Public read problems" ON problems FOR SELECT USING (true);
CREATE POLICY "Public read submissions" ON submissions FOR SELECT USING (true);

-- Allow authenticated users to create contests/submissions
CREATE POLICY "Authenticated users can create contests" ON contests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create submissions" ON submissions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own submissions" ON submissions FOR UPDATE USING (auth.uid() = user_id);

-- 1. Profiles Table (Base table)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cf_handle TEXT,
  ac_handle TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Contests Table (Dependency for problems, submissions, participants, comments)
CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  is_practice BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  password TEXT,
  ranking_rule TEXT DEFAULT 'ICPC' CHECK (ranking_rule IN ('ICPC', 'AtCoder', 'IOI')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Problems Table
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  oj TEXT NOT NULL CHECK (oj IN ('CF', 'AC')),
  external_id TEXT NOT NULL, 
  title TEXT NOT NULL,
  point_value INTEGER DEFAULT 100,
  problem_url TEXT NOT NULL,
  statement_html TEXT,
  time_limit TEXT,
  memory_limit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Participants Table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, user_id)
);

-- 5. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  verdict TEXT DEFAULT 'Pending', 
  verdict_details TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, 
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public read contests" ON contests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create contests" ON contests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Owners can update their contests" ON contests FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their contests" ON contests FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Public read problems" ON problems FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create problems" ON problems FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Contest owners can update problems" ON problems FOR UPDATE USING (
  EXISTS (SELECT 1 FROM contests WHERE id = problems.contest_id AND owner_id = auth.uid())
);
CREATE POLICY "Contest owners can delete problems" ON problems FOR DELETE USING (
  EXISTS (SELECT 1 FROM contests WHERE id = problems.contest_id AND owner_id = auth.uid())
);

CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Users can join contests" ON participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read submissions" ON submissions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create submissions" ON submissions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own submissions" ON submissions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

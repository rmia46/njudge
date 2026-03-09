-- 1. Ensure RLS is active
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- 2. Problems Policies
DROP POLICY IF EXISTS "Authenticated users can create problems" ON problems;
DROP POLICY IF EXISTS "Public read problems" ON problems;
CREATE POLICY "Public read problems" ON problems FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create problems" ON problems FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Contests Policies
DROP POLICY IF EXISTS "Authenticated users can create contests" ON contests;
DROP POLICY IF EXISTS "Public read contests" ON contests;
CREATE POLICY "Public read contests" ON contests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create contests" ON contests FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Participants Policies
DROP POLICY IF EXISTS "Users can join contests" ON participants;
DROP POLICY IF EXISTS "Public read participants" ON participants;
CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Users can join contests" ON participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 1. Reset all existing policies for clarity
DROP POLICY IF EXISTS "Public read contests" ON contests;
DROP POLICY IF EXISTS "Anyone can read contests" ON contests;
DROP POLICY IF EXISTS "Authenticated users can create contests" ON contests;
DROP POLICY IF EXISTS "Auth users can create contests" ON contests;
DROP POLICY IF EXISTS "Owners can update their contests" ON contests;
DROP POLICY IF EXISTS "Owners can delete their contests" ON contests;

DROP POLICY IF EXISTS "Public read problems" ON problems;
DROP POLICY IF EXISTS "Anyone can read problems" ON problems;
DROP POLICY IF EXISTS "Authenticated users can create problems" ON problems;
DROP POLICY IF EXISTS "Auth users can create problems" ON problems;
DROP POLICY IF EXISTS "Contest owners can update problems" ON problems;
DROP POLICY IF EXISTS "Contest owners can delete problems" ON problems;

DROP POLICY IF EXISTS "Public read participants" ON participants;
DROP POLICY IF EXISTS "Anyone can read participants" ON participants;
DROP POLICY IF EXISTS "Users can join contests" ON participants;

DROP POLICY IF EXISTS "Public read submissions" ON submissions;
DROP POLICY IF EXISTS "Authenticated users can create submissions" ON submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON submissions;

-- 2. Contests Policies
CREATE POLICY "Contests are visible to everyone" ON contests 
  FOR SELECT USING (true);

CREATE POLICY "Logged in users can create contests" ON contests 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only owners can update their contests" ON contests 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Only owners can delete their contests" ON contests 
  FOR DELETE USING (auth.uid() = owner_id);

-- 3. Problems Policies (Protected by Contest Privacy)
CREATE POLICY "Problems are visible if contest is public or user is owner/participant" ON problems
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contests c
      LEFT JOIN participants p ON p.contest_id = c.id AND p.user_id = auth.uid()
      WHERE c.id = problems.contest_id
      AND (c.is_private = false OR c.owner_id = auth.uid() OR p.user_id IS NOT NULL)
    )
  );

CREATE POLICY "Owners can manage problems" ON problems
  FOR ALL USING (
    EXISTS (SELECT 1 FROM contests WHERE id = problems.contest_id AND owner_id = auth.uid())
  );

-- 4. Participants Policies
CREATE POLICY "Participants are visible if contest is public or user is owner/participant" ON participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contests c
      WHERE c.id = participants.contest_id
      AND (c.is_private = false OR c.owner_id = auth.uid() OR participants.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can join contests" ON participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Submissions Policies (Protected by Contest Privacy)
CREATE POLICY "Submissions are visible if contest is public or user is owner/participant" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contests c
      LEFT JOIN participants p ON p.contest_id = c.id AND p.user_id = auth.uid()
      WHERE c.id = submissions.contest_id
      AND (c.is_private = false OR c.owner_id = auth.uid() OR p.user_id IS NOT NULL)
    )
  );

CREATE POLICY "Users can submit code" ON submissions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own submissions" ON submissions
  FOR UPDATE USING (auth.uid() = user_id);

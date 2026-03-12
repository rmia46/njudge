-- Contest Owner Policies
CREATE POLICY "Owners can update their contests" ON contests FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their contests" ON contests FOR DELETE USING (auth.uid() = owner_id);

-- Problem Owner Policies (via Contest ownership)
CREATE POLICY "Contest owners can update problems" ON problems FOR UPDATE USING (
  EXISTS (SELECT 1 FROM contests WHERE id = problems.contest_id AND owner_id = auth.uid())
);
CREATE POLICY "Contest owners can delete problems" ON problems FOR DELETE USING (
  EXISTS (SELECT 1 FROM contests WHERE id = problems.contest_id AND owner_id = auth.uid())
);

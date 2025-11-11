-- Function to increment issue votes
CREATE OR REPLACE FUNCTION increment_issue_votes(issue_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE issues 
  SET votes = votes + 1 
  WHERE id = issue_id;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) policies for the tables
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Issues are publicly readable, but only users can create them
CREATE POLICY "Anyone can view issues" ON issues
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create issues" ON issues
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own issues" ON issues
  FOR UPDATE USING (auth.uid() = user_id);

-- Votes are publicly readable, but only users can create them
CREATE POLICY "Anyone can view votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create votes" ON votes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Rewards are publicly readable, but only users can view their own
CREATE POLICY "Users can view their own rewards" ON rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create rewards" ON rewards
  FOR INSERT WITH CHECK (true);

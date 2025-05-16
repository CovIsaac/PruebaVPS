-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  team TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

-- Create meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  audio_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  content JSONB,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create speakers table
CREATE TABLE IF NOT EXISTS speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Organizations policies
CREATE POLICY "Organizations are viewable by members" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizations can be created by authenticated users" ON organizations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Organizations can be updated by admins" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Organization members policies
CREATE POLICY "Organization members are viewable by organization members" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can be created by admins" ON organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    ) OR (
      -- Allow users to add themselves to an organization
      auth.uid() = user_id
    )
  );

-- Meetings policies
CREATE POLICY "Meetings are viewable by organization members" ON meetings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = meetings.organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Meetings can be created by organization members" ON meetings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Meetings can be updated by creator or admin" ON meetings
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = meetings.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- Transcriptions policies
CREATE POLICY "Transcriptions are viewable by organization members" ON transcriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meetings
      JOIN organization_members ON organization_members.organization_id = meetings.organization_id
      WHERE meetings.id = transcriptions.meeting_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Transcriptions can be created by organization members" ON transcriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings
      JOIN organization_members ON organization_members.organization_id = meetings.organization_id
      WHERE meetings.id = meeting_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Speakers policies
CREATE POLICY "Speakers are viewable by organization members" ON speakers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meetings
      JOIN organization_members ON organization_members.organization_id = meetings.organization_id
      WHERE meetings.id = speakers.meeting_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Speakers can be created by organization members" ON speakers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings
      JOIN organization_members ON organization_members.organization_id = meetings.organization_id
      WHERE meetings.id = meeting_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organization_members_updated_at
BEFORE UPDATE ON organization_members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON meetings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_transcriptions_updated_at
BEFORE UPDATE ON transcriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

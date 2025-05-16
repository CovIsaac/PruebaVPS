-- Crear tabla de reuniones
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration TEXT,
  participants INTEGER,
  summary TEXT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de transcripciones
CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  time TEXT,
  speaker TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de puntos clave
CREATE TABLE IF NOT EXISTS key_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  point_text TEXT NOT NULL,
  order_num INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de palabras clave de reuniones
CREATE TABLE IF NOT EXISTS meeting_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  description TEXT,
  assignee TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de comentarios de tareas
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de organizaciones
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de miembros de organizaciones
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Crear tabla de grupos
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de miembros de grupos
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Crear políticas RLS para las tablas
-- Meetings
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own meetings" ON meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meetings" ON meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meetings" ON meetings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meetings" ON meetings FOR DELETE USING (auth.uid() = user_id);

-- Transcriptions
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view transcriptions of their meetings" ON transcriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = transcriptions.meeting_id AND meetings.user_id = auth.uid())
);
CREATE POLICY "Users can insert transcriptions for their meetings" ON transcriptions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = transcriptions.meeting_id AND meetings.user_id = auth.uid())
);
CREATE POLICY "Users can update transcriptions of their meetings" ON transcriptions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = transcriptions.meeting_id AND meetings.user_id = auth.uid())
);
CREATE POLICY "Users can delete transcriptions of their meetings" ON transcriptions FOR DELETE USING (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = transcriptions.meeting_id AND meetings.user_id = auth.uid())
);

-- Key Points
ALTER TABLE key_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view key points of their meetings" ON key_points FOR SELECT USING (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = key_points.meeting_id AND meetings.user_id = auth.uid())
);
CREATE POLICY "Users can insert key points for their meetings" ON key_points FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = key_points.meeting_id AND meetings.user_id = auth.uid())
);
CREATE POLICY "Users can update key points of their meetings" ON key_points FOR UPDATE USING (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = key_points.meeting_id AND meetings.user_id = auth.uid())
);
CREATE POLICY "Users can delete key points of their meetings" ON key_points FOR DELETE USING (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = key_points.meeting_id AND meetings.user_id = auth.uid())
);

-- Meeting Keywords
ALTER TABLE meeting_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view keywords of their meetings" ON meeting_keywords FOR SELECT USING (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_keywords.meeting_id AND meetings.user_id = auth.uid())
);
CREATE POLICY "Users can insert keywords for their meetings" ON meeting_keywords FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_keywords.meeting_id AND meetings.user_id = auth.uid())
);
CREATE POLICY "Users can update keywords of their meetings" ON meeting_keywords FOR UPDATE USING (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_keywords.meeting_id AND meetings.user_id = auth.uid())
);
CREATE POLICY "Users can delete keywords of their meetings" ON meeting_keywords FOR DELETE USING (
  EXISTS (SELECT 1 FROM meetings WHERE meetings.id = meeting_keywords.meeting_id AND meetings.user_id = auth.uid())
);

-- Tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Task Comments
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view comments on their tasks" ON task_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id AND tasks.user_id = auth.uid())
);
CREATE POLICY "Users can insert comments on their tasks" ON task_comments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id AND tasks.user_id = auth.uid())
);
CREATE POLICY "Users can update comments on their tasks" ON task_comments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id AND tasks.user_id = auth.uid())
);
CREATE POLICY "Users can delete comments on their tasks" ON task_comments FOR DELETE USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id AND tasks.user_id = auth.uid())
);

-- Organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view organizations they are members of" ON organizations FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = organizations.id AND organization_members.user_id = auth.uid())
);
CREATE POLICY "Users can insert organizations" ON organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Organization admins can update their organizations" ON organizations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = organizations.id AND organization_members.user_id = auth.uid() AND organization_members.role = 'admin')
);
CREATE POLICY "Organization admins can delete their organizations" ON organizations FOR DELETE USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = organizations.id AND organization_members.user_id = auth.uid() AND organization_members.role = 'admin')
);

-- Organization Members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view members of organizations they belong to" ON organization_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM organization_members AS om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid())
);
CREATE POLICY "Organization admins can insert members" ON organization_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = NEW.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = 'admin')
  OR NEW.user_id = auth.uid()
);
CREATE POLICY "Organization admins can update members" ON organization_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = organization_members.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = 'admin')
);
CREATE POLICY "Organization admins can delete members" ON organization_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = organization_members.organization_id AND organization_members.user_id = auth.uid() AND organization_members.role = 'admin')
  OR auth.uid() = user_id
);

-- Groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view groups they are members of" ON groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid())
);
CREATE POLICY "Organization members can insert groups" ON groups FOR INSERT WITH CHECK (
  groups.organization_id IS NULL OR
  EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = groups.organization_id AND organization_members.user_id = auth.uid())
);
CREATE POLICY "Group admins can update their groups" ON groups FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid() AND group_members.role = 'admin')
);
CREATE POLICY "Group admins can delete their groups" ON groups FOR DELETE USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid() AND group_members.role = 'admin')
);

-- Group Members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view members of groups they belong to" ON group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members AS gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid())
);
CREATE POLICY "Group admins can insert members" ON group_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = NEW.group_id AND group_members.user_id = auth.uid() AND group_members.role = 'admin')
  OR NEW.user_id = auth.uid()
);
CREATE POLICY "Group admins can update members" ON group_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_members.group_id AND group_members.user_id = auth.uid() AND group_members.role = 'admin')
);
CREATE POLICY "Group admins can delete members" ON group_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_members.group_id AND group_members.user_id = auth.uid() AND group_members.role = 'admin')
  OR auth.uid() = user_id
);

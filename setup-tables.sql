-- Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  team TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Crear tabla de organizaciones
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Crear tabla de miembros de organizaciones
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, user_id)
);

-- Crear políticas de seguridad para perfiles
CREATE POLICY "Usuarios pueden ver sus propios perfiles"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar sus propios perfiles"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar sus propios perfiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Crear políticas de seguridad para organizaciones
CREATE POLICY "Cualquiera puede ver organizaciones"
  ON organizations FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden crear organizaciones"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creadores pueden actualizar sus organizaciones"
  ON organizations FOR UPDATE
  USING (auth.uid() = created_by);

-- Crear políticas de seguridad para miembros de organizaciones
CREATE POLICY "Cualquiera puede ver miembros de organizaciones"
  ON organization_members FOR SELECT
  USING (true);

CREATE POLICY "Administradores pueden insertar miembros"
  ON organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = NEW.organization_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = NEW.organization_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Administradores pueden actualizar miembros"
  ON organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = OLD.organization_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Administradores pueden eliminar miembros"
  ON organization_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = OLD.organization_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

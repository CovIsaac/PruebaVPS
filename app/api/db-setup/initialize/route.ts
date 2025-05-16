import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar si la tabla profiles existe
    const { data: existingTables, error: checkError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "profiles")

    if (checkError) {
      console.error("Error al verificar tablas:", checkError)
      return NextResponse.json({ error: "Error al verificar tablas" }, { status: 500 })
    }

    // Si la tabla profiles no existe, crear todas las tablas
    if (!existingTables || existingTables.length === 0) {
      // Crear tabla profiles
      const { error: profilesError } = await supabase.rpc("execute_sql", {
        query_text: `
          CREATE TABLE IF NOT EXISTS profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            username TEXT UNIQUE,
            full_name TEXT,
            avatar_url TEXT,
            team TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      })

      if (profilesError) {
        console.error("Error al crear tabla profiles:", profilesError)
        return NextResponse.json({ error: "Error al crear tabla profiles" }, { status: 500 })
      }

      // Crear tabla organizations
      const { error: orgsError } = await supabase.rpc("execute_sql", {
        query_text: `
          CREATE TABLE IF NOT EXISTS organizations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT,
            logo_url TEXT,
            created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      })

      if (orgsError) {
        console.error("Error al crear tabla organizations:", orgsError)
        return NextResponse.json({ error: "Error al crear tabla organizations" }, { status: 500 })
      }

      // Crear tabla organization_members
      const { error: membersError } = await supabase.rpc("execute_sql", {
        query_text: `
          CREATE TABLE IF NOT EXISTS organization_members (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE (organization_id, user_id)
          );
        `,
      })

      if (membersError) {
        console.error("Error al crear tabla organization_members:", membersError)
        return NextResponse.json({ error: "Error al crear tabla organization_members" }, { status: 500 })
      }

      // Crear tabla meetings
      const { error: meetingsError } = await supabase.rpc("execute_sql", {
        query_text: `
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
        `,
      })

      if (meetingsError) {
        console.error("Error al crear tabla meetings:", meetingsError)
        return NextResponse.json({ error: "Error al crear tabla meetings" }, { status: 500 })
      }

      // Crear tabla transcriptions
      const { error: transError } = await supabase.rpc("execute_sql", {
        query_text: `
          CREATE TABLE IF NOT EXISTS transcriptions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
            content JSONB,
            summary TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      })

      if (transError) {
        console.error("Error al crear tabla transcriptions:", transError)
        return NextResponse.json({ error: "Error al crear tabla transcriptions" }, { status: 500 })
      }

      // Crear tabla speakers
      const { error: speakersError } = await supabase.rpc("execute_sql", {
        query_text: `
          CREATE TABLE IF NOT EXISTS speakers (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      })

      if (speakersError) {
        console.error("Error al crear tabla speakers:", speakersError)
        return NextResponse.json({ error: "Error al crear tabla speakers" }, { status: 500 })
      }

      return NextResponse.json({ message: "Tablas creadas correctamente" })
    }

    return NextResponse.json({ message: "Las tablas ya existen" })
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error)
    return NextResponse.json({ error: "Error al inicializar la base de datos" }, { status: 500 })
  }
}

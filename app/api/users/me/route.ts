import { NextResponse } from "next/server"
import { getUsernameFromRequest } from "@/utils/user-helpers"
import type { NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function GET(request: NextRequest) {
  try {
    // Obtener el username del request
    const username = await getUsernameFromRequest(request)

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    // Obtener el cliente de Supabase
    const supabase = createServerSupabaseClient()

    // Buscar el usuario por username en la tabla profiles
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, team")
      .eq("username", username)
      .single()

    if (profileError || !profileData) {
      console.log("Usuario no encontrado en profiles, buscando en auth.users")

      // Intentar buscar por email si el username parece ser un email
      if (username.includes("@")) {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(username)

        if (!userError && userData && userData.user) {
          // Si encontramos el usuario en auth, crear un perfil básico
          return NextResponse.json({
            id: userData.user.id,
            username: username,
            name: userData.user.user_metadata?.full_name || username,
            email: username,
            organization: null,
          })
        }
      }

      // Si no se encuentra en la base de datos, devolver información básica
      return NextResponse.json({
        id: "temp-id",
        username: username,
        name: username,
        email: username,
        organization: null,
      })
    }

    // Buscar la organización del usuario
    const { data: orgMemberData, error: orgMemberError } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", profileData.id)
      .single()

    let organizationInfo = null
    if (!orgMemberError && orgMemberData) {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("id", orgMemberData.organization_id)
        .single()

      if (orgData) {
        organizationInfo = {
          id: orgData.id,
          name: orgData.name,
          role: orgMemberData.role,
        }
      }
    }

    // Extraer información relevante
    const userInfo = {
      id: profileData.id,
      username: profileData.username,
      name: profileData.full_name,
      avatar_url: profileData.avatar_url,
      team: profileData.team,
      organization: organizationInfo,
    }

    return NextResponse.json(userInfo)
  } catch (error) {
    console.error("Error fetching user info:", error)
    return NextResponse.json({ error: "Error fetching user info" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Obtener el username del request
    const username = await getUsernameFromRequest(request)

    if (!username) {
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json()
    const { name, avatar_url, team } = data

    // Obtener el cliente de Supabase
    const supabase = createServerSupabaseClient()

    // Buscar el usuario por username
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Actualizar el perfil del usuario
    const updateData: any = {}
    if (name !== undefined) updateData.full_name = name
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (team !== undefined) updateData.team = team

    const { data: updatedData, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userData.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: "Error updating profile" }, { status: 500 })
    }

    return NextResponse.json(updatedData)
  } catch (error) {
    console.error("Error updating user info:", error)
    return NextResponse.json({ error: "Error updating user info" }, { status: 500 })
  }
}

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase con las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Obtener miembros de un grupo
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Crear cliente de Supabase con cookies
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar la sesión del usuario
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error al obtener la sesión:", sessionError)
      return NextResponse.json({ error: "Error al verificar la autenticación" }, { status: 500 })
    }

    if (!session) {
      console.log("No hay sesión activa en /api/groups/[id]/members")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const groupId = params.id

    // Verificar que el usuario pertenece al grupo
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: "No tienes acceso a este grupo" }, { status: 403 })
    }

    // Obtener todos los miembros del grupo con información de perfil
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select(`
        id,
        role,
        joined_at,
        user_id,
        profiles:user_id (id, full_name, username, email, avatar_url)
      `)
      .eq("group_id", groupId)

    if (membersError) {
      console.error("Error al obtener miembros:", membersError)
      return NextResponse.json({ error: "Error al obtener miembros" }, { status: 500 })
    }

    return NextResponse.json(members || [])
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const groupId = params.id

    // Obtener el nombre de usuario del encabezado
    const username = request.headers.get("X-Username")
    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log("Añadiendo usuario", username, "al grupo", groupId)

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Verificar que el grupo existe
    const { data: groupData, error: groupError } = await supabase.from("groups").select("id").eq("id", groupId).single()

    if (groupError) {
      console.error("Error al verificar grupo:", groupError)
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 })
    }

    // Obtener el ID del usuario
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single()

    if (userError || !userData) {
      console.error("Error al obtener el perfil del usuario:", userError)
      return NextResponse.json(
        { error: "No se pudo encontrar el perfil del usuario", details: userError },
        { status: 404 },
      )
    }

    const userId = userData.id

    // Verificar si el usuario ya pertenece a un grupo
    const { data: existingMembership, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId)
      .maybeSingle()

    if (membershipError && !membershipError.message.includes("does not exist")) {
      console.error("Error al verificar membresía existente:", membershipError)
      return NextResponse.json(
        { error: "Error al verificar membresía existente", details: membershipError },
        { status: 500 },
      )
    }

    if (existingMembership) {
      return NextResponse.json(
        { error: "El usuario ya pertenece a un grupo. Debe abandonar el grupo actual antes de unirse a otro." },
        { status: 400 },
      )
    }

    // Añadir al usuario como miembro del grupo
    const { error: addMemberError } = await supabase.from("group_members").insert([
      {
        group_id: groupId,
        user_id: userId,
        role: "member",
        joined_at: new Date().toISOString(),
      },
    ])

    if (addMemberError) {
      console.error("Error al añadir miembro:", addMemberError)
      return NextResponse.json({ error: "Error al añadir miembro", details: addMemberError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Usuario añadido al grupo correctamente",
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message || "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const groupId = params.id

    // Obtener el nombre de usuario del encabezado
    const username = request.headers.get("X-Username")
    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log("Eliminando usuario", username, "del grupo", groupId)

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Obtener el ID del usuario
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single()

    if (userError || !userData) {
      console.error("Error al obtener el perfil del usuario:", userError)
      return NextResponse.json(
        { error: "No se pudo encontrar el perfil del usuario", details: userError },
        { status: 404 },
      )
    }

    const userId = userData.id

    // Verificar si el usuario es administrador del grupo
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single()

    if (membershipError) {
      console.error("Error al verificar membresía:", membershipError)
      return NextResponse.json({ error: "Error al verificar membresía", details: membershipError }, { status: 500 })
    }

    const isAdmin = membership.role === "admin"

    // Si el usuario es administrador, verificar si es el único administrador
    if (isAdmin) {
      const { data: adminCount, error: adminCountError } = await supabase
        .from("group_members")
        .select("id", { count: "exact" })
        .eq("group_id", groupId)
        .eq("role", "admin")

      if (adminCountError) {
        console.error("Error al contar administradores:", adminCountError)
        return NextResponse.json(
          { error: "Error al verificar administradores", details: adminCountError },
          { status: 500 },
        )
      }

      // Si es el único administrador, eliminar todo el grupo
      if (adminCount.length === 1) {
        // Eliminar el grupo (la restricción ON DELETE CASCADE eliminará los miembros)
        const { error: deleteGroupError } = await supabase.from("groups").delete().eq("id", groupId)

        if (deleteGroupError) {
          console.error("Error al eliminar grupo:", deleteGroupError)
          return NextResponse.json({ error: "Error al eliminar grupo", details: deleteGroupError }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "Grupo eliminado correctamente",
        })
      }
    }

    // Si no es el único administrador o no es administrador, solo eliminar al miembro
    const { error: deleteMemberError } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId)

    if (deleteMemberError) {
      console.error("Error al eliminar miembro:", deleteMemberError)
      return NextResponse.json({ error: "Error al eliminar miembro", details: deleteMemberError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado del grupo correctamente",
    })
  } catch (error: any) {
    console.error("Error inesperado:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message || "Error desconocido",
      },
      { status: 500 },
    )
  }
}

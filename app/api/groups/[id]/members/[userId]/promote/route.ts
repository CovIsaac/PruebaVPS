import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase con las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function PUT(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    const groupId = params.id
    const targetUserId = params.userId

    // Obtener el nombre de usuario del encabezado
    const username = request.headers.get("X-Username")
    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log("Promoviendo usuario", targetUserId, "a administrador del grupo", groupId)

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Obtener el ID del usuario que realiza la acción
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

    // Verificar que el usuario que realiza la acción es administrador del grupo
    const { data: adminMembership, error: adminError } = await supabase
      .from("group_members")
      .select("is_admin")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .single()

    if (adminError || !adminMembership) {
      console.error("Error al verificar permisos de administrador:", adminError)
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción", details: adminError },
        { status: 403 },
      )
    }

    if (!adminMembership.is_admin) {
      return NextResponse.json({ error: "Solo los administradores pueden promover a otros miembros" }, { status: 403 })
    }

    // Verificar que el usuario a promover existe y pertenece al grupo
    const { data: targetMembership, error: targetError } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .single()

    if (targetError || !targetMembership) {
      console.error("Error al verificar membresía del usuario objetivo:", targetError)
      return NextResponse.json({ error: "El usuario no pertenece al grupo", details: targetError }, { status: 404 })
    }

    // Promover al usuario a administrador
    const { error: promoteError } = await supabase
      .from("group_members")
      .update({ is_admin: true })
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)

    if (promoteError) {
      console.error("Error al promover al usuario:", promoteError)
      return NextResponse.json({ error: "Error al promover al usuario", details: promoteError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Usuario promovido a administrador correctamente",
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

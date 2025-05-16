import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Eliminar un miembro del grupo
export async function DELETE(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id: groupId, userId: targetUserId } = params

    // Verificar que el grupo existe
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, created_by")
      .eq("id", groupId)
      .single()

    if (groupError) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 })
    }

    // Verificar si el usuario a eliminar es el creador del grupo
    if (group.created_by === targetUserId) {
      return NextResponse.json(
        {
          error: "No se puede eliminar al creador del grupo",
        },
        { status: 400 },
      )
    }

    // Si el usuario intenta eliminarse a sí mismo, permitirlo
    if (session.user.id === targetUserId) {
      const { error: deleteError } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", targetUserId)

      if (deleteError) {
        console.error("Error al eliminar miembro:", deleteError)
        return NextResponse.json({ error: "Error al abandonar el grupo" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // Si intenta eliminar a otro usuario, verificar que es admin
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single()

    if (adminCheckError || !adminCheck) {
      return NextResponse.json(
        {
          error: "No tienes permisos para eliminar miembros",
        },
        { status: 403 },
      )
    }

    // Eliminar al miembro
    const { error: deleteError } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)

    if (deleteError) {
      console.error("Error al eliminar miembro:", deleteError)
      return NextResponse.json({ error: "Error al eliminar miembro" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// Actualizar rol de un miembro
export async function PATCH(request: NextRequest, { params }: { params: { id: string; userId: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id: groupId, userId: targetUserId } = params
    const { role } = await request.json()

    if (!role || !["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
    }

    // Verificar que el usuario actual es admin
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single()

    if (adminCheckError || !adminCheck) {
      return NextResponse.json(
        {
          error: "No tienes permisos para cambiar roles",
        },
        { status: 403 },
      )
    }

    // Actualizar el rol del miembro
    const { data: updatedMember, error: updateError } = await supabase
      .from("group_members")
      .update({ role })
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .select()

    if (updateError) {
      console.error("Error al actualizar rol:", updateError)
      return NextResponse.json({ error: "Error al actualizar rol" }, { status: 500 })
    }

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

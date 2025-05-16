import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Obtener información de un grupo específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const groupId = params.id

    // Verificar que el usuario pertenece al grupo
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .single()

    if (membershipError) {
      return NextResponse.json({ error: "No tienes acceso a este grupo" }, { status: 403 })
    }

    // Obtener información del grupo
    const { data: group, error: groupError } = await supabase.from("groups").select("*").eq("id", groupId).single()

    if (groupError) {
      console.error("Error al obtener grupo:", groupError)
      return NextResponse.json({ error: "Error al obtener información del grupo" }, { status: 500 })
    }

    // Obtener el número de miembros
    const { count, error: countError } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)

    if (countError) {
      console.error("Error al contar miembros:", countError)
    }

    return NextResponse.json({
      ...group,
      memberCount: count || 0,
      userRole: membership.role,
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// Actualizar información de un grupo
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const groupId = params.id
    const { name, description } = await request.json()

    // Verificar que el usuario es administrador del grupo
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
          error: "No tienes permisos para editar este grupo",
        },
        { status: 403 },
      )
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (name) updates.name = name
    if (description !== undefined) updates.description = description

    // Actualizar el grupo
    const { data: updatedGroup, error: updateError } = await supabase
      .from("groups")
      .update(updates)
      .eq("id", groupId)
      .select()

    if (updateError) {
      console.error("Error al actualizar grupo:", updateError)
      return NextResponse.json({ error: "Error al actualizar grupo" }, { status: 500 })
    }

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// Eliminar un grupo
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const groupId = params.id

    // Verificar que el usuario es el creador del grupo
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("created_by")
      .eq("id", groupId)
      .single()

    if (groupError) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 })
    }

    if (group.created_by !== session.user.id) {
      return NextResponse.json(
        {
          error: "Solo el creador puede eliminar el grupo",
        },
        { status: 403 },
      )
    }

    // Eliminar el grupo (las membresías se eliminarán automáticamente por la restricción ON DELETE CASCADE)
    const { error: deleteError } = await supabase.from("groups").delete().eq("id", groupId)

    if (deleteError) {
      console.error("Error al eliminar grupo:", deleteError)
      return NextResponse.json({ error: "Error al eliminar grupo" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

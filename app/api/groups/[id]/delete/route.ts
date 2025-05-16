import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Iniciando proceso de eliminación del grupo:", params.id)

    // Obtener el nombre de usuario del encabezado
    const username = request.headers.get("X-Username")
    if (!username) {
      console.error("No se proporcionó el nombre de usuario en el encabezado X-Username")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("Usuario solicitando eliminación:", username)

    // Crear cliente de Supabase
    const supabase = createServerSupabaseClient()

    // Verificar que el usuario existe
    console.log("Verificando existencia del usuario...")
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single()

    if (userError || !userData) {
      console.error("Error al verificar usuario:", userError)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const userId = userData.id
    console.log("ID de usuario encontrado:", userId)

    // Verificar que el usuario es administrador del grupo
    console.log("Verificando si el usuario es administrador del grupo...")
    const { data: memberData, error: memberError } = await supabase
      .from("group_members")
      .select("is_admin")
      .eq("user_id", userId)
      .eq("group_id", params.id)
      .single()

    if (memberError || !memberData) {
      console.error("Error al verificar membresía:", memberError)
      return NextResponse.json({ error: "No eres miembro de este grupo" }, { status: 403 })
    }

    // Verificar si el usuario es administrador
    const isAdmin = memberData.is_admin === true

    if (!isAdmin) {
      console.error("El usuario no es administrador del grupo")
      return NextResponse.json({ error: "No tienes permisos para eliminar este grupo" }, { status: 403 })
    }

    console.log("Usuario verificado como administrador, procediendo a eliminar el grupo")

    // Contar y listar miembros del grupo para depuración
    const {
      data: members,
      count: memberCount,
      error: countError,
    } = await supabase.from("group_members").select("*", { count: "exact" }).eq("group_id", params.id)

    console.log(`El grupo tiene ${memberCount || 0} miembros antes de la eliminación:`, members)

    // Eliminar todos los miembros del grupo - PASO CRÍTICO
    console.log("Eliminando miembros del grupo...")
    const { error: deleteMemError } = await supabase.from("group_members").delete().eq("group_id", params.id)

    if (deleteMemError) {
      console.error("Error al eliminar miembros del grupo:", deleteMemError)
      return NextResponse.json(
        { error: "Error al eliminar miembros del grupo", details: deleteMemError },
        { status: 500 },
      )
    }

    // Verificar que los miembros se eliminaron correctamente
    const { count: remainingCount, error: verifyError } = await supabase
      .from("group_members")
      .select("*", { count: "exact" })
      .eq("group_id", params.id)

    console.log(`Miembros restantes después de la eliminación: ${remainingCount || 0}`)

    if (remainingCount && remainingCount > 0) {
      console.warn("Advertencia: Aún quedan miembros en el grupo después de intentar eliminarlos")
    }

    // Eliminar el grupo
    console.log("Eliminando el grupo...")
    const { error: deleteGroupError } = await supabase.from("groups").delete().eq("id", params.id)

    if (deleteGroupError) {
      console.error("Error al eliminar el grupo:", deleteGroupError)
      return NextResponse.json({ error: "Error al eliminar el grupo", details: deleteGroupError }, { status: 500 })
    }

    console.log("Grupo eliminado exitosamente")
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error inesperado al eliminar grupo:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud", details: error.message }, { status: 500 })
  }
}

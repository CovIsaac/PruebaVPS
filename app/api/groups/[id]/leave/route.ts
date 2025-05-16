import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Iniciando proceso para abandonar el grupo:", params.id)

    // Obtener el nombre de usuario del encabezado
    const username = request.headers.get("X-Username")
    if (!username) {
      console.error("No se proporcionó el nombre de usuario en el encabezado X-Username")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("Usuario solicitando abandonar grupo:", username)

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

    // Verificar que el usuario es miembro del grupo
    console.log("Verificando si el usuario es miembro del grupo...")
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

    // Verificar si el usuario es el último administrador
    if (memberData.is_admin) {
      const { data: adminCount, error: adminCountError } = await supabase
        .from("group_members")
        .select("id", { count: "exact" })
        .eq("group_id", params.id)
        .eq("is_admin", true)

      if (!adminCountError && adminCount === 1) {
        console.error("El usuario es el último administrador del grupo")
        return NextResponse.json(
          {
            error: "No puedes abandonar el grupo",
            details: "Eres el último administrador. Debes promover a otro miembro o eliminar el grupo.",
          },
          { status: 400 },
        )
      }
    }

    // Eliminar la membresía del usuario
    console.log("Eliminando membresía del usuario...")
    const { error: deleteMemberError } = await supabase
      .from("group_members")
      .delete()
      .eq("user_id", userId)
      .eq("group_id", params.id)

    if (deleteMemberError) {
      console.error("Error al eliminar membresía:", deleteMemberError)
      return NextResponse.json({ error: "Error al abandonar el grupo", details: deleteMemberError }, { status: 500 })
    }

    // Verificar que la membresía se eliminó correctamente
    const { data: verifyMember, error: verifyError } = await supabase
      .from("group_members")
      .select("*")
      .eq("user_id", userId)
      .eq("group_id", params.id)
      .single()

    if (!verifyError && verifyMember) {
      console.warn("Advertencia: La membresía aún existe después de intentar eliminarla")
    } else {
      console.log("Membresía eliminada correctamente")
    }

    return NextResponse.json({
      success: true,
      message: "Has abandonado el grupo exitosamente",
    })
  } catch (error: any) {
    console.error("Error inesperado al abandonar grupo:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud", details: error.message }, { status: 500 })
  }
}

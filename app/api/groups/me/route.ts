import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function GET(request: Request) {
  try {
    // Obtener el nombre de usuario del encabezado
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log("Obteniendo información de grupos para el usuario:", username)

    // Crear cliente de Supabase
    const supabase = createServerSupabaseClient()

    // Obtener el ID del usuario - usamos profiles en lugar de users
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .limit(1)

    if (userError) {
      console.error("Error al obtener el usuario:", userError)
      return NextResponse.json({ error: "Usuario no encontrado", details: userError.message }, { status: 404 })
    }

    if (!userData || userData.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const userId = userData[0].id
    console.log("ID de usuario encontrado:", userId)

    // Obtener todos los grupos a los que pertenece el usuario a través de la tabla group_members
    const { data: memberships, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id, is_admin")
      .eq("user_id", userId)

    if (membershipError) {
      console.error("Error al obtener las membresías del grupo:", membershipError)
      return NextResponse.json(
        { error: "Error al obtener la información de los grupos", details: membershipError.message },
        { status: 500 },
      )
    }

    if (!memberships || memberships.length === 0) {
      console.log("El usuario no pertenece a ningún grupo")
      return NextResponse.json({ groups: [], members: [] })
    }

    // Obtener los IDs de los grupos
    const groupIds = memberships.map((m) => m.group_id)
    console.log("Grupos encontrados:", groupIds)

    // Crear un mapa de grupo_id -> is_admin
    const adminStatusMap = memberships.reduce(
      (map, m) => {
        map[m.group_id] = m.is_admin
        return map
      },
      {} as Record<string, boolean>,
    )

    // Obtener información de todos los grupos
    const { data: groupsData, error: groupsError } = await supabase
      .from("groups")
      .select("id, name, join_code, description, created_at, created_by")
      .in("id", groupIds)

    if (groupsError) {
      console.error("Error al obtener los grupos:", groupsError)
      return NextResponse.json(
        { error: "Error al obtener la información de los grupos", details: groupsError.message },
        { status: 500 },
      )
    }

    if (!groupsData || groupsData.length === 0) {
      console.log("No se encontraron los grupos con IDs:", groupIds)
      return NextResponse.json({ groups: [], members: [] })
    }

    // Transformar los datos de los grupos para incluir el estado de administrador
    const groups = groupsData.map((group) => ({
      id: group.id,
      name: group.name,
      code: group.join_code,
      description: group.description,
      created_at: group.created_at,
      created_by: group.created_by,
      is_admin: adminStatusMap[group.id] || false,
    }))

    // Obtener miembros para cada grupo
    const allMembers: Record<string, any[]> = {}

    for (const groupId of groupIds) {
      // Obtener todos los miembros del grupo
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, is_admin")
        .eq("group_id", groupId)

      if (membersError) {
        console.error("Error al obtener los miembros del grupo:", membersError)
        continue
      }

      if (!membersData || membersData.length === 0) {
        allMembers[groupId] = []
        continue
      }

      // Obtener información detallada de cada miembro
      const memberIds = membersData.map((member) => member.user_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .in("id", memberIds)

      if (profilesError) {
        console.error("Error al obtener la información de los usuarios:", profilesError)
        allMembers[groupId] = []
        continue
      }

      // Combinar la información de los usuarios con su estado de administrador
      const members = profilesData.map((user) => {
        const memberInfo = membersData.find((member) => member.user_id === user.id)
        return {
          id: user.id,
          username: user.username,
          full_name: user.full_name || user.username,
          is_admin: memberInfo ? memberInfo.is_admin : false,
        }
      })

      allMembers[groupId] = members
    }

    return NextResponse.json({
      groups,
      members: allMembers,
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

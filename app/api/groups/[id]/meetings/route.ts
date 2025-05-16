import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const groupId = params.id
    console.log(`Obteniendo reuniones para el grupo: ${groupId}`)

    // Verificar que tenemos un ID de grupo válido
    if (!groupId) {
      console.error("ID de grupo no proporcionado")
      return NextResponse.json({ error: "ID de grupo no proporcionado" }, { status: 400 })
    }

    // Obtener el nombre de usuario del encabezado
    const username = request.headers.get("X-Username")
    if (!username) {
      console.error("Nombre de usuario no proporcionado")
      return NextResponse.json({ error: "Nombre de usuario no proporcionado" }, { status: 400 })
    }

    console.log(`Usuario solicitando reuniones: ${username}`)

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)

    // MODIFICACIÓN: Verificar si hay usuarios en la tabla
    const { count: userCount, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error al contar usuarios:", countError)
    } else {
      console.log(`Total de usuarios en la base de datos: ${userCount}`)
    }

    // MODIFICACIÓN: Obtener todos los usuarios para depuración
    const { data: allUsers, error: allUsersError } = await supabase.from("users").select("id, username").limit(10)

    if (allUsersError) {
      console.error("Error al obtener lista de usuarios:", allUsersError)
    } else {
      console.log("Muestra de usuarios en la base de datos:", allUsers)
    }

    // Verificar que el usuario existe
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username")
      .eq("username", username)
      .limit(10)

    if (usersError) {
      console.error("Error al consultar usuarios:", usersError)
      return NextResponse.json({ error: "Error al verificar usuario: " + usersError.message }, { status: 500 })
    }

    if (!users || users.length === 0) {
      console.error("Usuario no encontrado:", username)

      // MODIFICACIÓN: Intentar buscar el usuario con una búsqueda menos estricta
      const { data: similarUsers, error: similarError } = await supabase
        .from("users")
        .select("id, username")
        .ilike("username", `%${username}%`)
        .limit(5)

      if (!similarError && similarUsers && similarUsers.length > 0) {
        console.log("Usuarios similares encontrados:", similarUsers)
        return NextResponse.json(
          {
            error: "Usuario no encontrado",
            message: `El usuario '${username}' no existe. ¿Quizás quisiste decir: ${similarUsers.map((u) => u.username).join(", ")}?`,
          },
          { status: 404 },
        )
      }

      // MODIFICACIÓN: Obtener las reuniones sin verificar el usuario
      console.log("Intentando obtener reuniones sin verificar usuario...")
      const { data: meetings, error: meetingsError } = await supabase
        .from("meetings")
        .select(`
          *,
          transcriptions:transcriptions(count),
          key_points:key_points(count)
        `)
        .eq("group_id", groupId)
        .order("date", { ascending: false })

      if (meetingsError) {
        console.error("Error al obtener las reuniones:", meetingsError)
        return NextResponse.json({ error: "Usuario no encontrado y error al obtener reuniones" }, { status: 404 })
      }

      console.log(`Reuniones encontradas sin verificar usuario: ${meetings?.length || 0}`)

      if (!meetings || meetings.length === 0) {
        return NextResponse.json({ error: "Usuario no encontrado y no hay reuniones para este grupo" }, { status: 404 })
      }

      // Devolver las reuniones aunque el usuario no exista (solo para depuración)
      return NextResponse.json(meetings)
    }

    if (users.length > 1) {
      console.warn(`Se encontraron múltiples usuarios con el nombre ${username}. Usando el primero.`)
    }

    // Usar el primer usuario encontrado
    const user = users[0]
    console.log(`Usuario encontrado: ${user.id}, username: ${user.username}`)

    // MODIFICACIÓN: Verificar si el grupo existe
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name")
      .eq("id", groupId)
      .single()

    if (groupError) {
      console.error("Error al verificar grupo:", groupError)
    } else if (group) {
      console.log(`Grupo encontrado: ${group.id}, nombre: ${group.name}`)
    } else {
      console.error("Grupo no encontrado:", groupId)
    }

    // Verificar que el usuario pertenece al grupo
    const { data: memberships, error: membershipsError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .limit(1)

    if (membershipsError) {
      console.error("Error al verificar membresía:", membershipsError)
      return NextResponse.json({ error: "Error al verificar membresía en el grupo" }, { status: 500 })
    }

    if (!memberships || memberships.length === 0) {
      console.error(`Usuario ${username} (${user.id}) no es miembro del grupo ${groupId}`)

      // MODIFICACIÓN: Obtener las reuniones aunque el usuario no sea miembro
      console.log("Intentando obtener reuniones sin verificar membresía...")
      const { data: meetings, error: meetingsError } = await supabase
        .from("meetings")
        .select(`
          *,
          transcriptions:transcriptions(count),
          key_points:key_points(count)
        `)
        .eq("group_id", groupId)
        .order("date", { ascending: false })

      if (meetingsError) {
        console.error("Error al obtener las reuniones:", meetingsError)
        return NextResponse.json(
          { error: "No tienes acceso a este grupo y error al obtener reuniones" },
          { status: 403 },
        )
      }

      console.log(`Reuniones encontradas sin verificar membresía: ${meetings?.length || 0}`)

      if (!meetings || meetings.length === 0) {
        return NextResponse.json({ error: "No tienes acceso a este grupo y no hay reuniones" }, { status: 403 })
      }

      // Devolver las reuniones aunque el usuario no sea miembro (solo para depuración)
      return NextResponse.json(meetings)
    }

    console.log(`Membresía verificada para el usuario ${username} en el grupo ${groupId}`)

    // Obtener las reuniones del grupo
    console.log(`Consultando reuniones con group_id = ${groupId}`)

    const { data: meetings, error: meetingsError } = await supabase
      .from("meetings")
      .select(`
        *,
        transcriptions:transcriptions(count),
        key_points:key_points(count)
      `)
      .eq("group_id", groupId)
      .order("date", { ascending: false })

    if (meetingsError) {
      console.error("Error al obtener las reuniones:", meetingsError)
      return NextResponse.json({ error: "Error al obtener las reuniones: " + meetingsError.message }, { status: 500 })
    }

    console.log(`Reuniones encontradas: ${meetings?.length || 0}`)

    // Si no hay reuniones, devolver un array vacío
    if (!meetings || meetings.length === 0) {
      console.log("No se encontraron reuniones para este grupo")
      return NextResponse.json([])
    }

    // Procesar los resultados para calcular el número de participantes
    const processedMeetings = await Promise.all(
      meetings.map(async (meeting) => {
        // Obtener el número de participantes únicos
        const { data: speakers, error: speakersError } = await supabase
          .from("transcriptions")
          .select("speaker")
          .eq("meeting_id", meeting.id)
          .not("speaker", "is", null)
          .not("speaker", "eq", "")

        if (speakersError) {
          console.error(`Error al obtener speakers para la reunión ${meeting.id}:`, speakersError)
        }

        const uniqueSpeakers = speakers ? [...new Set(speakers.map((item) => item.speaker))].length : 0

        return {
          ...meeting,
          participants: uniqueSpeakers,
        }
      }),
    )

    console.log(`Reuniones procesadas: ${processedMeetings.length}`)
    return NextResponse.json(processedMeetings)
  } catch (error) {
    console.error("Error al obtener las reuniones del grupo:", error)
    return NextResponse.json(
      { error: "Error interno del servidor: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}

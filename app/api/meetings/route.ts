import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

// Crear cliente de Supabase con la clave de servicio para tener permisos completos
const supabase = createClient(supabaseUrl, supabaseKey)

// Función para registrar información de depuración
const logDebug = (message: string, data?: any) => {
  console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : "")
}

// Función para verificar la conexión a Supabase
const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from("meetings").select("id").limit(1)
    if (error) throw error
    return true
  } catch (error) {
    console.error("Error al verificar la conexión a Supabase:", error)
    return false
  }
}

// Modificar la función GET para incluir reuniones de grupos
export async function GET(request: NextRequest) {
  try {
    // Get username from the request headers
    const username = request.headers.get("X-Username")

    if (!username) {
      console.error("Unauthorized - Username not provided")
      return NextResponse.json({ error: "Unauthorized - Username not provided" }, { status: 401 })
    }

    // Verificar la conexión a Supabase
    const isConnected = await checkSupabaseConnection()
    if (!isConnected) {
      return NextResponse.json({ error: "No se pudo conectar a la base de datos" }, { status: 500 })
    }

    // Obtener el ID del usuario
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .limit(1)

    if (userError) {
      console.error("Error al obtener el usuario:", userError)
      return NextResponse.json({ error: "Error al obtener el usuario", details: userError.message }, { status: 500 })
    }

    if (!userData || userData.length === 0) {
      console.error("Usuario no encontrado:", username)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const userId = userData[0].id
    console.log("ID de usuario encontrado:", userId)

    // Obtener los grupos a los que pertenece el usuario
    const { data: memberships, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId)

    if (membershipError) {
      console.error("Error al obtener las membresías del grupo:", membershipError)
      return NextResponse.json(
        { error: "Error al obtener la información de los grupos", details: membershipError.message },
        { status: 500 },
      )
    }

    // Extraer los IDs de los grupos
    const groupIds = memberships ? memberships.map((m) => m.group_id) : []
    console.log("Grupos a los que pertenece el usuario:", groupIds)

    // Consultar las reuniones personales del usuario
    const { data: personalMeetings, error: personalError } = await supabase
      .from("meetings")
      .select(`
        *,
        transcriptions:transcriptions(count),
        key_points:key_points(count)
      `)
      .eq("username", username)
      .order("date", { ascending: false })

    if (personalError) {
      console.error("Error al obtener las reuniones personales:", personalError)
      return NextResponse.json(
        { error: "Error al obtener las reuniones personales", details: personalError.message },
        { status: 500 },
      )
    }

    // Si el usuario no pertenece a ningún grupo, devolver solo sus reuniones personales
    if (groupIds.length === 0) {
      console.log("El usuario no pertenece a ningún grupo, devolviendo solo reuniones personales")

      // Procesar las reuniones personales
      const processedPersonalMeetings = await processTranscriptions(personalMeetings || [])

      return NextResponse.json(processedPersonalMeetings)
    }

    // Consultar las reuniones de los grupos a los que pertenece el usuario
    const { data: groupMeetings, error: groupError } = await supabase
      .from("meetings")
      .select(`
        *,
        transcriptions:transcriptions(count),
        key_points:key_points(count)
      `)
      .in("group_id", groupIds)
      .neq("username", username) // Excluir las reuniones que ya son del usuario
      .order("date", { ascending: false })

    if (groupError) {
      console.error("Error al obtener las reuniones de grupos:", groupError)
      return NextResponse.json(
        { error: "Error al obtener las reuniones de grupos", details: groupError.message },
        { status: 500 },
      )
    }

    // Combinar reuniones personales y de grupos
    const allMeetings = [...(personalMeetings || []), ...(groupMeetings || [])]
    console.log(
      `Total de reuniones encontradas: ${allMeetings.length} (${personalMeetings?.length || 0} personales, ${groupMeetings?.length || 0} de grupos)`,
    )

    // Obtener información de los grupos para las reuniones que tienen group_id
    const meetingsWithGroupId = allMeetings.filter((meeting) => meeting.group_id)
    const groupIdsToFetch = [...new Set(meetingsWithGroupId.map((meeting) => meeting.group_id))]

    let groupsInfo = {}
    if (groupIdsToFetch.length > 0) {
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("id, name")
        .in("id", groupIdsToFetch)

      if (groupsError) {
        console.error("Error al obtener información de los grupos:", groupsError)
      } else if (groupsData) {
        groupsInfo = groupsData.reduce((acc, group) => {
          acc[group.id] = group
          return acc
        }, {})
      }
    }

    // Procesar todas las reuniones con la información de grupos
    const processedMeetings = await processTranscriptions(allMeetings, groupsInfo)

    return NextResponse.json(processedMeetings)
  } catch (error) {
    console.error("Error fetching meetings:", error)
    return NextResponse.json({ error: "Error al obtener las reuniones" }, { status: 500 })
  }
}

// Función para procesar las transcripciones y obtener información adicional
async function processTranscriptions(meetings, groupsInfo = {}) {
  return await Promise.all(
    meetings.map(async (meeting) => {
      // Obtener el número de participantes únicos
      const { data: speakers, error: speakersError } = await supabase
        .from("transcriptions")
        .select("speaker")
        .eq("meeting_id", meeting.id)
        .not("speaker", "is", null)
        .not("speaker", "eq", "")

      const uniqueSpeakers = speakers ? [...new Set(speakers.map((item) => item.speaker))].length : 0

      // Extraer el nombre del grupo si existe
      const groupInfo = meeting.group_id ? groupsInfo[meeting.group_id] : null
      const groupName = groupInfo ? groupInfo.name : null

      return {
        ...meeting,
        participants: uniqueSpeakers,
        group_name: groupName,
        is_group_meeting: !!meeting.group_id,
      }
    }),
  )
}

// Modificar la función POST para usar directamente el cliente de Supabase
export async function POST(request: NextRequest) {
  try {
    // Obtener el nombre de usuario del encabezado
    const username = request.headers.get("X-Username")

    if (!username) {
      console.log("Error: Username no proporcionado")
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    console.log("Username recibido:", username)

    // Obtener los datos de la solicitud
    const data = await request.json()
    console.log("Datos recibidos para nueva reunión:", {
      title: data.title,
      date: data.date,
      groupId: data.groupId,
      transcriptionLength: data.transcription?.length || 0,
      hasAnalysis: !!data.summary,
      keyPointsCount: data.keyPoints?.length || 0,
    })

    // Validar datos mínimos requeridos
    if (!data.title) {
      console.log("Error: Título no proporcionado")
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!data.date) {
      console.log("Error: Fecha no proporcionada")
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    // Verificar la conexión a Supabase
    const isConnected = await checkSupabaseConnection()
    if (!isConnected) {
      return NextResponse.json({ error: "No se pudo conectar a la base de datos" }, { status: 500 })
    }

    try {
      // Preparar los datos para la inserción en la tabla meetings
      const meetingData = {
        title: data.title,
        date: data.date || new Date().toISOString(),
        duration: data.duration || null,
        participants: data.participants || 0,
        summary: data.summary || null,
        audio_url: data.audio_url || null,
        username: username,
        group_id: data.groupId || null, // Añadir el ID del grupo
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("Insertando reunión con datos:", meetingData)

      // Insertar la reunión y obtener el ID
      const { data: meetingResult, error: meetingError } = await supabase.from("meetings").insert(meetingData).select()

      if (meetingError) {
        console.error("Error al insertar la reunión:", meetingError)
        return NextResponse.json(
          { error: "Error al insertar la reunión", details: meetingError.message },
          { status: 500 },
        )
      }

      if (!meetingResult || meetingResult.length === 0) {
        throw new Error("No se pudo insertar la reunión")
      }

      const meetingId = meetingResult[0].id
      console.log("Reunión creada con ID:", meetingId)

      // Si hay transcripción, guardarla
      if (data.transcription && Array.isArray(data.transcription) && data.transcription.length > 0) {
        try {
          console.log(`Insertando ${data.transcription.length} elementos de transcripción`)

          // Preparar los datos de transcripción
          const transcriptionData = data.transcription.map((item) => ({
            meeting_id: meetingId,
            time: item.time || "00:00",
            speaker: item.speaker || "Unknown",
            text: item.text || "",
            created_at: new Date().toISOString(),
          }))

          // Insertar todas las transcripciones de una vez
          const { error: transcriptionError } = await supabase.from("transcriptions").insert(transcriptionData)

          if (transcriptionError) {
            console.error("Error al insertar transcripciones:", transcriptionError)
          } else {
            console.log("Transcripciones guardadas correctamente")
          }
        } catch (transcriptionError) {
          console.error("Error al guardar la transcripción:", transcriptionError)
          // Continuar aunque falle la transcripción
        }
      }

      // Si hay puntos clave, guardarlos
      if (data.keyPoints && Array.isArray(data.keyPoints) && data.keyPoints.length > 0) {
        try {
          console.log(`Insertando ${data.keyPoints.length} puntos clave`)

          // Preparar los datos de puntos clave
          const keyPointsData = data.keyPoints.map((point, index) => ({
            meeting_id: meetingId,
            point_text: point,
            order_num: index + 1,
            created_at: new Date().toISOString(),
          }))

          // Insertar todos los puntos clave de una vez
          const { error: keyPointsError } = await supabase.from("key_points").insert(keyPointsData)

          if (keyPointsError) {
            console.error("Error al insertar puntos clave:", keyPointsError)
          } else {
            console.log("Puntos clave guardados correctamente")
          }
        } catch (keyPointsError) {
          console.error("Error al guardar los puntos clave:", keyPointsError)
          // Continuar aunque falle la inserción de puntos clave
        }
      }

      // Responder con éxito
      return NextResponse.json({
        success: true,
        meetingId,
        message: "Meeting created successfully",
      })
    } catch (dbError) {
      console.error("Error en la base de datos:", dbError)
      return NextResponse.json(
        {
          error: "Database error",
          details: String(dbError),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error creating meeting:", error)
    return NextResponse.json(
      {
        error: "Failed to create meeting",
        details: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

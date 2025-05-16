import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Configuración para el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Crear cliente de Supabase con la clave de servicio para tener permisos completos
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Obtener el nombre de usuario del encabezado
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 401 })
    }

    // Obtener el ID del grupo de los parámetros de consulta
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get("groupId")

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 })
    }

    // Verificar que el usuario pertenece al grupo
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("username", username)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: "You are not a member of this group" }, { status: 403 })
    }

    // Obtener las reuniones del grupo
    const { data: meetings, error } = await supabase
      .from("meetings")
      .select(`
        *,
        transcriptions:transcriptions(count),
        key_points:key_points(count)
      `)
      .eq("group_id", groupId)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching meetings:", error)
      return NextResponse.json({ error: "Failed to fetch meetings" }, { status: 500 })
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

        const uniqueSpeakers = speakers ? [...new Set(speakers.map((item) => item.speaker))].length : 0

        return {
          ...meeting,
          participants: uniqueSpeakers,
        }
      }),
    )

    return NextResponse.json(processedMeetings)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

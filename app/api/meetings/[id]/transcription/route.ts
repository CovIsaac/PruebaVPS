import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const meetingId = Number.parseInt(params.id)
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 })
    }

    // Verificar que el usuario tiene acceso a la reunión
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .single()

    if (meetingError) {
      console.error("Error al obtener la reunión:", meetingError)
      return NextResponse.json({ error: "Error al obtener la reunión" }, { status: 500 })
    }

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    // Verificar si el usuario es dueño de la reunión o es miembro del grupo
    if (meeting.username !== username && meeting.group_id) {
      // Verificar si el usuario es miembro del grupo
      const { data: userData } = await supabase.from("profiles").select("id").eq("username", username).single()

      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const { data: membership, error: membershipError } = await supabase
        .from("group_members")
        .select("*")
        .eq("user_id", userData.id)
        .eq("group_id", meeting.group_id)
        .single()

      if (membershipError || !membership) {
        return NextResponse.json({ error: "No tienes acceso a esta reunión" }, { status: 403 })
      }
    } else if (meeting.username !== username && !meeting.group_id) {
      return NextResponse.json({ error: "No tienes acceso a esta reunión" }, { status: 403 })
    }

    // Obtener la transcripción
    const { data: transcription, error: transcriptionError } = await supabase
      .from("transcriptions")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("id", { ascending: true })

    if (transcriptionError) {
      console.error("Error al obtener la transcripción:", transcriptionError)
      return NextResponse.json({ error: "Error al obtener la transcripción" }, { status: 500 })
    }

    return NextResponse.json(transcription || [])
  } catch (error) {
    console.error("Error getting transcription:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

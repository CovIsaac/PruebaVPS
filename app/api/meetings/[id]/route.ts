import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

// Crear cliente de Supabase con la clave de servicio para tener permisos completos
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const meetingId = params.id

    // Obtener los detalles de la reunión
    const { data: meeting, error } = await supabase.from("meetings").select("*").eq("id", meetingId).single()

    if (error) {
      console.error("Error al obtener la reunión:", error)
      return NextResponse.json({ error: "Error al obtener la reunión" }, { status: 500 })
    }

    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada" }, { status: 404 })
    }

    // Obtener el número de participantes únicos
    const { data: speakers, error: speakersError } = await supabase
      .from("transcriptions")
      .select("speaker")
      .eq("meeting_id", meetingId)
      .not("speaker", "is", null)
      .not("speaker", "eq", "")

    if (speakersError) {
      console.error("Error al obtener los participantes:", speakersError)
    }

    const uniqueSpeakers = speakers ? [...new Set(speakers.map((item) => item.speaker))].length : 0

    // Devolver la reunión con el número de participantes
    return NextResponse.json({
      ...meeting,
      participants: uniqueSpeakers,
    })
  } catch (error) {
    console.error("Error al obtener la reunión:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

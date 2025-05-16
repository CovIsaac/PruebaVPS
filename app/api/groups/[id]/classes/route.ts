import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const groupId = params.id

    // Verificar autenticación
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error("Error de autenticación:", sessionError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Crear cliente con clave de servicio para operaciones privilegiadas
    const adminSupabase = createClient(supabaseUrl, supabaseKey)

    // Verificar que el usuario pertenece al grupo
    const { data: membership, error: membershipError } = await adminSupabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .single()

    if (membershipError || !membership) {
      console.error("Error al verificar membresía:", membershipError)
      return NextResponse.json({ error: "No tienes acceso a este grupo" }, { status: 403 })
    }

    // Obtener las clases (meetings) del grupo
    const { data: classes, error: classesError } = await adminSupabase
      .from("meetings")
      .select(`
        *,
        transcriptions:transcriptions(count),
        key_points:key_points(count)
      `)
      .eq("group_id", groupId)
      .order("date", { ascending: false })

    if (classesError) {
      console.error("Error al obtener las clases:", classesError)
      return NextResponse.json({ error: "Error al obtener las clases" }, { status: 500 })
    }

    // Procesar los resultados para calcular el número de participantes
    const processedClasses = await Promise.all(
      classes.map(async (meeting) => {
        // Obtener el número de participantes únicos
        const { data: speakers, error: speakersError } = await adminSupabase
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

    return NextResponse.json(processedClasses)
  } catch (error) {
    console.error("Error al obtener las clases del grupo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

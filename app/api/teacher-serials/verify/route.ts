import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function POST(request: Request) {
  try {
    const { serial } = await request.json()

    if (!serial) {
      return NextResponse.json({ valid: false, message: "Serial no proporcionado" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Verificar si el serial existe y no ha sido usado
    const { data, error } = await supabase
      .from("teacher_serials")
      .select("*")
      .eq("serial", serial)
      .eq("is_used", false)
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false, message: "Serial inválido o ya utilizado" }, { status: 200 })
    }

    return NextResponse.json({ valid: true, message: "Serial válido" }, { status: 200 })
  } catch (error) {
    console.error("Error al verificar serial:", error)
    return NextResponse.json({ valid: false, message: "Error al verificar el serial" }, { status: 500 })
  }
}

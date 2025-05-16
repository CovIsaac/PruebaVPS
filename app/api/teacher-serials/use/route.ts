import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function POST(request: Request) {
  try {
    const { serial, userId } = await request.json()

    if (!serial || !userId) {
      return NextResponse.json({ success: false, message: "Serial o ID de usuario no proporcionado" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Actualizar el serial como usado
    const { data, error } = await supabase
      .from("teacher_serials")
      .update({ is_used: true, used_by: userId })
      .eq("serial", serial)
      .eq("is_used", false)
      .select()

    if (error) {
      console.error("Error al marcar serial como usado:", error)
      return NextResponse.json({ success: false, message: "Error al marcar el serial como usado" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, message: "Serial inválido o ya utilizado" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Serial marcado como usado correctamente" }, { status: 200 })
  } catch (error) {
    console.error("Error al marcar serial como usado:", error)
    return NextResponse.json({ success: false, message: "Error al marcar el serial como usado" }, { status: 500 })
  }
}

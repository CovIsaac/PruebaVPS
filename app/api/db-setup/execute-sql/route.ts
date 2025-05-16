import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sql } = body

    if (!sql) {
      return NextResponse.json({ error: "SQL query is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Ejecutar SQL directamente usando la API REST de Supabase
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_ANON_KEY || "",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
      },
      body: JSON.stringify({
        query: sql,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error al ejecutar SQL:", errorData)
      return NextResponse.json({ error: "Error al ejecutar SQL" }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error al ejecutar SQL:", error)
    return NextResponse.json({ error: "Error al ejecutar SQL" }, { status: 500 })
  }
}

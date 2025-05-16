import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/utils/supabase"

export async function POST(request: NextRequest) {
  try {
    const { id, username, full_name, email } = await request.json()

    // Validar que todos los campos requeridos estén presentes
    if (!id || !username || !full_name || !email) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error al verificar usuario existente:", checkError)
      return NextResponse.json({ error: "Error al verificar usuario existente" }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 409 })
    }

    // Verificar si el usuario existe en auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id)

    if (authError) {
      console.error("Error al verificar usuario en auth:", authError)
      return NextResponse.json({ error: "Error al verificar usuario en auth" }, { status: 500 })
    }

    if (!authUser || !authUser.user) {
      console.error("Usuario no encontrado en auth.users")
      return NextResponse.json({ error: "Usuario no encontrado en auth" }, { status: 404 })
    }

    // Insertar el perfil en Supabase
    const { data: insertedProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id,
        username,
        full_name,
        avatar_url: null,
        team: null,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error al insertar perfil:", insertError)

      // Verificar si es un error de duplicado
      if (insertError.message?.includes("duplicate key")) {
        if (insertError.message?.includes("username")) {
          return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 409 })
        } else if (insertError.message?.includes("id")) {
          // Si el ID ya existe, intentamos actualizar en lugar de insertar
          const { data: updatedProfile, error: updateError } = await supabase
            .from("profiles")
            .update({
              username,
              full_name,
            })
            .eq("id", id)
            .select()
            .single()

          if (updateError) {
            console.error("Error al actualizar perfil:", updateError)
            return NextResponse.json({ error: "Error al actualizar el perfil" }, { status: 500 })
          }

          return NextResponse.json(
            {
              message: "Perfil actualizado correctamente",
              profile: updatedProfile,
            },
            { status: 200 },
          )
        }
      }

      return NextResponse.json({ error: "Error al crear el perfil" }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: "Usuario guardado correctamente",
        profile: insertedProfile,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error al guardar usuario:", error)

    // Verificar si es un error de duplicado
    if (error.message?.includes("duplicate key")) {
      if (error.message?.includes("username")) {
        return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 409 })
      } else if (error.message?.includes("email")) {
        return NextResponse.json({ error: "El correo electrónico ya existe" }, { status: 409 })
      }
    }

    return NextResponse.json({ error: "Error al guardar usuario" }, { status: 500 })
  }
}

// Endpoint para obtener todos los usuarios
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: users, error } = await supabase.from("profiles").select("*")

    if (error) {
      console.error("Error al obtener usuarios:", error)
      throw error
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

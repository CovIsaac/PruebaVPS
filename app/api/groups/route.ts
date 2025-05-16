import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { nanoid } from "nanoid"

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// Función para generar un código de invitación único
async function generateUniqueJoinCode() {
  // Generar un código de 8 caracteres
  const code = nanoid(8).toUpperCase()

  // Verificar que no exista ya un grupo con ese código
  const { data } = await supabase.from("groups").select("id").eq("join_code", code)

  // Si ya existe, generar otro código
  if (data && data.length > 0) {
    return generateUniqueJoinCode()
  }

  return code
}

export async function POST(request: Request) {
  try {
    // Obtener datos del cuerpo de la solicitud
    const { name, description, username } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Se requiere un nombre para el grupo" }, { status: 400 })
    }

    if (!username) {
      return NextResponse.json({ error: "Se requiere un nombre de usuario" }, { status: 400 })
    }

    console.log(`Creando grupo "${name}" para usuario: ${username}`)

    // Buscar el usuario
    let user
    let userError

    // Primero intentamos buscar en la tabla users
    const { data: userData, error: userErr1 } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle()

    if (userData) {
      user = userData
    } else {
      // Si no se encuentra, intentamos buscar en la tabla profiles
      const { data: profileData, error: userErr2 } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle()

      if (profileData) {
        user = profileData
      } else {
        userError = userErr2 || userErr1
      }
    }

    if (!user) {
      console.error("Error al buscar usuario:", userError)
      return NextResponse.json(
        {
          error: "Usuario no encontrado",
          details: {
            message: `No se encontró el usuario con nombre '${username}'`,
            searchedIn: "users y profiles",
          },
        },
        { status: 404 },
      )
    }

    console.log(`Usuario encontrado: ${username} (${user.id})`)

    // Generar un código de invitación único
    const joinCode = await generateUniqueJoinCode()
    console.log(`Código de invitación generado: ${joinCode}`)

    // Crear el grupo
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name,
        description: description || null,
        created_by: user.id,
        created_at: new Date().toISOString(),
        join_code: joinCode,
      })
      .select()

    if (groupError) {
      console.error("Error al crear grupo:", groupError)
      return NextResponse.json({ error: "Error al crear el grupo", details: groupError }, { status: 500 })
    }

    if (!group || group.length === 0) {
      return NextResponse.json({ error: "Error al crear el grupo: no se devolvieron datos" }, { status: 500 })
    }

    console.log(`Grupo creado: ${group[0].name} (${group[0].id})`)

    // Añadir al creador como miembro administrador
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group[0].id,
      user_id: user.id,
      is_admin: true, // El creador es administrador
      joined_at: new Date().toISOString(),
    })

    if (memberError) {
      console.error("Error al añadir al creador como miembro:", memberError)

      // Si falla, eliminar el grupo creado
      await supabase.from("groups").delete().eq("id", group[0].id)

      return NextResponse.json(
        { error: "Error al añadir al creador como miembro", details: memberError },
        { status: 500 },
      )
    }

    console.log(`Usuario ${username} añadido como administrador del grupo ${group[0].name}`)

    // Devolver el grupo creado
    return NextResponse.json({
      id: group[0].id,
      name: group[0].name,
      code: group[0].join_code,
      created_at: group[0].created_at,
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // Obtener todos los grupos (solo para propósitos de administración)
    const { data: groups, error } = await supabase.from("groups").select("*")

    if (error) {
      console.error("Error al obtener grupos:", error)
      return NextResponse.json({ error: "Error al obtener grupos" }, { status: 500 })
    }

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

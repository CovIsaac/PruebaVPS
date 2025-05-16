import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Obtener la clave API de las variables de entorno
    const apiKey = process.env.ASSEMBLY_API_KEY

    // Verificar si la clave API existe
    if (!apiKey) {
      return NextResponse.json(
        {
          status: "error",
          message: "La clave API de AssemblyAI no está configurada",
          configured: false,
        },
        { status: 400 },
      )
    }

    // Verificar si la clave API es válida haciendo una solicitud de prueba
    const response = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "GET",
      headers: {
        Authorization: apiKey,
      },
    })

    if (!response.ok) {
      // Si la respuesta no es exitosa, verificar si es un error de autenticación
      if (response.status === 401) {
        return NextResponse.json(
          {
            status: "error",
            message: "La clave API de AssemblyAI no es válida",
            configured: false,
          },
          { status: 401 },
        )
      }

      // Otros errores podrían ser normales (como no tener transcripciones)
      // pero la clave API podría ser válida
      return NextResponse.json(
        {
          status: "success",
          message: "La clave API de AssemblyAI está configurada correctamente",
          configured: true,
        },
        { status: 200 },
      )
    }

    // Si la respuesta es exitosa, la clave API es válida
    return NextResponse.json(
      {
        status: "success",
        message: "La clave API de AssemblyAI está configurada correctamente",
        configured: true,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al verificar la configuración de AssemblyAI:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error al verificar la configuración de AssemblyAI",
        error: error.message,
        configured: false,
      },
      { status: 500 },
    )
  }
}

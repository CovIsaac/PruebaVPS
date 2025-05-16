import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas que no requieren autenticación
const publicRoutes = ["/", "/login", "/register"]

// Credenciales de Supabase
const supabaseUrl = "https://dmuezwjjdchwbbhrbtfj.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdWV6d2pqZGNod2JiaHJidGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNzA2MjUsImV4cCI6MjA2MjY0NjYyNX0.2mzt7xv-sEKnxyHBdNXqIx7ZwgfL31-Va6thaeGw6Uo"

export async function middleware(req: NextRequest) {
  // Para evitar problemas con el middleware, simplemente permitimos todas las rutas
  // y dejamos que la página maneje la autenticación
  return NextResponse.next()
}

// Configurar el middleware para que se ejecute en todas las rutas excepto las estáticas
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { getSupabaseClient, storeUsername } from "@/utils/supabase"
import { Checkbox } from "@/components/ui/checkbox"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [isTeacher, setIsTeacher] = useState(false)
  const [teacherSerial, setTeacherSerial] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validar campos
      if (!email || !password || !username || !fullName) {
        setError("Todos los campos son obligatorios")
        setLoading(false)
        return
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError("El formato del correo electrónico no es válido")
        setLoading(false)
        return
      }

      // Validar longitud de contraseña
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres")
        setLoading(false)
        return
      }

      // Validar serial de maestro si corresponde
      let role = "student"
      if (isTeacher) {
        if (!teacherSerial) {
          setError("Debe ingresar un serial de maestro")
          setLoading(false)
          return
        }

        // Verificar el serial de maestro
        const supabase = getSupabaseClient()
        const { data: serialData, error: serialError } = await supabase
          .from("teacher_serials")
          .select("*")
          .eq("serial", teacherSerial)
          .eq("is_used", false)
          .single()

        if (serialError || !serialData) {
          setError("El serial de maestro no es válido o ya ha sido utilizado")
          setLoading(false)
          return
        }

        role = "teacher"
      }

      // Crear usuario en Supabase Auth
      const supabase = getSupabaseClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            role,
          },
        },
      })

      if (authError) {
        console.error("Error de autenticación:", authError)
        if (authError.message.includes("already registered")) {
          setError("Este correo electrónico ya está registrado")
        } else {
          setError(authError.message || "Error al registrar usuario")
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError("Error al crear usuario")
        setLoading(false)
        return
      }

      // Guardar el perfil en la base de datos
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: authData.user.id,
          username,
          full_name: fullName,
          email,
          role,
        }),
      })

      const profileData = await response.json()

      if (!response.ok) {
        console.error("Error al guardar perfil:", profileData)

        // Si el error es que el usuario ya existe, intentamos iniciar sesión
        if (response.status === 409) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (signInError) {
            setError(signInError.message || "Error al iniciar sesión")
            setLoading(false)
            return
          }
        } else {
          setError(profileData.error || "Error al guardar perfil")
          setLoading(false)
          return
        }
      }

      // Si es maestro, actualizar el serial como usado
      if (isTeacher && role === "teacher") {
        const { error: updateError } = await supabase
          .from("teacher_serials")
          .update({ is_used: true, used_by: authData.user.id })
          .eq("serial", teacherSerial)

        if (updateError) {
          console.error("Error al actualizar serial:", updateError)
          // No bloqueamos el registro por este error
        }
      }

      // Guardar username en localStorage
      storeUsername(username)

      // Redirigir al perfil
      router.push("/profile")
    } catch (err: any) {
      console.error("Error en el registro:", err)
      setError(err.message || "Error en el proceso de registro")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-900 p-4">
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center text-blue-300 hover:text-white transition-colors"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver al inicio
      </Link>

      <Card className="w-full max-w-md bg-blue-800/30 border border-blue-700/30">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Crear cuenta</CardTitle>
          <CardDescription className="text-blue-300">Ingresa tus datos para registrarte en Juntify</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-200">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="bg-blue-700/40 border border-blue-600/50 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-blue-200">
                Nombre de usuario
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="usuario123"
                className="bg-blue-700/40 border border-blue-600/50 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-blue-200">
                Nombre completo
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Pérez"
                className="bg-blue-700/40 border border-blue-600/50 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-200">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="bg-blue-700/40 border border-blue-600/50 text-white"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isTeacher"
                checked={isTeacher}
                onCheckedChange={(checked) => setIsTeacher(checked === true)}
                className="data-[state=checked]:bg-blue-500"
              />
              <Label htmlFor="isTeacher" className="text-blue-200">
                Soy maestro
              </Label>
            </div>

            {isTeacher && (
              <div className="space-y-2">
                <Label htmlFor="teacherSerial" className="text-blue-200">
                  Serial de maestro
                </Label>
                <Input
                  id="teacherSerial"
                  value={teacherSerial}
                  onChange={(e) => setTeacherSerial(e.target.value)}
                  placeholder="Ingrese el serial proporcionado"
                  className="bg-blue-700/40 border border-blue-600/50 text-white"
                />
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrando...
                </div>
              ) : (
                "Registrarse"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-blue-300">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Iniciar sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

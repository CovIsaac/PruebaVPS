"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/utils/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Marcar que el componente está montado (cliente)
  useEffect(() => {
    setIsMounted(true)

    // Verificar si el usuario ya está autenticado
    const checkSession = async () => {
      try {
        const supabase = getSupabaseClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          router.push("/profile")
        }
      } catch (error) {
        console.error("Error checking session:", error)
      }
    }

    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      router.push("/profile")
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  // No renderizar contenido que depende de window hasta que el componente esté montado
  if (!isMounted) {
    return (
      <div className="absolute inset-0 bg-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-blue-900">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-700/20 to-blue-900/50 opacity-70" />
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      {/* Header with back button */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center text-white/80 hover:text-white transition-colors">
          <ArrowLeft className="mr-2" size={20} />
          <span>Volver al inicio</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10 h-[calc(100%-80px)]">
        <div className="w-full max-w-md">
          {/* Form container with animation */}
          <motion.div
            className="bg-blue-800/70 backdrop-blur-md rounded-2xl border border-blue-600/30 overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Form header */}
            <div className="p-6 pb-0 text-center">
              <motion.h1
                className="text-3xl font-bold text-white mb-2 glow-text"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Iniciar Sesión
              </motion.h1>
              <motion.p
                className="text-blue-100/80 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Accede a tu cuenta para gestionar tus reuniones
              </motion.p>
            </div>

            {/* Form */}
            <motion.div
              className="p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Mensajes de error */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-red-100">{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-blue-100">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-blue-700/40 border border-blue-600/50 text-white placeholder-blue-300/50 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-blue-100">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-blue-700/40 border border-blue-600/50 text-white placeholder-blue-300/50 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 p-2.5"
                      placeholder="Tu contraseña"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-blue-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      name="remember"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                    />
                    <label htmlFor="remember" className="ml-2 block text-blue-100">
                      Recordarme
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert("Funcionalidad en desarrollo")}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg py-2.5 px-5 text-center transition-all duration-300 hover:shadow-lg hover:shadow-purple-600/30 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Iniciando sesión...
                    </span>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </motion.button>

                {/* Toggle between login and register */}
                <div className="text-center mt-4">
                  <Link href="/register" className="text-blue-300 hover:text-blue-200 text-sm">
                    ¿No tienes cuenta? Regístrate
                  </Link>
                </div>
              </form>
            </motion.div>
          </motion.div>

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
                initial={{
                  x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
                  y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
                }}
                animate={{
                  y: [null, Math.random() * -500],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 10 + Math.random() * 10,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { NewNavbar } from "@/components/new-navbar"
import {
  Users,
  UserPlus,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserCog,
  UserX,
  Database,
  PlusCircle,
  School,
  BookOpen,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getUsername } from "@/utils/user-helpers"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { ClassDetailModal } from "@/components/class-detail-modal"
import { AnimatePresence } from "framer-motion"

// Tipo para miembro de grupo
interface GroupMember {
  id: string
  username: string
  full_name?: string
  is_admin: boolean
}

// Tipo para grupo
interface Group {
  id: string
  name: string
  code: string
  description?: string
  created_at: string
  created_by: string
  is_admin: boolean
}

// Tipo para usuario
interface User {
  id: string
  username: string
  full_name?: string
  team?: string
  role?: string
}

export default function GroupsPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Record<string, GroupMember[]>>({})
  const [activeTab, setActiveTab] = useState("classes")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false)
  const [showPromoteDialog, setShowPromoteDialog] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false)
  const [newUserData, setNewUserData] = useState({
    username: "",
    full_name: "",
    team: "",
    role: "",
  })
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [meetings, setMeetings] = useState<any[]>([])
  const [loadingMeetings, setLoadingMeetings] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [showClassDetailModal, setShowClassDetailModal] = useState(false)

  // Verificar autenticación y obtener datos del grupo
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Intentar obtener el nombre de usuario del localStorage
        const storedUsername = getUsername()

        if (storedUsername) {
          console.log("Usuario autenticado:", storedUsername)
          setUsername(storedUsername)

          // Verificar que la tabla group_members existe
          try {
            const response = await fetch("/api/db-setup/group-members")

            if (!response.ok) {
              console.error("Error al verificar tabla group_members:", response.status, response.statusText)
              // No interrumpimos el flujo, continuamos con la verificación del usuario
            } else {
              const data = await response.json()
              console.log("Verificación de tabla group_members:", data)
            }
          } catch (err) {
            console.error("Error al verificar tabla group_members:", err)
            // No interrumpimos el flujo, continuamos con la verificación del usuario
          }

          await checkUserExists(storedUsername)
        } else {
          setLoading(false)
          setError("No se encontró información de usuario. Por favor, inicia sesión nuevamente.")
        }
      } catch (err) {
        console.error("Error al verificar autenticación:", err)
        setError("Error al verificar la sesión")
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Verificar si el usuario existe usando el endpoint del servidor
  const checkUserExists = async (username: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Verificando si el usuario existe:", username)

      // Usar el endpoint del servidor para verificar si el usuario existe
      const response = await fetch(`/api/users/check?username=${encodeURIComponent(username)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.exists) {
        console.log("Usuario no encontrado:", username)
        setDebugInfo(`Usuario "${username}" no encontrado en la base de datos. Puede crear un nuevo usuario.`)
        setLoading(false)
        return
      }

      console.log("Usuario encontrado:", data.user)
      setUserId(data.user.id)
      setNewUserData({
        username: data.user.username || "",
        full_name: data.user.full_name || "",
        team: data.user.team || "",
        role: data.user.role || "",
      })

      // Obtener datos de los grupos
      await fetchGroupsData(username)
    } catch (err: any) {
      console.error("Error al verificar usuario:", err)
      setError(err.message || "Error al verificar usuario")
      setLoading(false)
    }
  }

  // Crear un nuevo usuario usando el endpoint del servidor
  const handleCreateUser = async () => {
    if (!username) return
    if (!newUserData.username.trim()) {
      setError("El nombre de usuario es obligatorio")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      console.log("Creando usuario:", newUserData)

      // Usar el endpoint del servidor para crear un nuevo usuario
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: newUserData.username.trim(),
          full_name: newUserData.full_name.trim() || newUserData.username.trim(),
          team: newUserData.team.trim() || null,
          role: newUserData.role.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      console.log("Usuario creado:", data.user)
      setUserId(data.user.id)
      setShowCreateUserDialog(false)

      // Obtener datos de los grupos
      await fetchGroupsData(username)
    } catch (err: any) {
      console.error("Error al crear usuario:", err)
      setError(err.message || "Error al crear el usuario")
    } finally {
      setSubmitting(false)
    }
  }

  // Obtener datos de los grupos
  const fetchGroupsData = async (username: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Obteniendo datos de los grupos para el usuario:", username)

      const response = await fetch(`/api/groups/me`, {
        headers: {
          "X-Username": username,
        },
      })

      console.log("Respuesta de la API:", response.status)

      if (!response.ok) {
        if (response.status === 404) {
          // El usuario no tiene grupos, esto no es un error
          console.log("Usuario sin grupos")
          setGroups([])
          setMembers({})
          setSelectedGroup(null)
          setLoading(false)
          return
        }

        // Para otros errores, lanzamos una excepción
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Datos recibidos:", data)

      if (!data.groups || data.groups.length === 0) {
        // El usuario no tiene grupos asignados
        setGroups([])
        setMembers({})
        setSelectedGroup(null)
      } else {
        setGroups(data.groups)
        setMembers(data.members || {})
        setSelectedGroup(data.groups[0])
        setGroupName(data.groups[0].name)
        setGroupDescription(data.groups[0].description || "")
      }
    } catch (err: any) {
      console.error("Error al obtener datos de los grupos:", err)
      setError(err.message || "Error al cargar la información de los grupos")
    } finally {
      setLoading(false)
    }
  }

  // Cargar las reuniones del grupo seleccionado
  const fetchMeetings = async (groupId: string) => {
    if (!username || !groupId) {
      console.log("No se puede cargar reuniones: falta username o groupId", { username, groupId })
      return
    }

    try {
      setLoadingMeetings(true)
      console.log(`Cargando reuniones para el grupo ${groupId}...`)

      const response = await fetch(`/api/groups/${groupId}/meetings`, {
        headers: {
          "X-Username": username,
        },
      })

      console.log(`Respuesta del servidor: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error al cargar las reuniones:", response.status, errorText)
        setError(`Error al cargar las reuniones: ${response.status} ${response.statusText}`)
        setMeetings([])
        return
      }

      const data = await response.json()
      console.log("Reuniones cargadas:", data)

      if (!data || !Array.isArray(data)) {
        console.error("Formato de datos incorrecto:", data)
        setError("Formato de datos incorrecto al cargar las reuniones")
        setMeetings([])
        return
      }

      setMeetings(data)
      setError(null)
    } catch (error) {
      console.error("Error al cargar las reuniones:", error)
      setError("Error al cargar las reuniones: " + (error instanceof Error ? error.message : String(error)))
      setMeetings([])
    } finally {
      setLoadingMeetings(false)
    }
  }

  // Actualizar nombre del grupo
  const handleUpdateGroup = async () => {
    if (!username || !selectedGroup || !groupName.trim()) return

    try {
      setSubmitting(true)
      setError(null)

      // Actualizar el nombre del grupo
      const response = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Username": username,
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar el grupo")
      }

      // Actualizar el estado local
      setGroups(
        groups.map((g) =>
          g.id === selectedGroup.id
            ? {
                ...g,
                name: groupName.trim(),
                description: groupDescription.trim() || undefined,
              }
            : g,
        ),
      )

      setSelectedGroup({
        ...selectedGroup,
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
      })

      setDebugInfo("Grupo actualizado correctamente")
    } catch (err: any) {
      console.error("Error al actualizar grupo:", err)
      setError(err.message || "Error al actualizar el grupo")
    } finally {
      setSubmitting(false)
    }
  }

  // Crear un nuevo grupo
  const handleCreateGroup = async () => {
    if (!username) {
      setError("No hay un usuario autenticado. Por favor, inicia sesión nuevamente.")
      return
    }

    if (!userId) {
      setError("No se encontró el ID del usuario. Por favor, crea un usuario primero.")
      setShowCreateUserDialog(true)
      return
    }

    if (!newGroupName.trim()) {
      setError("Por favor, ingresa un nombre para el grupo")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      console.log("Creando grupo:", newGroupName, "para usuario:", username)

      // Crear el grupo
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Username": username,
        },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
          username: username,
        }),
      })

      console.log("Respuesta al crear grupo:", response.status)

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`
        let debugDetails = {}

        try {
          const errorData = await response.json()
          console.error("Detalles del error:", errorData)

          if (errorData.error) {
            errorMessage = errorData.error
            debugDetails = errorData

            if (errorData.details) {
              console.error("Detalles adicionales:", errorData.details)

              if (typeof errorData.details === "object" && errorData.details.message) {
                errorMessage += `: ${errorData.details.message}`
              } else if (typeof errorData.details === "string") {
                errorMessage += `: ${errorData.details}`
              }
            }
          }
        } catch (e) {
          console.error("No se pudo parsear la respuesta de error:", e)
          debugDetails = { parseError: true, originalStatus: response.status }
        }

        setDebugInfo(JSON.stringify(debugDetails, null, 2))
        throw new Error(errorMessage)
      }

      const groupData = await response.json()
      console.log("Grupo creado:", groupData)

      // Actualizar datos
      await fetchGroupsData(username)
      setShowCreateDialog(false)
      setNewGroupName("")
      setNewGroupDescription("")
    } catch (err: any) {
      console.error("Error al crear grupo:", err)
      setError(err.message || "Error al crear el grupo")
    } finally {
      setSubmitting(false)
    }
  }

  // Unirse a un grupo existente
  const handleJoinGroup = async () => {
    if (!username) return
    if (!userId) {
      setError("No se encontró el ID del usuario. Por favor, crea un usuario primero.")
      setShowCreateUserDialog(true)
      return
    }
    if (!joinCode.trim()) {
      setError("Por favor, ingresa un código de grupo")
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setDebugInfo(null)

      console.log("Intentando unirse al grupo con código:", joinCode.trim())

      // Unirse al grupo directamente con el código
      const joinResponse = await fetch("/api/groups/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          joinCode: joinCode.trim(),
          username: username,
        }),
      })

      console.log("Respuesta del servidor:", joinResponse.status)

      if (!joinResponse.ok) {
        let errorMessage = `Error ${joinResponse.status}: ${joinResponse.statusText}`

        try {
          const errorData = await joinResponse.json()
          console.error("Detalles del error:", errorData)

          if (errorData.error) {
            errorMessage = errorData.error
          }

          // Mostrar información de depuración
          setDebugInfo(JSON.stringify(errorData))
        } catch (e) {
          console.error("No se pudo parsear la respuesta de error:", e)
        }

        throw new Error(errorMessage)
      }

      const responseData = await joinResponse.json()
      console.log("Respuesta exitosa:", responseData)

      // Mostrar mensaje de éxito
      setDebugInfo(`Te has unido exitosamente al grupo "${responseData.group.name}"`)

      // Actualizar datos
      await fetchGroupsData(username)
      setShowJoinDialog(false)
      setJoinCode("")
    } catch (err: any) {
      console.error("Error al unirse al grupo:", err)
      setError(err.message || "Error al unirse al grupo")
    } finally {
      setSubmitting(false)
    }
  }

  // Abandonar o eliminar el grupo
  const handleLeaveGroup = async () => {
    if (!username || !selectedGroup) return

    try {
      setSubmitting(true)
      setError(null)
      setDebugInfo(null)

      if (selectedGroup.is_admin) {
        // Si es administrador, eliminar el grupo
        console.log(`Intentando eliminar el grupo ${selectedGroup.id} como administrador`)

        // Usar el endpoint API para eliminar el grupo
        const response = await fetch(`/api/groups/${selectedGroup.id}/delete`, {
          method: "DELETE",
          headers: {
            "X-Username": username,
          },
        })

        console.log(`Respuesta del servidor: ${response.status} ${response.statusText}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("Error al eliminar grupo:", errorData)

          // Mostrar información de depuración
          setDebugInfo(
            JSON.stringify({
              status: response.status,
              statusText: response.statusText,
              errorData: errorData,
            }),
          )

          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
        }

        console.log("Grupo eliminado correctamente")
      } else {
        // Si no es administrador, solo abandonar el grupo
        console.log(`Intentando abandonar el grupo ${selectedGroup.id} como miembro regular`)

        const response = await fetch(`/api/groups/${selectedGroup.id}/leave`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Username": username,
          },
        })

        console.log(`Respuesta del servidor: ${response.status} ${response.statusText}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("Error al abandonar grupo:", errorData)

          // Mostrar información de depuración
          setDebugInfo(
            JSON.stringify({
              status: response.status,
              statusText: response.statusText,
              errorData: errorData,
            }),
          )

          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
        }
      }

      // Actualizar datos
      await fetchGroupsData(username)
      setShowLeaveDialog(false)
    } catch (err: any) {
      console.error("Error al abandonar/eliminar el grupo:", err)
      setError(err.message || "Error al abandonar/eliminar el grupo")
    } finally {
      setSubmitting(false)
    }
  }

  // Eliminar un miembro del grupo
  const handleRemoveMember = async () => {
    if (!username || !selectedGroup || !selectedMember) return

    try {
      setSubmitting(true)
      setError(null)

      // Eliminar al miembro del grupo
      const response = await fetch(`/api/groups/${selectedGroup.id}/members/${selectedMember.id}`, {
        method: "DELETE",
        headers: {
          "X-Username": username,
        },
      })

      if (!response.ok) {
        throw new Error("Error al eliminar al miembro")
      }

      // Actualizar la lista de miembros
      setMembers({
        ...members,
        [selectedGroup.id]: members[selectedGroup.id].filter((member) => member.id !== selectedMember.id),
      })
      setShowRemoveMemberDialog(false)
      setSelectedMember(null)
    } catch (err: any) {
      console.error("Error al eliminar miembro:", err)
      setError(err.message || "Error al eliminar al miembro")
    } finally {
      setSubmitting(false)
    }
  }

  // Promover a un miembro a administrador
  const handlePromoteMember = async () => {
    if (!username || !selectedGroup || !selectedMember) return

    try {
      setSubmitting(true)
      setError(null)

      // Promover al miembro a administrador
      const response = await fetch(`/api/groups/${selectedGroup.id}/members/${selectedMember.id}/promote`, {
        method: "PUT",
        headers: {
          "X-Username": username,
        },
      })

      if (!response.ok) {
        throw new Error("Error al promover al miembro")
      }

      // Actualizar la lista de miembros
      setMembers({
        ...members,
        [selectedGroup.id]: members[selectedGroup.id].map((member) =>
          member.id === selectedMember.id ? { ...member, is_admin: true } : member,
        ),
      })
      setShowPromoteDialog(false)
      setSelectedMember(null)
    } catch (err: any) {
      console.error("Error al promover miembro:", err)
      setError(err.message || "Error al promover al miembro")
    } finally {
      setSubmitting(false)
    }
  }

  // Copiar código de invitación
  const handleCopyCode = () => {
    if (selectedGroup) {
      navigator.clipboard.writeText(selectedGroup.code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  // Manejar selección de grupo
  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group)
    setGroupName(group.name)
    setGroupDescription(group.description || "")
    setActiveTab("classes")
    fetchMeetings(group.id)
  }

  // Cargar reuniones cuando cambie el grupo seleccionado
  useEffect(() => {
    if (selectedGroup) {
      fetchMeetings(selectedGroup.id)
    }
  }, [selectedGroup])

  // Renderizar página de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-300 animate-spin mx-auto mb-4" />
          <p className="text-blue-200">Cargando información de grupos...</p>
        </div>
        <NewNavbar />
      </div>
    )
  }

  // Renderizar página de error de autenticación
  if (error && error.includes("sesión")) {
    return (
      <div className="min-h-screen bg-blue-900 flex flex-col">
        <main className="container mx-auto px-4 pb-24 pt-16 flex-1 flex flex-col items-center justify-center">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-700 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de autenticación</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/login")}>
              Iniciar sesión
            </Button>
          </div>
        </main>
        <NewNavbar />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4 glow-text">Mis Grupos</h1>

          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-white">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {debugInfo && (
            <Alert className="mb-6 bg-yellow-900/50 border-yellow-800 text-white">
              <AlertTitle>Información de depuración</AlertTitle>
              <AlertDescription>
                <div className="text-xs font-mono overflow-auto max-h-32">{debugInfo}</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Información del usuario actual */}
          <Card className="bg-blue-800/20 border-blue-700/30 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Información del usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200">
                Usuario actual: <span className="font-bold">{username || "No autenticado"}</span>
              </p>
              {userId ? (
                <>
                  <p className="text-blue-200 mt-2">
                    ID de usuario: <span className="font-mono text-xs">{userId}</span>
                  </p>
                  {newUserData.full_name && (
                    <p className="text-blue-200 mt-1">
                      Nombre completo: <span className="font-medium">{newUserData.full_name}</span>
                    </p>
                  )}
                  {newUserData.team && (
                    <p className="text-blue-200 mt-1">
                      Equipo: <span className="font-medium">{newUserData.team}</span>
                    </p>
                  )}
                  {newUserData.role && (
                    <p className="text-blue-200 mt-1">
                      Rol: <span className="font-medium">{newUserData.role}</span>
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-4">
                  <Alert className="bg-blue-800/40 border-blue-600/50 text-white">
                    <Database className="h-4 w-4" />
                    <AlertTitle>Usuario no encontrado en la base de datos</AlertTitle>
                    <AlertDescription>
                      No se encontró un usuario con el nombre "{username}" en la base de datos. Puedes crear un nuevo
                      usuario para continuar.
                    </AlertDescription>
                  </Alert>
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateUserDialog(true)}>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Crear usuario en la base de datos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar con lista de grupos */}
            <div className="md:col-span-1">
              <Card className="bg-blue-800/20 border-blue-700/30 mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg">Mis Grupos</CardTitle>
                  <CardDescription className="text-blue-200/70">
                    {groups.length} {groups.length === 1 ? "grupo" : "grupos"} disponibles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {groups.length > 0 ? (
                      groups.map((group) => (
                        <Button
                          key={group.id}
                          variant={selectedGroup?.id === group.id ? "default" : "ghost"}
                          className={`w-full justify-start ${
                            selectedGroup?.id === group.id
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "text-blue-100 hover:bg-blue-700/30"
                          }`}
                          onClick={() => handleSelectGroup(group)}
                        >
                          {group.is_admin ? <School className="h-4 w-4 mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
                          <span className="truncate">{group.name}</span>
                          {group.is_admin && (
                            <Badge variant="outline" className="ml-auto text-xs border-blue-500 text-blue-300">
                              Admin
                            </Badge>
                          )}
                        </Button>
                      ))
                    ) : (
                      <p className="text-blue-200 text-sm py-2">No perteneces a ningún grupo</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex flex-col w-full gap-2">
                    {/* Mostrar botón de crear grupo solo para no estudiantes */}
                    {newUserData.role &&
                      typeof newUserData.role === "string" &&
                      !newUserData.role.toLowerCase().includes("estudiante") &&
                      !newUserData.role.toLowerCase().includes("student") && (
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => setShowCreateDialog(true)}
                          size="sm"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Crear nuevo grupo
                        </Button>
                      )}
                    {/* Todos pueden unirse a un grupo con código */}
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => setShowJoinDialog(true)}
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Unirse con código
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Contenido principal */}
            <div className="md:col-span-3">
              {selectedGroup ? (
                <>
                  {/* Información del grupo */}
                  <Card className="bg-blue-800/20 border-blue-700/30 mb-6">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white text-2xl">{selectedGroup.name}</CardTitle>
                          <CardDescription className="text-blue-200/70">
                            {selectedGroup.is_admin ? "Eres administrador de este grupo" : "Eres miembro de este grupo"}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {typeof newUserData.role === "string" &&
                            !newUserData.role.toLowerCase().includes("student") &&
                            !newUserData.role.toLowerCase().includes("estudiante") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                                onClick={() => setShowLeaveDialog(true)}
                              >
                                Abandonar grupo
                              </Button>
                            )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedGroup.description && (
                          <div>
                            <Label className="text-blue-200 mb-1 block">Descripción</Label>
                            <p className="text-white/90 text-sm bg-blue-700/20 p-3 rounded-md">
                              {selectedGroup.description}
                            </p>
                          </div>
                        )}

                        {typeof newUserData.role === "string" &&
                        !newUserData.role.toLowerCase().includes("student") &&
                        !newUserData.role.toLowerCase().includes("estudiante") ? (
                          <div>
                            <Label className="text-blue-200 mb-1 block">Código de invitación</Label>
                            <div className="flex">
                              <Input
                                value={selectedGroup.code}
                                readOnly={true}
                                className="bg-blue-700/40 border-blue-600/50 text-white"
                              />
                              <Button className="ml-2 bg-blue-600 hover:bg-blue-700" onClick={handleCopyCode}>
                                {codeCopied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                              </Button>
                            </div>
                            <p className="text-xs text-blue-300/70 mt-1">
                              Comparte este código con las personas que quieras invitar a tu grupo
                            </p>
                          </div>
                        ) : (
                          <div>
                            <Label className="text-blue-200 mb-1 block">Miembro del grupo</Label>
                            <p className="text-xs text-blue-300/70 mt-1">Eres miembro de este grupo</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pestañas */}
                  <Tabs defaultValue="classes" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList
                      className={`grid w-full ${selectedGroup.is_admin ? "grid-cols-3" : "grid-cols-1"}
                     } mb-6 bg-blue-800/30`}
                    >
                      <TabsTrigger value="classes" className="data-[state=active]:bg-blue-600">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Clases
                      </TabsTrigger>

                      {selectedGroup.is_admin && (
                        <>
                          <TabsTrigger value="members" className="data-[state=active]:bg-blue-600">
                            <Users className="h-5 w-5 mr-2" />
                            Miembros
                          </TabsTrigger>
                        </>
                      )}
                    </TabsList>

                    {/* Pestaña de Clases */}
                    <TabsContent value="classes" className="mt-0">
                      <Card className="bg-blue-800/20 border-blue-700/30">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="text-white">Clases del grupo</CardTitle>
                              <CardDescription className="text-blue-200/70">
                                Aquí puedes ver las clases disponibles en este grupo
                              </CardDescription>
                            </div>
                            {selectedGroup?.is_admin && !newUserData.role?.toLowerCase().includes("estudiante") && (
                              <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => router.push(`/new-meeting?groupId=${selectedGroup.id}`)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Crear nueva clase
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {loadingMeetings ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                            </div>
                          ) : (
                            <div>
                              {meetings.length > 0 ? (
                                <div className="space-y-4">
                                  {meetings.map((meeting) => (
                                    <div
                                      key={meeting.id}
                                      className="p-4 rounded-lg bg-blue-800/30 border border-blue-700/30 hover:bg-blue-700/30 transition-colors"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h3 className="font-medium text-white text-lg">{meeting.title}</h3>
                                          <p className="text-blue-200 text-sm">
                                            {new Date(meeting.date).toLocaleDateString()} -{" "}
                                            {meeting.duration || "Sin duración"}
                                          </p>
                                          {meeting.summary && (
                                            <p className="text-blue-200/70 mt-2 line-clamp-2">{meeting.summary}</p>
                                          )}
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
                                          onClick={() => {
                                            setSelectedMeeting(meeting)
                                            setShowClassDetailModal(true)
                                          }}
                                        >
                                          Ver detalles
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <p className="text-blue-200">No hay clases disponibles en este momento.</p>
                                  {selectedGroup?.is_admin &&
                                    !newUserData.role?.toLowerCase().includes("estudiante") && (
                                      <Button
                                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                                        onClick={() => router.push(`/new-meeting?groupId=${selectedGroup.id}`)}
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Crear nueva clase
                                      </Button>
                                    )}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Pestaña de miembros (solo para administradores) */}
                    {selectedGroup.is_admin && (
                      <TabsContent value="members" className="mt-0">
                        <Card className="bg-blue-800/20 border-blue-700/30">
                          <CardHeader>
                            <CardTitle className="text-white">Miembros del grupo</CardTitle>
                            <CardDescription className="text-blue-200/70">
                              {members[selectedGroup.id]?.length || 0}{" "}
                              {members[selectedGroup.id]?.length === 1 ? "miembro" : "miembros"} en el grupo
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {members[selectedGroup.id]?.length > 0 ? (
                              <div className="space-y-4">
                                {members[selectedGroup.id].map((member) => (
                                  <div
                                    key={member.id}
                                    className="p-4 rounded-lg bg-blue-800/30 border border-blue-700/30 flex justify-between items-center"
                                  >
                                    <div>
                                      <div className="flex items-center">
                                        <span className="font-medium text-white">
                                          {member.full_name || member.username}
                                        </span>
                                        {member.is_admin && (
                                          <Badge className="ml-2 bg-blue-600 text-white border-none">Admin</Badge>
                                        )}
                                      </div>
                                      {member.full_name && (
                                        <div className="text-sm text-blue-200/70">@{member.username}</div>
                                      )}
                                    </div>

                                    {selectedGroup.is_admin && member.username !== username && (
                                      <div className="flex gap-2">
                                        {!member.is_admin && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
                                            onClick={() => {
                                              setSelectedMember(member)
                                              setShowPromoteDialog(true)
                                            }}
                                          >
                                            <UserCog className="h-4 w-4 mr-1" />
                                            Promover
                                          </Button>
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="border-red-500/50 text-red-400 hover:bg-red-900/20"
                                          onClick={() => {
                                            setSelectedMember(member)
                                            setShowRemoveMemberDialog(true)
                                          }}
                                        >
                                          <UserX className="h-4 w-4 mr-1" />
                                          Eliminar
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-blue-200">No hay miembros en el grupo</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}

                    {/* Pestaña de configuración (solo para administradores) */}
                    {selectedGroup.is_admin && (
                      <TabsContent value="settings" className="mt-0">
                        <Card className="bg-blue-800/20 border-blue-700/30">
                          <CardHeader>
                            <CardTitle className="text-white">Configuración del grupo</CardTitle>
                            <CardDescription className="text-blue-200/70">
                              Administra la configuración de tu grupo
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="group-name" className="text-blue-200 mb-2 block">
                                  Nombre del grupo
                                </Label>
                                <Input
                                  id="group-name"
                                  value={groupName}
                                  onChange={(e) => setGroupName(e.target.value)}
                                  className="bg-blue-700/40 border-blue-600/50 text-white"
                                />
                              </div>

                              <div>
                                <Label htmlFor="group-description" className="text-blue-200 mb-2 block">
                                  Descripción
                                </Label>
                                <Textarea
                                  id="group-description"
                                  value={groupDescription}
                                  onChange={(e) => setGroupDescription(e.target.value)}
                                  className="bg-blue-700/40 border-blue-600/50 text-white min-h-[100px]"
                                  placeholder="Describe el propósito de este grupo"
                                />
                              </div>

                              <div className="flex justify-end gap-3 pt-2">
                                <Button
                                  onClick={handleUpdateGroup}
                                  className="bg-blue-600 hover:bg-blue-700"
                                  disabled={
                                    submitting ||
                                    !groupName.trim() ||
                                    (groupName === selectedGroup.name &&
                                      groupDescription === (selectedGroup.description || ""))
                                  }
                                >
                                  {submitting ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Guardando...
                                    </>
                                  ) : (
                                    <>Guardar cambios</>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}
                  </Tabs>
                </>
              ) : (
                <Card className="bg-blue-800/20 border-blue-700/30 h-[400px] flex items-center justify-center">
                  <CardContent className="text-center">
                    <div className="mb-4">
                      {groups.length > 0 ? (
                        <Users className="h-12 w-12 text-blue-400/70 mx-auto" />
                      ) : (
                        <PlusCircle className="h-12 w-12 text-blue-400/70 mx-auto" />
                      )}
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      {groups.length > 0 ? "Selecciona un grupo de la lista" : "No perteneces a ningún grupo todavía"}
                    </h3>
                    <p className="text-blue-200/70 max-w-md mb-6">
                      {groups.length > 0
                        ? "Selecciona un grupo de la lista para ver sus detalles y miembros."
                        : "Crea un nuevo grupo o únete a uno existente con un código de invitación."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {!newUserData.role?.toLowerCase().includes("estudiante") &&
                      !newUserData.role?.toLowerCase().includes("student") ? (
                        <>
                          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateDialog(true)}>
                            <PlusCircle className="h-5 w-5 mr-2" />
                            Crear nuevo grupo
                          </Button>
                          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowJoinDialog(true)}>
                            <UserPlus className="h-5 w-5 mr-2" />
                            Unirse con código
                          </Button>
                        </>
                      ) : (
                        <div className="text-center p-4 bg-blue-800/30 rounded-lg border border-blue-700/30 max-w-md">
                          <p className="text-blue-200 mb-4">
                            Como estudiante, no puedes crear grupos. Contacta a tu profesor para obtener un código de
                            invitación.
                          </p>
                          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowJoinDialog(true)}>
                            <UserPlus className="h-5 w-5 mr-2" />
                            Unirse con código
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Diálogo para crear usuario */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>Crear nuevo usuario</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              Crea un nuevo usuario en la base de datos para poder crear o unirte a grupos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                placeholder="Ingresa un nombre de usuario"
                value={newUserData.username || username || ""}
                onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                className="bg-blue-700/40 border-blue-600/50 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                placeholder="Ingresa tu nombre completo"
                value={newUserData.full_name}
                onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                className="bg-blue-700/40 border-blue-600/50 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Equipo</Label>
              <Input
                id="team"
                placeholder="Ingresa tu equipo (opcional)"
                value={newUserData.team}
                onChange={(e) => setNewUserData({ ...newUserData, team: e.target.value })}
                className="bg-blue-700/40 border-blue-600/50 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Input
                id="role"
                placeholder="Ingresa tu rol (opcional)"
                value={newUserData.role}
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                className="bg-blue-700/40 border-blue-600/50 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateUserDialog(false)}
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting || !newUserData.username.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>Crear usuario</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para crear grupo */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>Crear nuevo grupo</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              Crea un nuevo grupo y conviértete en su administrador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nombre del grupo</Label>
              <Input
                id="group-name"
                placeholder="Ingresa un nombre para tu grupo"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="bg-blue-700/40 border-blue-600/50 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Descripción (opcional)</Label>
              <Textarea
                id="group-description"
                placeholder="Describe el propósito de este grupo"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                className="bg-blue-700/40 border-blue-600/50 text-white min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateGroup}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting || !newGroupName.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>Crear grupo</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para unirse a grupo */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>Unirse a un grupo</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              Ingresa el código de invitación para unirte a un grupo existente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="join-code">Código de invitación</Label>
              <Input
                id="join-code"
                placeholder="Ingresa el código de invitación"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="bg-blue-700/40 border-blue-600/50 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowJoinDialog(false)}
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleJoinGroup}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting || !joinCode.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uniéndose...
                </>
              ) : (
                <>Unirse</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para abandonar grupo */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>{selectedGroup?.is_admin ? "Eliminar grupo" : "Abandonar grupo"}</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              {selectedGroup?.is_admin
                ? "Esta acción eliminará permanentemente el grupo y todos sus miembros serán desvinculados"
                : "Esta acción te desvinculará del grupo"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Advertencia</AlertTitle>
              <AlertDescription>
                {selectedGroup?.is_admin
                  ? "Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al grupo."
                  : "Esta acción no se puede deshacer. ¿Estás seguro de que deseas abandonar el grupo?"}
              </AlertDescription>
            </Alert>

            {selectedGroup?.is_admin && (
              <div className="mt-4 text-white">
                <p className="mb-2">Consecuencias de eliminar el grupo:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Todos los miembros serán desvinculados del grupo</li>
                  <li>El código de invitación dejará de funcionar</li>
                  <li>Toda la información del grupo se perderá permanentemente</li>
                </ul>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowLeaveDialog(false)}
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleLeaveGroup} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {selectedGroup?.is_admin ? "Eliminando..." : "Abandonando..."}
                </>
              ) : (
                <>{selectedGroup?.is_admin ? "Eliminar grupo" : "Abandonar grupo"}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para eliminar miembro */}
      <Dialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>Eliminar miembro</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              Esta acción eliminará al miembro del grupo
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedMember && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Advertencia</AlertTitle>
                <AlertDescription>
                  ¿Estás seguro de que deseas eliminar a {selectedMember.full_name || selectedMember.username} del
                  grupo?
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveMemberDialog(false)
                setSelectedMember(null)
              }}
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>Eliminar miembro</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para promover miembro */}
      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>Promover a administrador</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              Esta acción convertirá al miembro en administrador del grupo
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedMember && (
              <Alert className="bg-blue-900/50 border-blue-700 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Confirmación</AlertTitle>
                <AlertDescription>
                  ¿Estás seguro de que deseas promover a {selectedMember.full_name || selectedMember.username} como
                  administrador? Los administradores pueden gestionar miembros y configurar el grupo.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowPromoteDialog(false)
                setSelectedMember(null)
              }}
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              Cancelar
            </Button>
            <Button onClick={handlePromoteMember} className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Promoviendo...
                </>
              ) : (
                <>Promover a administrador</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalles de clase */}
      <AnimatePresence>
        {showClassDetailModal && selectedMeeting && (
          <ClassDetailModal meeting={selectedMeeting} onClose={() => setShowClassDetailModal(false)} />
        )}
      </AnimatePresence>

      <NewNavbar />
    </div>
  )
}

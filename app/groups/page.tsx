"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NewNavbar } from "@/components/new-navbar"
import {
  Users,
  UserPlus,
  Settings,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserCog,
  UserX,
  Info,
  Plus,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

// Tipos
interface Group {
  id: string
  name: string
  description?: string
  join_code: string
  created_at: string
  created_by: string
  role: string
  memberCount?: number
}

interface GroupMember {
  id: string
  role: string
  joined_at: string
  user_id: string
  profiles: {
    id: string
    full_name: string
    username: string
    email: string
    avatar_url?: string
  }
}

export default function GroupsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [activeTab, setActiveTab] = useState("classes")
  const [session, setSession] = useState<any>(null)
  const supabase = createClientComponentClient()
  const [userRole, setUserRole] = useState<string | null>(null)

  // Estados para diálogos
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false)
  const [showPromoteDialog, setShowPromoteDialog] = useState(false)

  // Estados para formularios
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [joinCodeValue, setJoinCodeValue] = useState("")
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  // Estados para UI
  const [codeCopied, setCodeCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Verificar sesión al cargar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error al obtener sesión:", error)
          router.push("/login")
          return
        }

        if (!data.session) {
          console.log("No hay sesión activa, redirigiendo a login")
          router.push("/login")
          return
        }

        setSession(data.session)

        // Cargar grupos si hay sesión
        await fetchGroups()
      } catch (error) {
        console.error("Error al verificar la sesión:", error)
        setError("Error al verificar la sesión")
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  // Cargar miembros cuando se selecciona un grupo
  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers(selectedGroup.id)
      setEditName(selectedGroup.name)
      setEditDescription(selectedGroup.description || "")
    }
  }, [selectedGroup])

  // Obtener grupos del usuario
  const fetchGroups = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/groups/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para incluir cookies
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.log("No autorizado, redirigiendo a login")
          router.push("/login")
          return
        }
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      setGroups(data.groups || [])

      // Si hay grupos, seleccionar el primero por defecto
      if (data.groups && data.groups.length > 0) {
        setSelectedGroup(data.groups[0])
      }

      // Obtener información del usuario
      const userResponse = await fetch("/api/users/me")
      const userData = await userResponse.json()

      // Verificar si el usuario tiene una organización y un rol
      if (userData?.organization?.role) {
        setUserRole(userData.organization.role)
      }
    } catch (err: any) {
      console.error("Error al obtener grupos:", err)
      setError(err.message || "Error al cargar los grupos")
    } finally {
      setLoading(false)
    }
  }

  // Obtener miembros de un grupo
  const fetchGroupMembers = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para incluir cookies
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      setGroupMembers(data || [])
    } catch (err: any) {
      console.error("Error al obtener miembros:", err)
      setError(err.message || "Error al cargar los miembros del grupo")
    }
  }

  // Crear un nuevo grupo
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError("Por favor, ingresa un nombre para el grupo")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para incluir cookies
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al crear el grupo")
      }

      // Actualizar la lista de grupos
      await fetchGroups()
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
    if (!joinCodeValue.trim()) {
      setError("Por favor, ingresa un código de invitación")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Verificar el código
      const verifyResponse = await fetch("/api/groups/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para incluir cookies
        body: JSON.stringify({
          code: joinCodeValue.trim(),
        }),
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json()
        throw new Error(errorData.error || "Código de invitación inválido")
      }

      const groupData = await verifyResponse.json()

      // Unirse al grupo
      const joinResponse = await fetch(`/api/groups/${groupData.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para incluir cookies
        body: JSON.stringify({}),
      })

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json()
        throw new Error(errorData.error || "Error al unirse al grupo")
      }

      // Actualizar la lista de grupos
      await fetchGroups()
      setShowJoinDialog(false)
      setJoinCodeValue("")
    } catch (err: any) {
      console.error("Error al unirse al grupo:", err)
      setError(err.message || "Error al unirse al grupo")
    } finally {
      setSubmitting(false)
    }
  }

  // Abandonar un grupo
  const handleLeaveGroup = async () => {
    if (!selectedGroup) return

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/groups/${selectedGroup.id}/members/me`, {
        method: "DELETE",
        credentials: "include", // Importante para incluir cookies
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al abandonar el grupo")
      }

      // Actualizar la lista de grupos
      await fetchGroups()
      setSelectedGroup(null)
      setShowLeaveDialog(false)
    } catch (err: any) {
      console.error("Error al abandonar grupo:", err)
      setError(err.message || "Error al abandonar el grupo")
    } finally {
      setSubmitting(false)
    }
  }

  // Eliminar un grupo
  const handleDeleteGroup = async () => {
    if (!selectedGroup) return

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: "DELETE",
        credentials: "include", // Importante para incluir cookies
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar el grupo")
      }

      // Actualizar la lista de grupos
      await fetchGroups()
      setSelectedGroup(null)
      setShowDeleteDialog(false)
    } catch (err: any) {
      console.error("Error al eliminar grupo:", err)
      setError(err.message || "Error al eliminar el grupo")
    } finally {
      setSubmitting(false)
    }
  }

  // Eliminar un miembro del grupo
  const handleRemoveMember = async () => {
    if (!selectedGroup || !selectedMember) return

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/groups/${selectedGroup.id}/members/${selectedMember.user_id}`, {
        method: "DELETE",
        credentials: "include", // Importante para incluir cookies
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar al miembro")
      }

      // Actualizar la lista de miembros
      await fetchGroupMembers(selectedGroup.id)
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
    if (!selectedGroup || !selectedMember) return

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/groups/${selectedGroup.id}/members/${selectedMember.user_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para incluir cookies
        body: JSON.stringify({
          role: "admin",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al promover al miembro")
      }

      // Actualizar la lista de miembros
      await fetchGroupMembers(selectedGroup.id)
      setShowPromoteDialog(false)
      setSelectedMember(null)
    } catch (err: any) {
      console.error("Error al promover miembro:", err)
      setError(err.message || "Error al promover al miembro")
    } finally {
      setSubmitting(false)
    }
  }

  // Actualizar información del grupo
  const handleUpdateGroup = async () => {
    if (!selectedGroup) return
    if (!editName.trim()) {
      setError("El nombre del grupo no puede estar vacío")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para incluir cookies
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar el grupo")
      }

      // Actualizar la lista de grupos
      await fetchGroups()
      setIsEditing(false)
    } catch (err: any) {
      console.error("Error al actualizar grupo:", err)
      setError(err.message || "Error al actualizar el grupo")
    } finally {
      setSubmitting(false)
    }
  }

  // Copiar código de invitación
  const handleCopyCode = () => {
    if (selectedGroup) {
      navigator.clipboard.writeText(selectedGroup.join_code)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  // Verificar si el usuario es profesor (no es estudiante)
  const isTeacher = userRole && !userRole.toLowerCase().includes("student")

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

  // Si no hay sesión, no renderizar nada (la redirección ya se habrá activado)
  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-4 glow-text">Mis Grupos</h1>

            {/* Mostrar botones de acción solo para profesores */}
            <div className="flex space-x-4">
              {isTeacher && (
                <Link
                  href="/groups/create"
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle size={18} />
                  <span>Crear Grupo</span>
                </Link>
              )}
              <Link
                href="/groups/join"
                className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Users size={18} />
                <span>Unirse con código</span>
              </Link>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar con lista de grupos */}
            <div className="md:col-span-1">
              <Card className="bg-blue-800/20 border-blue-700/30 mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg">Mis Grupos</CardTitle>
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
                          onClick={() => setSelectedGroup(group)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          <span className="truncate">{group.name}</span>
                          {group.role === "admin" && (
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
              </Card>

              <div className="space-y-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear nuevo grupo
                </Button>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setShowJoinDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Unirse con código
                </Button>
              </div>
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
                            {selectedGroup.role === "admin"
                              ? "Eres administrador de este grupo"
                              : "Eres miembro de este grupo"}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {selectedGroup.role === "admin" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                              onClick={() => setShowDeleteDialog(true)}
                            >
                              Eliminar grupo
                            </Button>
                          ) : (
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

                        <div>
                          <Label className="text-blue-200 mb-1 block">Código de invitación</Label>
                          <div className="flex">
                            <Input
                              value={selectedGroup.join_code}
                              readOnly
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
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pestañas */}
                  <Tabs defaultValue="classes" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList
                      className={`grid w-full ${selectedGroup.role === "admin" ? "grid-cols-3" : "grid-cols-1"} mb-6 bg-blue-800/30`}
                    >
                      <TabsTrigger value="classes" className="data-[state=active]:bg-blue-600">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Clases
                      </TabsTrigger>

                      {selectedGroup.role === "admin" && (
                        <>
                          <TabsTrigger value="members" className="data-[state=active]:bg-blue-600">
                            <Users className="h-5 w-5 mr-2" />
                            Miembros
                          </TabsTrigger>

                          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
                            <Settings className="h-5 w-5 mr-2" />
                            Configuración
                          </TabsTrigger>
                        </>
                      )}
                    </TabsList>

                    {/* Pestaña de Clases */}
                    <TabsContent value="classes" className="mt-0">
                      <Card className="bg-blue-800/20 border-blue-700/30">
                        <CardHeader>
                          <CardTitle className="text-white">Clases del grupo</CardTitle>
                          <CardDescription className="text-blue-200/70">
                            Aquí puedes ver las clases disponibles en este grupo
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8">
                            <p className="text-blue-200">No hay clases disponibles en este momento.</p>
                            {selectedGroup.role === "admin" && (
                              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear nueva clase
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Pestaña de miembros (solo para administradores) */}
                    {selectedGroup.role === "admin" && (
                      <TabsContent value="members" className="mt-0">
                        <Card className="bg-blue-800/20 border-blue-700/30">
                          <CardHeader>
                            <CardTitle className="text-white">Miembros del grupo</CardTitle>
                            <CardDescription className="text-blue-200/70">
                              {groupMembers.length} {groupMembers.length === 1 ? "miembro" : "miembros"} en el grupo
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {groupMembers.length > 0 ? (
                              <div className="space-y-4">
                                {groupMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="p-4 rounded-lg bg-blue-800/30 border border-blue-700/30 flex justify-between items-center"
                                  >
                                    <div className="flex items-center">
                                      <Avatar className="h-10 w-10 mr-3">
                                        <AvatarImage src={member.profiles.avatar_url || ""} />
                                        <AvatarFallback className="bg-blue-700 text-white">
                                          {member.profiles.full_name?.charAt(0) ||
                                            member.profiles.username?.charAt(0) ||
                                            "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="flex items-center">
                                          <span className="font-medium text-white">{member.profiles.full_name}</span>
                                          {member.role === "admin" && (
                                            <Badge className="ml-2 bg-blue-600 text-white border-none">Admin</Badge>
                                          )}
                                        </div>
                                        <div className="text-sm text-blue-200/70">@{member.profiles.username}</div>
                                        <div className="text-xs text-blue-300/50">{member.profiles.email}</div>
                                      </div>
                                    </div>

                                    {selectedGroup.role === "admin" && member.role !== "admin" && (
                                      <div className="flex gap-2">
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
                                <p className="text-blue-200">Cargando miembros...</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}

                    {/* Pestaña de configuración (solo para administradores) */}
                    {selectedGroup.role === "admin" && (
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
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="bg-blue-700/40 border-blue-600/50 text-white"
                                  disabled={!isEditing}
                                />
                              </div>

                              <div>
                                <Label htmlFor="group-description" className="text-blue-200 mb-2 block">
                                  Descripción
                                </Label>
                                <Textarea
                                  id="group-description"
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  className="bg-blue-700/40 border-blue-600/50 text-white min-h-[100px]"
                                  placeholder="Describe el propósito de este grupo"
                                  disabled={!isEditing}
                                />
                              </div>

                              <div className="flex justify-end gap-3 pt-2">
                                {isEditing ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setIsEditing(false)
                                        setEditName(selectedGroup.name)
                                        setEditDescription(selectedGroup.description || "")
                                      }}
                                      className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      onClick={handleUpdateGroup}
                                      className="bg-blue-600 hover:bg-blue-700"
                                      disabled={submitting}
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
                                  </>
                                ) : (
                                  <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                                    Editar información
                                  </Button>
                                )}
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
                    <Info className="h-12 w-12 text-blue-400/70 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Selecciona un grupo</h3>
                    <p className="text-blue-200/70 max-w-md">
                      Selecciona un grupo de la lista o crea uno nuevo para comenzar a colaborar con otros usuarios.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Diálogos (sin cambios) */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          {/* Contenido del diálogo sin cambios */}
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
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resto de diálogos sin cambios */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          {/* Contenido sin cambios */}
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
                value={joinCodeValue}
                onChange={(e) => setJoinCodeValue(e.target.value)}
                className="bg-blue-700/40 border-blue-600/50 text-white"
              />
            </div>
          </div>
          <DialogFooter>
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
              disabled={submitting || !joinCodeValue.trim()}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resto de diálogos sin cambios */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        {/* Contenido sin cambios */}
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>Abandonar grupo</DialogTitle>
            <DialogDescription className="text-blue-200/70">Esta acción te desvinculará del grupo</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Advertencia</AlertTitle>
              <AlertDescription>
                Esta acción no se puede deshacer. ¿Estás seguro de que deseas abandonar el grupo?
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
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
                  Procesando...
                </>
              ) : (
                <>Abandonar grupo</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resto de diálogos sin cambios */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        {/* Contenido sin cambios */}
        <DialogContent className="bg-blue-800/90 border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle>Eliminar grupo</DialogTitle>
            <DialogDescription className="text-blue-200/70">
              Esta acción eliminará el grupo y todos sus miembros serán desvinculados
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive" className="bg-red-900/50 border-red-700 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Advertencia</AlertTitle>
              <AlertDescription>
                Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar el grupo?
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-blue-600/50 text-blue-300 hover:bg-blue-800/50"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>Eliminar grupo</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resto de diálogos sin cambios */}
      <Dialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
        {/* Contenido sin cambios */}
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
                  ¿Estás seguro de que deseas eliminar a {selectedMember.profiles.full_name} del grupo?
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resto de diálogos sin cambios */}
      <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        {/* Contenido sin cambios */}
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
                <Info className="h-4 w-4" />
                <AlertTitle>Confirmación</AlertTitle>
                <AlertDescription>
                  ¿Estás seguro de que deseas promover a {selectedMember.profiles.full_name} como administrador? Los
                  administradores pueden gestionar miembros y configurar el grupo.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewNavbar />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, FileText, Search, Users, Plus, Loader } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { getUsername } from "@/utils/user-helpers"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ClassDetailModal } from "@/components/class-detail-modal"
import { AnimatePresence } from "framer-motion"

export default function ClassList({ groupId }) {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [showClassDetailModal, setShowClassDetailModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener el nombre de usuario
        const username = getUsername()
        if (!username) {
          throw new Error("No se pudo obtener el nombre de usuario")
        }

        // Obtener las clases del grupo
        const response = await fetch(`/api/organization/classes?groupId=${groupId}`, {
          headers: {
            "X-Username": username,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Error al obtener las clases")
        }

        const data = await response.json()
        setClasses(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error al cargar las clases:", err)
        setError(err.message || "Error al cargar las clases")
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      fetchClasses()
    }
  }, [groupId])

  const handleCreateClass = () => {
    router.push(`/new-meeting?groupId=${groupId}`)
  }

  const handleViewClass = (meeting) => {
    setSelectedMeeting(meeting)
    setShowClassDetailModal(true)
  }

  // Filtrar clases por término de búsqueda
  const filteredClasses = classes.filter(
    (cls) =>
      cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.summary && cls.summary.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar clases..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleCreateClass} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Clase
        </Button>
      </div>

      {filteredClasses.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay clases</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? "No se encontraron clases que coincidan con tu búsqueda."
              : "Aún no hay clases en este grupo."}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateClass}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primera clase
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-4 cursor-pointer" onClick={() => handleViewClass(cls)}>
                  <h3 className="text-lg font-medium mb-2">{cls.title}</h3>
                  {cls.summary && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{cls.summary}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {format(new Date(cls.date), "dd MMM yyyy", { locale: es })}
                    </div>
                    {cls.duration && (
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {cls.duration}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      {cls.participants || 0} participantes
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      {cls.transcriptions?.count || 0} segmentos
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Modal de detalles de clase */}
      <AnimatePresence>
        {showClassDetailModal && selectedMeeting && (
          <ClassDetailModal meeting={selectedMeeting} onClose={() => setShowClassDetailModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

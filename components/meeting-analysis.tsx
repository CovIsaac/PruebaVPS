"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Save, Search, AlertCircle, BookOpen } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useMobile } from "@/hooks/use-mobile"
import { Loader } from "lucide-react"

// Componente para el análisis de la reunión (versión mejorada)
const MeetingAnalysis = ({ analysis, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState("summary")
  const [meetingTitle, setMeetingTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const isMobile = useMobile()

  // Verificar que el análisis tenga la estructura esperada
  const hasValidSummary = analysis && typeof analysis.summary === "string" && analysis.summary.trim() !== ""
  const hasValidKeyPoints = analysis && Array.isArray(analysis.keyPoints) && analysis.keyPoints.length > 0
  const hasValidTasks = false // Desactivamos la funcionalidad de tareas
  const analysisResults = analysis || {}

  const noContentMessage = (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="rounded-full bg-upslp-800/40 p-2 sm:p-3 mb-3 sm:mb-4">
        <Search className="h-4 w-4 sm:h-6 sm:w-6 text-upslp-300" />
      </div>
      <h3 className="text-base sm:text-lg font-medium text-white mb-1">Sin contenido</h3>
      <p className="text-xs sm:text-sm text-upslp-300/70">No hay información disponible en este momento.</p>
    </div>
  )

  // Formatear el resumen para mejor legibilidad
  const formatSummary = (summary) => {
    if (!summary) return ""

    // Verificar si el resumen parece genérico o no relacionado
    if (
      summary.includes("No hay suficiente información") ||
      summary.includes("La transcripción no proporciona") ||
      summary.includes("No se puede determinar")
    ) {
      return (
        <div className="p-3 bg-amber-900/30 border border-amber-800/50 rounded-lg mb-4">
          <p className="text-amber-300 text-sm">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            El sistema no pudo generar un análisis detallado debido a que la transcripción es muy corta o no contiene
            suficiente información contextual. A continuación se muestra el mejor resumen posible basado en el contenido
            disponible.
          </p>
        </div>
      )
    }

    // Dividir el resumen en párrafos
    return summary.split("\n\n").map((paragraph, index) => (
      <p key={index} className="mb-4 text-sm sm:text-base text-upslp-100">
        {paragraph}
      </p>
    ))
  }

  // Verificar si un punto clave es específico o vago
  const isVagueKeyPoint = (point) => {
    const vaguePatterns = [
      "se discutió",
      "se habló",
      "se mencionó",
      "varios conceptos",
      "diversos temas",
      "diferentes aspectos",
      "no hay suficiente",
      "no se puede determinar",
      "la transcripción no proporciona",
    ]

    return vaguePatterns.some((pattern) => point.toLowerCase().includes(pattern))
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-upslp-800/30 w-full">
          <TabsTrigger value="summary" className="data-[state=active]:bg-upslp-600 text-white text-xs sm:text-sm">
            Resumen
          </TabsTrigger>
          <TabsTrigger value="key-points" className="data-[state=active]:bg-upslp-600 text-white text-xs sm:text-sm">
            Puntos Clave
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="summary" className="m-0">
            <div className="bg-upslp-800/20 p-3 sm:p-4 rounded-lg max-h-[400px] overflow-y-auto">
              {hasValidSummary ? formatSummary(analysis.summary) : noContentMessage}
            </div>
          </TabsContent>

          <TabsContent value="key-points" className="m-0">
            <div className="bg-upslp-800/20 p-3 sm:p-4 rounded-lg max-h-[400px] overflow-y-auto">
              {hasValidKeyPoints ? (
                <>
                  {analysisResults.keyPoints.some(isVagueKeyPoint) && (
                    <div className="p-3 bg-amber-900/30 border border-amber-800/50 rounded-lg mb-4">
                      <p className="text-amber-300 text-sm">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        Algunos puntos clave podrían ser generales debido a la limitada información específica en la
                        transcripción.
                      </p>
                    </div>
                  )}
                  <div className="mb-3 flex items-center">
                    <BookOpen className="h-4 w-4 text-upslp-300 mr-2" />
                    <h3 className="text-sm font-medium text-upslp-200">Conceptos y definiciones clave:</h3>
                  </div>
                  <ul className="space-y-3">
                    {analysis.keyPoints.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start bg-upslp-800/10 p-2 rounded-lg border border-upslp-700/20"
                      >
                        <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs flex-shrink-0 mr-2 sm:mr-3 mt-0.5">
                          {index + 1}
                        </div>
                        <span
                          className={`text-sm sm:text-base ${isVagueKeyPoint(point) ? "text-upslp-300/70" : "text-upslp-100"}`}
                        >
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                noContentMessage
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="pt-4 border-t border-upslp-700/30">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-upslp-200">Título de la reunión</label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="Ingresa un título para esta reunión"
              className="w-full bg-upslp-700/40 border border-upslp-600/50 text-white rounded-lg p-2 sm:p-2.5 text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center text-upslp-200/70 text-xs sm:text-sm gap-2 sm:gap-0">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="mr-2 sm:mr-3">{format(new Date(), "dd MMM yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span>{format(new Date(), "HH:mm", { locale: es })}</span>
            </div>
          </div>

          <div className={`flex ${isMobile ? "flex-col" : "justify-end"} gap-3`}>
            <Button
              variant="outline"
              className={`border-upslp-600/50 text-upslp-300 hover:bg-upslp-800/30 ${isMobile ? "w-full" : ""}`}
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              className={`bg-orange-500 hover:bg-orange-600 text-white ${isMobile ? "w-full" : ""}`}
              onClick={() => onSave({ title: meetingTitle || "Reunión sin título" })}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MeetingAnalysis

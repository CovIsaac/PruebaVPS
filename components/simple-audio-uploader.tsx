"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, AlertCircle, Lock } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

interface SimpleAudioUploaderProps {
  onFileSelected: (audioData: any) => void
  disabled: boolean
}

export function SimpleAudioUploader({ onFileSelected, disabled }: SimpleAudioUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMobile = useMobile()

  const validateAudioFile = (file: File) => {
    // Verificar el tipo de archivo
    const validTypes = [
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "audio/m4a",
      "audio/x-m4a",
      "audio/flac",
      "audio/ogg",
    ]

    // Aceptar cualquier tipo de audio si no podemos determinar el tipo específico
    if (!file.type.startsWith("audio/") && !validTypes.includes(file.type)) {
      setError("Formato de archivo no soportado. Por favor, sube un archivo de audio.")
      return false
    }

    // Verificar el tamaño (máximo 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB en bytes
    if (file.size > maxSize) {
      setError("El archivo es demasiado grande. El tamaño máximo permitido es 100MB.")
      return false
    }

    setError(null)
    return true
  }

  const processLocalFile = (file: File) => {
    // Crear un objeto URL para el archivo
    const audioUrl = URL.createObjectURL(file)

    // Obtener la duración del audio
    const audio = new Audio(audioUrl)
    return new Promise<any>((resolve) => {
      audio.onloadedmetadata = () => {
        const duration = Math.round(audio.duration)

        resolve({
          id: `audio_${Date.now()}`,
          url: audioUrl,
          blob: file,
          duration: duration,
          name: file.name,
        })
      }
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return

    const file = e.target.files?.[0]
    if (file) {
      if (validateAudioFile(file)) {
        setSelectedFile(file)

        try {
          const audioData = await processLocalFile(file)
          onFileSelected(audioData)
        } catch (err) {
          console.error("Error al procesar el archivo:", err)
          setError(`Error al procesar el archivo: ${err instanceof Error ? err.message : "Error desconocido"}`)
        }
      }
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return

    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateAudioFile(file)) {
        setSelectedFile(file)

        try {
          const audioData = await processLocalFile(file)
          onFileSelected(audioData)
        } catch (err) {
          console.error("Error al procesar el archivo:", err)
          setError(`Error al procesar el archivo: ${err instanceof Error ? err.message : "Error desconocido"}`)
        }
      }
    }
  }

  const triggerFileInput = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="bg-blue-800/30 border border-blue-700/30 rounded-lg p-4 sm:p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center ${
          dragActive
            ? "border-blue-500 bg-blue-600/20"
            : disabled
              ? "border-gray-700/50 opacity-60"
              : "border-blue-700/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*"
          className="hidden"
          disabled={disabled}
        />

        <Upload
          className={`h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 ${disabled ? "text-gray-400" : "text-blue-400"}`}
        />

        <h3 className="text-base sm:text-lg font-medium text-white mb-2">
          {selectedFile ? selectedFile.name : "Arrastra y suelta tu archivo de audio aquí"}
        </h3>

        <p className="text-xs sm:text-sm text-blue-300/70 mb-3 sm:mb-4">
          {selectedFile
            ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
            : "O haz clic para seleccionar un archivo"}
        </p>

        <div className="text-xs text-blue-300/70 mb-3 sm:mb-4">Formatos soportados: MP3, WAV, M4A, FLAC, OGG</div>

        {error && (
          <Alert variant="destructive" className="mb-3 sm:mb-4 bg-red-900/50 border-red-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {disabled && (
          <Alert className="mb-3 sm:mb-4 bg-amber-900/50 border-amber-800 text-white">
            <Lock className="h-4 w-4" />
            <AlertTitle>Límite alcanzado</AlertTitle>
            <AlertDescription>
              Has alcanzado el límite de 5 transcripciones este mes. Vuelve el próximo mes para continuar.
            </AlertDescription>
          </Alert>
        )}

        <Button
          variant="outline"
          className={`${
            disabled
              ? "border-gray-600/50 text-gray-300 hover:bg-gray-800/30 cursor-not-allowed"
              : "border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
          } ${isMobile ? "w-full" : ""}`}
          onClick={triggerFileInput}
          disabled={disabled}
        >
          Seleccionar archivo
        </Button>
      </div>
    </div>
  )
}

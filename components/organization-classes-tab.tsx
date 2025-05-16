"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ClassList from "@/components/class-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader } from "lucide-react"

export default function OrganizationClassesTab({ groupId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!groupId) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Selecciona un grupo para ver sus clases</AlertDescription>
      </Alert>
    )
  }

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
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todas las clases</TabsTrigger>
          <TabsTrigger value="recent">Recientes</TabsTrigger>
          <TabsTrigger value="favorites">Favoritas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <ClassList groupId={groupId} />
        </TabsContent>

        <TabsContent value="recent" className="mt-0">
          <ClassList groupId={groupId} filter="recent" />
        </TabsContent>

        <TabsContent value="favorites" className="mt-0">
          <ClassList groupId={groupId} filter="favorites" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

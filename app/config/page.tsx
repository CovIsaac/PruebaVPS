"use client"

import { useState } from "react"
import { NewNavbar } from "@/components/new-navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Database, Key } from "lucide-react"
import { DatabaseSetup } from "@/components/database-setup"

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState("database")

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 glow-text">Configuración del Sistema</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-blue-800/30 w-full mb-8">
              <TabsTrigger value="database" className="data-[state=active]:bg-blue-600 text-white">
                <Database className="h-4 w-4 mr-2" />
                Base de Datos
              </TabsTrigger>
              <TabsTrigger value="api" className="data-[state=active]:bg-blue-600 text-white">
                <Key className="h-4 w-4 mr-2" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 text-white">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </TabsTrigger>
            </TabsList>

            <TabsContent value="database" className="mt-0">
              <DatabaseSetup />
            </TabsContent>

            <TabsContent value="api" className="mt-0">
              <Card className="bg-blue-800/30 border border-blue-700/30">
                <CardHeader>
                  <CardTitle className="text-white">API Keys</CardTitle>
                  <CardDescription className="text-blue-300">
                    Configura las claves de API para los servicios externos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-200">Las claves de API se configuran a través de variables de entorno.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <Card className="bg-blue-800/30 border border-blue-700/30">
                <CardHeader>
                  <CardTitle className="text-white">Configuración General</CardTitle>
                  <CardDescription className="text-blue-300">
                    Ajusta la configuración general de la aplicación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-200">Próximamente más opciones de configuración...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <NewNavbar />
    </div>
  )
}

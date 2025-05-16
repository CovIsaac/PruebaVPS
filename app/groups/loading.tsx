import { Loader2 } from "lucide-react"
import { NewNavbar } from "@/components/new-navbar"

export default function Loading() {
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

"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { getSupabaseClient } from "@/utils/supabase"

export function UsageIndicator() {
  const [usageData, setUsageData] = useState<{ used: number; limit: number; remaining: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsageData() {
      try {
        setLoading(true)

        // Check if user is authenticated
        const supabase = getSupabaseClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setUsageData({ used: 0, limit: 50, remaining: 50 })
          return
        }

        // Fetch usage data from API
        const response = await fetch("/api/user/usage")

        if (!response.ok) {
          throw new Error("Failed to fetch usage data")
        }

        const data = await response.json()
        setUsageData(data)
      } catch (err) {
        console.error("Error fetching usage data:", err)
        setError("Could not load usage data")
        // Set default values
        setUsageData({ used: 0, limit: 50, remaining: 50 })
      } finally {
        setLoading(false)
      }
    }

    fetchUsageData()
  }, [])

  if (loading) {
    return (
      <div className="p-4 bg-upslp-800/30 border border-upslp-700/30 rounded-lg animate-pulse">
        <div className="h-4 bg-upslp-700/50 rounded w-24 mb-2"></div>
        <div className="h-2 bg-upslp-700/50 rounded w-full"></div>
      </div>
    )
  }

  if (error || !usageData) {
    return null
  }

  const percentage = Math.round((usageData.used / usageData.limit) * 100)

  return (
    <div className="p-4 bg-upslp-800/30 border border-upslp-700/30 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-upslp-200">Uso Mensual de Análisis</span>
        <span className="text-sm font-medium text-upslp-100">
          {usageData.used}/{usageData.limit}
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-2 bg-upslp-700/30"
        indicatorClassName={percentage >= 80 ? "bg-red-500" : "bg-orange-500"}
      />
      <div className="mt-2 text-xs text-upslp-300">{usageData.remaining} análisis restantes este mes</div>
    </div>
  )
}

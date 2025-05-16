"use client"

import { useState, useEffect } from "react"

export function useDevice() {
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    // Establecer el ancho inicial
    setWindowWidth(window.innerWidth)

    // Actualizar el ancho cuando cambie el tamaño de la ventana
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Definir los breakpoints
  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024
  const isDesktop = windowWidth >= 1024

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
  }
}

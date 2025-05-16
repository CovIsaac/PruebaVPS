"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { WireframeSphere } from "./wireframe-sphere"
import { StarField } from "./star-field"
import { Button } from "@/components/ui/button"

export function ParallaxHero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  // Transform values for parallax elements
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 400])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 600])
  const textY = useTransform(scrollYProgress, [0, 1], [0, 100])
  const opacityHero = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  // Handle mouse movement for subtle parallax effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    const x = (clientX / innerWidth - 0.5) * 2
    const y = (clientY / innerHeight - 0.5) * 2
    setMousePosition({ x, y })
  }

  return (
    <section
      ref={heroRef}
      className="relative w-full h-screen overflow-hidden bg-upslp-900"
      onMouseMove={handleMouseMove}
    >
      {/* Star field background */}
      <StarField mousePosition={mousePosition} />

      {/* Parallax elements */}
      <motion.div
        className="absolute inset-0 z-10"
        style={{ opacity: opacityHero, y: y1 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
            style={{
              x: mousePosition.x * -20,
              y: mousePosition.y * -20,
            }}
          >
            <WireframeSphere />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="container relative z-20 mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
        <motion.div
          className="max-w-4xl"
          style={{ y: textY }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 glow-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Juntify Escolar UPSLP
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-upslp-100 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Transforma tus reuniones académicas en experiencias productivas con transcripción automática e inteligencia
            artificial
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105">
              Comenzar ahora
            </Button>
            <Button
              variant="outline"
              className="border-upslp-400 text-white hover:bg-upslp-800/50 px-8 py-6 rounded-full text-lg font-medium"
            >
              Conocer más
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient for smooth transition to next section */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-upslp-900 to-transparent"></div>
    </section>
  )
}

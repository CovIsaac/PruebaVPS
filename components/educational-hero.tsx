"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { StarField } from "./star-field"
import Link from "next/link"
import { ChevronRight, Mic, FileText, Brain } from "lucide-react"
import Image from "next/image"

export function EducationalHero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  // Transform values for parallax elements
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
      className="relative w-full min-h-screen overflow-hidden bg-upslp-900"
      onMouseMove={handleMouseMove}
    >
      {/* Star field background */}
      <StarField mousePosition={mousePosition} />

      {/* Content */}
      <div className="container relative z-20 mx-auto px-4 h-full flex flex-col justify-center items-center text-center py-24">
        <motion.div
          className="max-w-4xl"
          style={{ y: textY }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            className="mb-6 flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative w-48 h-48 md:w-64 md:h-64">
              <Image
                src="/juntify-logo.png"
                alt="Juntify Logo"
                width={250}
                height={250}
                className="object-contain"
                priority
              />
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 glow-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Juntify <span className="text-orange-500">Escolar</span>
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-upslp-100 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            La plataforma que transforma tus clases en conocimiento accesible con transcripción automática, análisis
            especializado e inteligencia artificial conversacional
          </motion.p>

          {/* Feature highlights */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="bg-upslp-800/50 backdrop-blur-sm p-4 rounded-xl border border-upslp-700">
              <Mic className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h3 className="text-white font-medium">Transcripción Automática</h3>
            </div>
            <div className="bg-upslp-800/50 backdrop-blur-sm p-4 rounded-xl border border-upslp-700">
              <FileText className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h3 className="text-white font-medium">Análisis Especializado</h3>
            </div>
            <div className="bg-upslp-800/50 backdrop-blur-sm p-4 rounded-xl border border-upslp-700">
              <Brain className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h3 className="text-white font-medium">IA Conversacional 24/7</h3>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/register">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105">
                Comenzar ahora
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                variant="outline"
                className="border-upslp-400 text-white hover:bg-upslp-800/50 px-8 py-6 rounded-full text-lg font-medium group"
              >
                <span>Cómo funciona</span>
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient for smooth transition to next section */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-upslp-800 to-transparent"></div>
    </section>
  )
}

"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { FileCheck, Clock, PenTool, BookOpen, BarChart, MessageSquare } from "lucide-react"

export function ForTeachersSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax elements
  const titleY = useTransform(scrollYProgress, [0, 0.5], [50, -30])
  const imageY = useTransform(scrollYProgress, [0, 0.8], [100, -50])

  const benefits = [
    {
      icon: <Clock className="h-6 w-6 text-orange-500" />,
      title: "Ahorra tiempo en documentación",
      description: "Reduce el tiempo dedicado a tomar notas y crear resúmenes de clase.",
    },
    {
      icon: <FileCheck className="h-6 w-6 text-orange-500" />,
      title: "Análisis de contenido",
      description: "Obtén insights sobre los temas más relevantes de tus clases.",
    },
    {
      icon: <PenTool className="h-6 w-6 text-orange-500" />,
      title: "Mejora continua",
      description: "Utiliza los datos de clases anteriores para perfeccionar tu metodología.",
    },
    {
      icon: <BookOpen className="h-6 w-6 text-orange-500" />,
      title: "Material didáctico automático",
      description: "Genera material de estudio basado en tus propias explicaciones.",
    },
    {
      icon: <BarChart className="h-6 w-6 text-orange-500" />,
      title: "Análisis de participación",
      description: "Visualiza estadísticas sobre la participación de cada estudiante.",
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-orange-500" />,
      title: "Asistente IA personalizado",
      description: "Tu contenido convertido en un asistente IA disponible 24/7 para tus alumnos.",
    },
  ]

  return (
    <section ref={sectionRef} className="relative w-full py-24 bg-upslp-700 overflow-hidden">
      <div className="container px-4 max-w-6xl mx-auto">
        <motion.div className="text-center mb-16" style={{ y: titleY }}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Para Docentes</h2>
          <p className="text-xl text-upslp-100 max-w-3xl mx-auto">
            Transforma tu forma de enseñar con herramientas de transcripción e IA diseñadas para el aula moderna
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-upslp-600/50 backdrop-blur-sm p-5 rounded-xl border border-upslp-500/50 hover:border-orange-500/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-upslp-500/50 p-2 rounded-lg">{benefit.icon}</div>
                    <h3 className="text-lg font-semibold text-white">{benefit.title}</h3>
                  </div>
                  <p className="text-sm text-upslp-100">{benefit.description}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            style={{ y: imageY }}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative"
          >
            <div className="relative z-10 bg-upslp-600/80 backdrop-blur-sm p-6 rounded-2xl border border-upslp-500/50 shadow-xl">
              <img
                src="/placeholder-qtg3u.png"
                alt="Profesor utilizando Juntify"
                className="w-full h-auto rounded-lg"
              />
              <div className="mt-6 space-y-4">
                <div className="bg-upslp-500/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Transcripción de clase</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <span className="text-orange-500 font-medium">Profesor:</span>
                      <p className="text-upslp-100 text-sm">
                        "Hoy vamos a analizar las principales causas de la Revolución Industrial..."
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-orange-500 font-medium">Alumno 1:</span>
                      <p className="text-upslp-100 text-sm">
                        "¿Podría explicar más sobre el impacto de las nuevas tecnologías?"
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-upslp-500/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Análisis de IA</h4>
                  <ul className="text-upslp-100 text-sm space-y-1 list-disc pl-5">
                    <li>Tema principal: Revolución Industrial y sus causas</li>
                    <li>Conceptos clave: innovación tecnológica, cambios sociales</li>
                    <li>Temas relacionados: Revolución Francesa, Industrialización</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-upslp-400/20 rounded-full blur-3xl"></div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-upslp-600 to-upslp-700"></div>
    </section>
  )
}

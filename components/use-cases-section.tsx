"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Presentation, Users, BookOpen, Brain } from "lucide-react"

export function UseCasesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax elements
  const titleY = useTransform(scrollYProgress, [0, 0.5], [50, -30])

  const useCases = [
    {
      icon: <Presentation className="h-12 w-12 text-orange-500" />,
      title: "Clases Magistrales",
      description:
        "Captura cada detalle de tus explicaciones para que los estudiantes puedan revisarlas después. Ideal para materias con conceptos complejos.",
      image: "/placeholder-bvqf7.png",
    },
    {
      icon: <Users className="h-12 w-12 text-orange-500" />,
      title: "Discusiones en Grupo",
      description:
        "Registra las aportaciones de cada estudiante en debates y discusiones grupales. Analiza la participación y los temas tratados.",
      image: "/placeholder-psxcb.png",
    },
    {
      icon: <BookOpen className="h-12 w-12 text-orange-500" />,
      title: "Asesorías Académicas",
      description:
        "Documenta las sesiones de asesoría para que los estudiantes puedan consultar las recomendaciones y respuestas a sus dudas específicas.",
      image: "/placeholder-72xk2.png",
    },
    {
      icon: <Brain className="h-12 w-12 text-orange-500" />,
      title: "Asistente IA Personalizado",
      description:
        "Convierte el contenido de tus clases en un asistente IA que responde preguntas de los estudiantes basándose en tus propias explicaciones.",
      image: "/placeholder-4vf1q.png",
    },
  ]

  return (
    <section ref={sectionRef} className="relative w-full py-24 bg-upslp-500 overflow-hidden">
      <div className="container px-4 max-w-6xl mx-auto">
        <motion.div className="text-center mb-16" style={{ y: titleY }}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Casos de Uso</h2>
          <p className="text-xl text-upslp-100 max-w-3xl mx-auto">
            Juntify Escolar se adapta a diferentes escenarios educativos
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-upslp-400/50 backdrop-blur-sm rounded-xl overflow-hidden border border-upslp-300/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-upslp-900/20"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={useCase.image || "/placeholder.svg"}
                  alt={useCase.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-upslp-500 to-transparent opacity-70"></div>
                <div className="absolute bottom-4 left-4 bg-upslp-500/80 backdrop-blur-sm p-2 rounded-full">
                  {useCase.icon}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-white mb-3">{useCase.title}</h3>
                <p className="text-upslp-100">{useCase.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-upslp-400 to-upslp-500"></div>
    </section>
  )
}

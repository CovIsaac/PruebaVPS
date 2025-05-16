"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Mic, FileText, Brain, ListChecks, Users } from "lucide-react"

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax elements
  const titleY = useTransform(scrollYProgress, [0, 0.5], [50, -30])

  const steps = [
    {
      icon: <Mic className="h-10 w-10 text-orange-500" />,
      title: "Graba tu clase o reunión",
      description:
        "Utiliza Juntify para grabar tus clases, asesorías o reuniones académicas directamente desde tu dispositivo.",
    },
    {
      icon: <FileText className="h-10 w-10 text-orange-500" />,
      title: "Obtén la transcripción automática",
      description:
        "Nuestro sistema convierte automáticamente el audio en texto con alta precisión, identificando a los participantes.",
    },
    {
      icon: <Brain className="h-10 w-10 text-orange-500" />,
      title: "Análisis con IA",
      description:
        "La inteligencia artificial analiza el contenido para extraer conceptos clave, tareas y compromisos mencionados.",
    },
    {
      icon: <ListChecks className="h-10 w-10 text-orange-500" />,
      title: "Organización automática",
      description:
        "Juntify organiza la información en resúmenes, listas de tareas y material de estudio fácil de consultar.",
    },
    {
      icon: <Users className="h-10 w-10 text-orange-500" />,
      title: "Comparte y colabora",
      description: "Comparte los resultados con estudiantes o colegas para mantener a todos sincronizados y enfocados.",
    },
  ]

  return (
    <section id="how-it-works" ref={sectionRef} className="relative w-full py-24 bg-upslp-800 overflow-hidden">
      <div className="container px-4 max-w-6xl mx-auto">
        <motion.div className="text-center mb-16" style={{ y: titleY }}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">¿Cómo funciona Juntify Escolar?</h2>
          <p className="text-xl text-upslp-100 max-w-3xl mx-auto">
            Una herramienta diseñada específicamente para el entorno académico
          </p>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500/0 via-orange-500 to-orange-500/0 hidden md:block"></div>

          {/* Steps */}
          <div className="space-y-12 md:space-y-0">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`flex flex-col ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } items-center gap-8 md:gap-16`}
              >
                <div
                  className={`w-full md:w-1/2 ${
                    index % 2 === 0 ? "md:text-right" : "md:text-left"
                  } flex flex-col items-center md:items-end ${index % 2 !== 0 && "md:items-start"}`}
                >
                  <div className="bg-upslp-700/50 backdrop-blur-sm p-6 rounded-xl border border-upslp-600 max-w-md">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-upslp-600 p-3 rounded-lg">{step.icon}</div>
                      <h3 className="text-2xl font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="text-upslp-100">{step.description}</p>
                  </div>
                </div>

                {/* Timeline node */}
                <div className="relative hidden md:block">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500 rounded-full border-4 border-upslp-700"></div>
                </div>

                <div className="w-full md:w-1/2"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-upslp-700 to-upslp-800"></div>
    </section>
  )
}

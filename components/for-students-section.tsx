"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { BookOpen, Search, Brain, Clock, Lightbulb, Share2 } from "lucide-react"

export function ForStudentsSection() {
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
      icon: <BookOpen className="h-6 w-6 text-orange-500" />,
      title: "Nunca pierdas una explicación",
      description: "Accede a transcripciones completas de todas tus clases.",
    },
    {
      icon: <Search className="h-6 w-6 text-orange-500" />,
      title: "Búsqueda inteligente",
      description: "Encuentra rápidamente conceptos específicos mencionados en clase.",
    },
    {
      icon: <Brain className="h-6 w-6 text-orange-500" />,
      title: "Tu profesor virtual 24/7",
      description: "Consulta dudas a cualquier hora con el asistente IA basado en tus clases.",
    },
    {
      icon: <Clock className="h-6 w-6 text-orange-500" />,
      title: "Optimiza tu tiempo de estudio",
      description: "Enfócate en los conceptos clave identificados por la IA.",
    },
    {
      icon: <Lightbulb className="h-6 w-6 text-orange-500" />,
      title: "Mejora tu comprensión",
      description: "Revisa explicaciones complejas tantas veces como necesites.",
    },
    {
      icon: <Share2 className="h-6 w-6 text-orange-500" />,
      title: "Colaboración entre compañeros",
      description: "Comparte transcripciones y análisis con tus compañeros de clase.",
    },
  ]

  return (
    <section ref={sectionRef} className="relative w-full py-24 bg-upslp-600 overflow-hidden">
      <div className="container px-4 max-w-6xl mx-auto">
        <motion.div className="text-center mb-16" style={{ y: titleY }}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Para Estudiantes</h2>
          <p className="text-xl text-upslp-100 max-w-3xl mx-auto">
            Potencia tu aprendizaje con acceso a transcripciones inteligentes y un asistente IA basado en tus clases
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            style={{ y: imageY }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative z-10 bg-upslp-500/80 backdrop-blur-sm p-6 rounded-2xl border border-upslp-400/50 shadow-xl">
              <img
                src="/placeholder-0hb05.png"
                alt="Estudiante utilizando Juntify"
                className="w-full h-auto rounded-lg"
              />
              <div className="mt-6 space-y-4">
                <div className="bg-upslp-400/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Chat con IA basado en tus clases</h4>
                  <div className="space-y-3">
                    <div className="bg-upslp-500/70 p-3 rounded-lg">
                      <p className="text-upslp-100 text-sm">
                        <span className="text-orange-400 font-medium">Tú:</span> ¿Puedes explicarme de nuevo el concepto
                        de polimorfismo que vimos en clase?
                      </p>
                    </div>
                    <div className="bg-upslp-500/70 p-3 rounded-lg">
                      <p className="text-upslp-100 text-sm">
                        <span className="text-blue-400 font-medium">Asistente IA:</span> Claro. En la clase del martes,
                        el profesor explicó que el polimorfismo es la capacidad de un objeto para tomar diferentes
                        formas. En programación orientada a objetos, esto significa que una clase puede implementar
                        métodos de diferentes maneras...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-upslp-400/20 rounded-full blur-3xl"></div>
          </motion.div>

          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-upslp-500/50 backdrop-blur-sm p-5 rounded-xl border border-upslp-400/50 hover:border-orange-500/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-upslp-400/50 p-2 rounded-lg">{benefit.icon}</div>
                    <h3 className="text-lg font-semibold text-white">{benefit.title}</h3>
                  </div>
                  <p className="text-sm text-upslp-100">{benefit.description}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-upslp-500 to-upslp-600"></div>
    </section>
  )
}

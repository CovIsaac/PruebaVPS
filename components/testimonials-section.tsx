"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Star } from "lucide-react"

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax elements
  const titleY = useTransform(scrollYProgress, [0, 0.5], [50, -30])

  const testimonials = [
    {
      quote:
        "Juntify ha transformado la forma en que imparto mis clases. Ahora puedo concentrarme en explicar bien los conceptos sin preocuparme por documentar todo.",
      author: "Dr. Alejandro Méndez",
      role: "Profesor de Ingeniería, UPSLP",
      avatar: "/placeholder.svg?height=100&width=100&query=profesor universitario hombre de 40 años",
      rating: 5,
    },
    {
      quote:
        "Como estudiante con dislexia, Juntify me ha ayudado enormemente. Poder revisar las transcripciones de clase ha mejorado mi comprensión y mis calificaciones.",
      author: "Mariana Gutiérrez",
      role: "Estudiante de Sistemas Computacionales",
      avatar: "/placeholder.svg?height=100&width=100&query=estudiante universitaria mujer joven",
      rating: 5,
    },
    {
      quote:
        "La función de búsqueda en las transcripciones es increíble. Puedo encontrar exactamente el momento en que el profesor explicó un concepto específico.",
      author: "Carlos Ramírez",
      role: "Estudiante de Administración",
      avatar: "/placeholder.svg?height=100&width=100&query=estudiante universitario hombre joven",
      rating: 4,
    },
  ]

  return (
    <section ref={sectionRef} className="relative w-full py-24 bg-upslp-400 overflow-hidden">
      <div className="container px-4 max-w-6xl mx-auto">
        <motion.div className="text-center mb-16" style={{ y: titleY }}>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Lo que dicen nuestros usuarios</h2>
          <p className="text-xl text-upslp-100 max-w-3xl mx-auto">
            Descubre cómo Juntify está mejorando la experiencia educativa en la UPSLP
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-upslp-300/50 backdrop-blur-sm p-6 rounded-xl border border-upslp-200/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-upslp-900/20"
            >
              <div className="flex items-center mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-orange-500 fill-orange-500" />
                ))}
                {Array.from({ length: 5 - testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-upslp-200" />
                ))}
              </div>
              <p className="text-upslp-900 mb-6 italic">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.author}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-white font-semibold">{testimonial.author}</h4>
                  <p className="text-upslp-100 text-sm">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-upslp-300 to-upslp-400"></div>
    </section>
  )
}

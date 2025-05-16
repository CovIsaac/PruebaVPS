"use client"

import { useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ChevronDown } from "lucide-react"

export function FaqSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax elements
  const titleY = useTransform(scrollYProgress, [0, 0.5], [50, -30])

  const faqs = [
    {
      question: "¿Cómo puedo empezar a usar Juntify Escolar?",
      answer:
        "Para comenzar, simplemente regístrate con tu correo institucional de la UPSLP. Una vez verificada tu cuenta, podrás acceder a todas las funcionalidades de Juntify Escolar desde cualquier dispositivo.",
    },
    {
      question: "¿Es necesario tener conexión a internet para usar Juntify?",
      answer:
        "Se requiere conexión a internet para la transcripción en tiempo real y para sincronizar los datos. Sin embargo, puedes acceder a transcripciones y notas previamente guardadas en modo offline.",
    },
    {
      question: "¿Cómo se protege la privacidad de las clases grabadas?",
      answer:
        "Juntify Escolar implementa cifrado de extremo a extremo para todas las grabaciones. Además, solo los participantes autorizados pueden acceder a las transcripciones y análisis de cada sesión.",
    },
    {
      question: "¿Puedo integrar Juntify con otras plataformas educativas?",
      answer:
        "Sí, Juntify Escolar se integra con las principales plataformas educativas como Microsoft Teams, Google Classroom y Canvas. También ofrecemos una API para integraciones personalizadas.",
    },
    {
      question: "¿Qué idiomas soporta la transcripción automática?",
      answer:
        "Actualmente, Juntify Escolar soporta transcripción automática en español, inglés, francés y portugués, con planes para añadir más idiomas en el futuro.",
    },
  ]

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section ref={sectionRef} className="relative w-full py-24 bg-upslp-300 overflow-hidden">
      <div className="container px-4 max-w-4xl mx-auto">
        <motion.div className="text-center mb-16" style={{ y: titleY }}>
          <h2 className="text-4xl md:text-5xl font-bold text-upslp-900 mb-6">Preguntas Frecuentes</h2>
          <p className="text-xl text-upslp-700 max-w-3xl mx-auto">Resolvemos tus dudas sobre Juntify Escolar</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden border border-upslp-200/50"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <h3 className="text-xl font-semibold text-upslp-900">{faq.question}</h3>
                <ChevronDown
                  className={`h-5 w-5 text-orange-500 transition-transform ${
                    openIndex === index ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? "max-h-96 pb-6" : "max-h-0"
                }`}
              >
                <p className="text-upslp-700">{faq.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-upslp-200 to-upslp-300"></div>
    </section>
  )
}

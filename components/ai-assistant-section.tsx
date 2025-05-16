"use client"

import { motion } from "framer-motion"
import { Brain, MessageSquare, Clock, Search, Lightbulb, Zap } from "lucide-react"
import Image from "next/image"

export function AIAssistantSection() {
  return (
    <section className="relative py-20 bg-upslp-800 overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-upslp-400 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-block mb-4"
          >
            <div className="bg-orange-500/10 p-3 rounded-full">
              <Brain className="h-8 w-8 text-orange-500" />
            </div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Tu Profesor Virtual <span className="text-orange-500">24/7</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-upslp-100 max-w-3xl mx-auto"
          >
            Consulta dudas a cualquier hora con un asistente de IA entrenado con las explicaciones reales de tus
            profesores
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Chat demo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-upslp-900/80 backdrop-blur-sm p-6 rounded-2xl border border-upslp-700 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-upslp-700">
              <div className="flex items-center">
                <div className="relative h-10 w-10 mr-3">
                  <Image src="/juntify-logo.png" alt="Juntify Logo" width={40} height={40} className="object-contain" />
                </div>
                <h3 className="font-medium text-white">Asistente IA de Juntify</h3>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-green-400 flex items-center">
                  <span className="h-2 w-2 bg-green-400 rounded-full mr-1"></span>
                  En línea
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div className="flex items-start">
                <div className="bg-upslp-700 rounded-lg p-3 max-w-[80%]">
                  <p className="text-white">¿Puedes explicarme cómo funciona el algoritmo de ordenamiento quicksort?</p>
                </div>
              </div>

              <div className="flex items-start justify-end">
                <div className="bg-orange-500/20 rounded-lg p-3 max-w-[80%]">
                  <p className="text-white">
                    Según lo explicado por el Prof. Martínez en la clase del 15 de marzo:
                    <br />
                    <br />
                    Quicksort es un algoritmo de ordenamiento que utiliza la estrategia "divide y vencerás". Funciona
                    seleccionando un elemento como pivote y particionando el array alrededor del pivote.
                    <br />
                    <br />
                    Los pasos básicos son:
                    <br />
                    1. Elegir un elemento como pivote
                    <br />
                    2. Colocar elementos menores a la izquierda y mayores a la derecha
                    <br />
                    3. Aplicar recursivamente a las sub-listas
                    <br />
                    <br />
                    ¿Te gustaría ver un ejemplo práctico como el que vimos en clase?
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Escribe tu pregunta..."
                className="w-full bg-upslp-800 border border-upslp-600 rounded-full py-3 px-4 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-500 hover:text-orange-400">
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-8">
              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-orange-500/10 p-2 rounded-full">
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white mb-2">Disponible 24/7</h3>
                  <p className="text-upslp-100">
                    Resuelve tus dudas a cualquier hora del día o noche, sin tener que esperar a la siguiente clase.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-orange-500/10 p-2 rounded-full">
                    <Search className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white mb-2">Basado en tus clases reales</h3>
                  <p className="text-upslp-100">
                    El asistente responde con las explicaciones y ejemplos que tus profesores utilizaron en clase.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-orange-500/10 p-2 rounded-full">
                    <Lightbulb className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white mb-2">Profundiza en los conceptos</h3>
                  <p className="text-upslp-100">
                    Explora temas relacionados y profundiza en conceptos específicos mencionados durante las clases.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 mr-4">
                  <div className="bg-orange-500/10 p-2 rounded-full">
                    <Zap className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white mb-2">Preparación para exámenes</h3>
                  <p className="text-upslp-100">
                    Repasa conceptos clave y prepárate para tus evaluaciones con un asistente que conoce exactamente lo
                    que se enseñó en clase.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

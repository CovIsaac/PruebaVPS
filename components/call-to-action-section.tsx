"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CallToActionSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })

  // Transform values for parallax elements
  const titleY = useTransform(scrollYProgress, [0, 0.5], [50, -30])

  return (
    <section ref={sectionRef} className="relative w-full py-24 bg-upslp-200 overflow-hidden">
      <div className="container px-4 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-upslp-800 to-upslp-900 rounded-3xl overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-upslp-400/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 p-12 md:p-16 flex flex-col items-center text-center">
            <motion.div style={{ y: titleY }}>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-3xl md:text-5xl font-bold text-white mb-6"
              >
                Transforma tu experiencia educativa con <span className="text-orange-500">Juntify Escolar</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-xl text-upslp-100 max-w-3xl mx-auto mb-10"
              >
                Únete a la comunidad de la UPSLP que ya está aprovechando el poder de la IA para mejorar sus clases y
                optimizar su aprendizaje
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link href="/register">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105">
                    Comenzar ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    className="border-upslp-400 text-white hover:bg-upslp-800/50 px-8 py-6 rounded-full text-lg font-medium"
                  >
                    Contactar soporte
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

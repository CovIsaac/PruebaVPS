import { EducationalHero } from "@/components/educational-hero"
import { ForTeachersSection } from "@/components/for-teachers-section"
import { ForStudentsSection } from "@/components/for-students-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { UseCasesSection } from "@/components/use-cases-section"
import { AIAssistantSection } from "@/components/ai-assistant-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FaqSection } from "@/components/faq-section"
import { CallToActionSection } from "@/components/call-to-action-section"

export default function Home() {
  return (
    <main className="bg-upslp-900">
      <EducationalHero />
      <HowItWorksSection />
      <ForTeachersSection />
      <ForStudentsSection />
      <AIAssistantSection />
      <UseCasesSection />
      <TestimonialsSection />
      <FaqSection />
      <CallToActionSection />
    </main>
  )
}

import FormSection from "@/components/pages/contact/FormSection";
import CTASection from "@/components/pages/home/CTASection";
import { FaqSection } from "@/components/pages/home/FaqSection";
import TestimonialSection from "@/components/pages/home/TestimonialSection";

export default function Contact() {
  return <main>
    <FormSection/>
    <TestimonialSection />
    <FaqSection />
    <CTASection />
  </main>
}
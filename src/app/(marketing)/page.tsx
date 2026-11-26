import { HeroSection } from "@/components/landing/HeroSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SafetyChecklist } from "@/components/landing/SafetyChecklist";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { RunnerCta } from "@/components/landing/RunnerCta";

export default function Home() {
  return (
    <>
      <HeroSection />
      <TrustSection />
      <HowItWorks />
      <SafetyChecklist />
      <RunnerCta />
      
      {/* 
        This acts as the final emotional validation. 
        It fades into your gradient background right before the closing CTA.
      */}
      <TestimonialsSection />
      
      <FinalCta />
    </>
  );
}
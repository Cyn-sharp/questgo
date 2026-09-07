import { HeroSection } from "@/components/hero/HeroSection";
import { TrustSection } from "@/components/trust/TrustSection";
import { HowItWorks } from "@/components/how-it-works/HowItWorks";
import { SafetyChecklist } from "@/components/safety/SafetyChecklist";
import { FinalCta } from "@/components/cta/FinalCta";

export default function Home() {
  return (
    <>
      <HeroSection />
      <TrustSection />
      <HowItWorks />
      <SafetyChecklist />
      <FinalCta />
    </>
  );
}
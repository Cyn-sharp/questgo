import { HeroSection } from "@/components/landing/HeroSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SafetyChecklist } from "@/components/landing/SafetyChecklist";
import { FinalCta } from "@/components/landing/FinalCta";

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
import { HeroSection } from "@/components/hero/HeroSection";
import { TrustSection } from "@/components/trust/TrustSection";
import { HowItWorks } from "@/components/how-it-works/HowItWorks";

export default function Home() {
  return (
    <>
      <HeroSection />
      <TrustSection />
      <HowItWorks />
    </>
  );
}
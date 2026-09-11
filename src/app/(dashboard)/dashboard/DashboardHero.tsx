import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function DashboardHero() {
  return (
    <section className="bg-[#fbf8f0] py-6 sm:py-8 md:py-10">
      <div className="page-container">
        {/* Background Banner Card */}
        <div className="relative rounded-3xl overflow-hidden border border-[#e5e0d8] shadow-card bg-[#161414]">
          
          {/* 1. Background Image */}
          <Image
            src="/images/citu-banner.jpg"
            alt="CIT-U Campus Background"
            fill
            className="object-cover object-center opacity-85"
            priority
            unoptimized
          />

          {/* 2. Gradient Overlay for High Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#161414]/85 via-[#7a1f32]/75 to-[#161414]/90 backdrop-blur-[2px]" />

          {/* 3. Centered Content Container */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-3xl mx-auto py-16 px-6 sm:py-20 md:py-24 space-y-6">
            

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.12] tracking-tight">
              Turn Tasks Into <br />
              <span className="text-[#c9a227]">Opportunities</span>
            </h1>

            {/* Centered Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/quests"
                className="
                  inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5
                  font-bold text-[15px] text-white bg-[#7a1f32] hover:bg-[#5f1727]
                  border border-[#c9a227]/50 shadow-lg hover:-translate-y-0.5 transition-all duration-300
                "
              >
                Find a Quest <ArrowRight className="w-4 h-4 text-[#c9a227]" />
              </Link>

              <Link
                href="/post-quest"
                className="
                  inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5
                  font-bold text-[15px] text-white bg-white/10 hover:bg-white/20
                  border-2 border-white/80 backdrop-blur-sm hover:-translate-y-0.5 transition-all duration-300
                "
              >
                Post a Quest
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
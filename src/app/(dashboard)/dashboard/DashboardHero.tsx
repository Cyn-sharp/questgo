"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardHero() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(" ")[0] || "Wildcat";

  return (
    <section className="bg-transparent py-6 sm:py-8 md:py-10">
      <div className="page-container">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.4)] bg-[#161414]">
          {/* Background Image */}
          <Image
            src="/images/citu-banner.jpg"
            alt="CIT-U Campus Background"
            fill
            className="object-cover object-center opacity-70"
            priority
            unoptimized
          />

          {/* Layered gradient overlay for premium depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#161414]/85 via-[#7a1f32]/80 to-[#161414]/95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,162,39,0.15)_0%,transparent_45%)]" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-3xl mx-auto py-12 px-5 sm:py-16 md:py-24 sm:px-6 space-y-4 sm:space-y-6">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a227]" />
                <span className="font-semibold text-[10px] sm:text-[11px] tracking-[0.08em] uppercase text-[#f6ecc8]">
                  Welcome back, {firstName}
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal delayMs={80}>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                Turn Tasks Into <br />
                <span className="text-[#c9a227]">Opportunities</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delayMs={160}>
              <p className="text-sm sm:text-base md:text-lg text-[#fbf8f0]/85 max-w-md leading-relaxed">
                Help a fellow Wildcat, complete a quest, and earn extra cash on
                campus. Simple, secure, and cash-on-delivery.
              </p>
            </ScrollReveal>

            <ScrollReveal delayMs={240}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2 w-full sm:w-auto">
                <Link
                  href="/quests"
                  className="
                    inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5
                    font-bold text-[15px] text-[#161414] bg-[#c9a227]
                    shadow-[0_4px_20px_rgba(201,162,39,0.3)]
                    hover:bg-[#b08b1e] hover:shadow-[0_6px_24px_rgba(201,162,39,0.55)]
                    active:scale-[0.98] transition-all duration-200
                  "
                >
                  Find a Quest
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/post-quest"
                  className="
                    inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5
                    font-semibold text-[15px] text-white bg-transparent
                    border-2 border-white/20 hover:bg-white/10 hover:border-[#c9a227]
                    active:scale-[0.98] transition-all duration-200
                  "
                >
                  Post a Quest
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
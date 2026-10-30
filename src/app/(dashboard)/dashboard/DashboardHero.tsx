"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useAuth } from "@/hooks/useAuth";
import { getProfileName } from "@/lib/auth/profile-name";
import CurrentQuest from "./CurrentQuest";

export default function DashboardHero() {
  const { user } = useAuth();
  const firstName = user ? getProfileName(user.displayName).split(/\s+/)[0] : "Wildcat";

  return (
    <section className="bg-transparent pt-5 pb-2 sm:pt-6">
      <div className="page-container space-y-4">
        <ScrollReveal>
          <div className="relative grid overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-[#161414] shadow-[0_20px_60px_rgba(0,0,0,0.4)] md:grid-cols-[1.35fr_1fr]">
            {/* Photo: a banner strip on mobile, a side panel on desktop */}
            <div className="relative h-36 sm:h-44 md:order-last md:h-auto md:min-h-[260px]">
              <Image
                src="/images/citu-students.jpg"
                alt="CIT-U students on campus"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover object-[center_35%]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161414] via-[#161414]/30 to-transparent md:hidden" />
              <div className="absolute inset-0 hidden bg-gradient-to-r from-[#161414] via-[#161414]/35 to-transparent md:block" />
            </div>

            <div className="relative z-10 flex flex-col justify-center gap-4 p-6 sm:p-8 md:p-10">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_0%_0%,rgba(122,31,50,0.55)_0%,transparent_60%)]" />
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#c9a227]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#f6ecc8]">
                  Welcome back, {firstName}
                </span>
              </span>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                Turn tasks into <span className="text-[#c9a227]">opportunities</span>
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-[#fbf8f0]/80 sm:text-base">
                Help a fellow Wildcat, complete a quest, and earn extra cash on campus. Simple, secure, and cash-on-delivery.
              </p>
              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <Link
                  href="/quests"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c9a227] px-6 py-3 text-[15px] font-bold text-[#161414] shadow-[0_4px_20px_rgba(201,162,39,0.3)] transition-all duration-200 hover:bg-[#b08b1e] active:scale-[0.98]"
                >
                  Find a Quest
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/post-quest"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 px-6 py-3 text-[15px] font-semibold text-white transition-all duration-200 hover:border-[#c9a227] hover:bg-white/10 active:scale-[0.98]"
                >
                  Post a Quest
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <CurrentQuest />
      </div>
    </section>
  );
}

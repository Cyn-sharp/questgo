import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export default function DashboardHero() {
  return (
    <section className="bg-white">
      <div className="page-container py-14 lg:py-16">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left copy */}
          <div className="flex-1 w-full space-y-6">
            <ScrollReveal>
              <div className="badge-gold !text-[11px] !px-3.5 !py-1.5 tracking-wider uppercase w-fit">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Exclusive to Verified CIT-U Students
              </div>
            </ScrollReveal>

            <ScrollReveal delayMs={80}>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-maroon leading-[1.12]">
                Turn Tasks Into
                <br />
                <span className="text-gold">Opportunities</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delayMs={160}>
              <p className="text-muted text-base sm:text-lg max-w-md leading-relaxed">
                Help a fellow student, complete a quest, and earn extra cash on
                campus. Simple, secure, and cash-on-delivery.
              </p>
            </ScrollReveal>

            <ScrollReveal delayMs={240}>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/quests" className="btn-primary btn-lift">
                  Find a Quest
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/post-quest" className="btn-outline btn-lift">
                  Post a Quest
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Right image */}
          <ScrollReveal delayMs={120} variant="scale" className="flex-1 w-full max-w-xl lg:max-w-none">
            <div className="group shine-wrap card-interactive relative w-full aspect-[16/9] sm:aspect-[16/10] rounded-2xl overflow-hidden shadow-card border border-border bg-dark hover:shadow-[0_18px_44px_rgba(122,31,50,0.18)]">
              <Image
                src="/images/citu-banner.jpg"
                alt="CIT-U Built Around You Banner"
                fill
                className="object-cover object-right sm:object-[85%_center] relative z-[1]"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
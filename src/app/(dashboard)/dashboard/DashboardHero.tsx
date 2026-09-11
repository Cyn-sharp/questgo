import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function DashboardHero() {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="page-container">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">
          
          {/* Left Text Content */}
          <div className="flex-1 w-full space-y-6">
            <div className="badge-gold !text-[11px] !px-3.5 !py-1.5 tracking-wider uppercase w-fit flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#7a1f32]" />
              <span>Exclusive to Verified CIT-U Students</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-[#7a1f32] leading-[1.15]">
              Turn Tasks Into <br />
              <span className="text-[#c9a227]">Opportunities</span>
            </h1>

            <p className="text-[#4a4340] text-base sm:text-lg max-w-md leading-relaxed">
              Help a fellow student, complete a quest, and earn extra cash on
              campus. Simple, secure, and cash-on-delivery.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/quests" className="btn-primary">
                Find a Quest <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/post-quest" className="btn-outline">
                Post a Quest
              </Link>
            </div>
          </div>

          {/* Right Wide Banner Image */}
          <div className="flex-1 w-full max-w-2xl">
            <div className="relative w-full aspect-[16/9] sm:aspect-[20/10] rounded-2xl overflow-hidden card-surface bg-[#161414] shadow-card">
              <Image
                src="/images/citu-banner.jpg"
                alt="CIT-U Students Banner"
                fill
                className="object-cover object-right sm:object-[45%_center]"
                priority
                unoptimized
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
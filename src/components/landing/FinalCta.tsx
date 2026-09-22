"use client";

import { useMouseParallax } from "@/hooks/useMouseParallax";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export const FinalCta = () => {
  const { ref, x, y, onMouseMove, onMouseLeave } = useMouseParallax<HTMLElement>(1.5);

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="flex flex-col items-center gap-6 px-6 md:px-16 py-20 md:py-24 bg-transparent border-b border-solid border-white/10 text-center"
      aria-labelledby="final-cta-heading"
    >
      <ScrollReveal>
        <div
          className="flex flex-col items-center gap-4 transition-transform duration-200 ease-out"
          style={{ transform: `translate3d(${x * 8}px, ${y * 8}px, 0)` }}
        >
          <h2
            id="final-cta-heading"
            className="font-extrabold text-3xl md:text-5xl tracking-tight text-white max-w-2xl [text-shadow:0_4px_20px_rgba(0,0,0,0.3)]"
          >
            Ready to Start Your First <span className="text-[#c9a227]">Quest?</span>
          </h2>

          <p className="font-normal text-base md:text-lg text-[#f6ecc8]/85 max-w-lg">
            Join the CIT-U student community today and turn everyday tasks into
            opportunities.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <a
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#c9a227] hover:bg-[#b08b1e] rounded-xl font-bold text-[15px] text-[#161414] shadow-[0_4px_20px_rgba(201,162,39,0.3)] hover:shadow-[0_6px_24px_rgba(201,162,39,0.55)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a227]"
            >
              Create an Account
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-transparent hover:bg-white/10 rounded-xl border-2 border-solid border-white/20 transition font-semibold text-[15px] text-white hover:border-[#c9a227] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a227]"
            >
              Log In
            </a>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};
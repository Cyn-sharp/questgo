"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useMouseParallax } from "@/hooks/useMouseParallax";

const trustCards = [
  {
    title: "CIT-U Verified",
    description:
      "Students register using their official @cit.edu email to guarantee security.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Safer Quest System",
    description:
      "Each Quest can only be accepted by one Quest Runner at a time to prevent disputes.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="11"
          width="18"
          height="11"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M7 11V7a5 5 0 0 1 10 0v4"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    title: "Cash on Delivery",
    description:
      "Quest payments are made directly through COD upon verified completion.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="2"
          y="6"
          width="20"
          height="12"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
];

export const TrustSection = () => {
  const { ref, x, y, onMouseMove, onMouseLeave } = useMouseParallax<HTMLElement>(1.5);

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="flex flex-col items-start gap-8 px-6 md:px-16 py-16 bg-transparent border-b border-transparent"
      aria-labelledby="trust-section-heading"
    >
      {/* Header reveal */}
      <ScrollReveal className="w-full">
        <header
          className="flex flex-col items-center gap-2 self-stretch w-full text-center transition-transform duration-200 ease-out"
          style={{
            transform: `translate3d(${x * 6}px, ${y * 6}px, 0)`,
          }}
        >
          <h2
            id="trust-section-heading"
            className="font-bold text-3xl md:text-[32px] tracking-tight text-white"
          >
            Built for the CIT-U Student Community
          </h2>
          <p className="font-normal text-base text-[#f6ecc8]/85 max-w-2xl">
            Safer, local peer-to-peer exchanges designed around university life
          </p>
        </header>
      </ScrollReveal>

      {/* Cards reveal (staggered) */}
      <div className="flex flex-col md:flex-row items-stretch gap-6 self-stretch w-full">
        {trustCards.map((card, index) => {
          const depth = 0.7 + index * 0.15;

          return (
            <ScrollReveal
              key={card.title}
              delayMs={index * 120}
              variant="scale"
              className="flex-1"
            >
              <div
                style={{
                  transform: `translate3d(${x * 12 * depth}px, ${y * 10 * depth}px, 0)`,
                  transition: "transform 0.25s ease-out",
                }}
              >
                <article
                  className="
                    group shine-wrap card-interactive
                    flex h-full flex-col items-start gap-4 p-6
                    rounded-2xl border border-white/15 bg-white/95 backdrop-blur-md
                    shadow-[0_12px_32px_rgba(0,0,0,0.25)]
                    hover:bg-[#5f1727] hover:border-[#c9a227]/50
                    hover:shadow-[0_18px_44px_rgba(0,0,0,0.45)]
                  "
                >
                  {/* Icon */}
                  <div
                    className="
                      relative z-[1]
                      w-12 h-12 flex items-center justify-center rounded-xl
                      bg-[#7a1f32]/10 text-[#7a1f32]
                      transition-all duration-500
                      group-hover:bg-white/10
                      group-hover:text-[#c9a227]
                      group-hover:scale-110
                    "
                    aria-hidden="true"
                  >
                    {card.icon}
                  </div>

                  {/* Title */}
                  <h3
                    className="
                      relative z-[1]
                      font-bold text-xl tracking-tight text-[#161414]
                      transition-colors duration-500
                      group-hover:text-white
                    "
                  >
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="
                      relative z-[1]
                      self-stretch font-normal text-sm leading-relaxed text-[#4a4340]
                      transition-colors duration-500
                      group-hover:text-white/90
                    "
                  >
                    {card.description}
                  </p>
                </article>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
};
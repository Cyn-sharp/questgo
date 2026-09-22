"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useMouseParallax } from "@/hooks/useMouseParallax";

const steps = [
  {
    number: "01",
    title: "POST",
    description:
      "Create a Quest with details, location, and the PHP reward you want to offer.",
  },
  {
    number: "02",
    title: "ACCEPT",
    description:
      "A verified CIT-U student accepts your quest and starts executing it.",
  },
  {
    number: "03",
    title: "COMPLETE",
    description:
      "The Quest Runner completes the task and provides delivery proof.",
  },
  {
    number: "04",
    title: "MEET & PAY",
    description:
      "Meet up at the preferred on-campus location and complete the COD payment.",
  },
];

export const HowItWorks = () => {
  const { ref, x, y, onMouseMove, onMouseLeave } = useMouseParallax<HTMLElement>(1.5);

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      id="how-it-works"
      className="flex flex-col items-start gap-8 px-6 md:px-16 py-16 bg-transparent border-b border-transparent"
      aria-labelledby="how-it-works-heading"
    >
      {/* Header reveal */}
      <ScrollReveal className="w-full">
        <header
          className="flex flex-col items-center gap-2 self-stretch w-full text-center transition-transform duration-200 ease-out"
          style={{ transform: `translate3d(${x * 6}px, ${y * 6}px, 0)` }}
        >
          <h2
            id="how-it-works-heading"
            className="font-bold text-3xl md:text-[32px] tracking-tight text-white"
          >
            How It Works
          </h2>
          <p className="font-normal text-base text-[#f6ecc8]/85 max-w-2xl">
            Four simple steps to conquer your goals on campus
          </p>
        </header>
      </ScrollReveal>

      {/* Steps reveal (staggered) */}
      <ol className="flex flex-col md:flex-row items-stretch gap-6 self-stretch w-full list-none m-0 p-0">
        {steps.map((step, index) => (
          <ScrollReveal
            key={step.number}
            delayMs={index * 120}
            variant="scale"
            className="flex-1"
          >
            <li
              style={{
                transform: `translate3d(${x * (index + 1) * 4}px, ${y * (index + 1) * 4}px, 0)`,
              }}
              className="
                group shine-wrap card-interactive
                flex h-full flex-col items-start gap-3 p-6
                rounded-2xl border border-white/15 bg-white/95 backdrop-blur-md
                shadow-[0_12px_32px_rgba(0,0,0,0.25)]
                hover:bg-[#5f1727] hover:border-[#c9a227]/50
                hover:shadow-[0_18px_44px_rgba(0,0,0,0.45)]
              "
            >
              {/* Number */}
              <span
                className="
                  relative z-[1]
                  font-extrabold text-[40px] leading-none tracking-tight text-[#c9a227]
                  transition-all duration-500
                  group-hover:text-[#f6ecc8]
                  group-hover:scale-110
                "
                aria-hidden="true"
              >
                {step.number}
              </span>

              {/* Title */}
              <h3
                className="
                  relative z-[1]
                  font-bold text-lg tracking-wide text-[#7a1f32]
                  transition-colors duration-500
                  group-hover:text-white
                "
              >
                {step.title}
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
                {step.description}
              </p>
            </li>
          </ScrollReveal>
        ))}
      </ol>
    </section>
  );
};
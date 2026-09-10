import { ScrollReveal } from "@/components/ui/ScrollReveal";

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
  return (
    <section
      id="how-it-works"
      className="flex flex-col items-start gap-8 px-6 md:px-16 py-16 bg-white border-b border-solid border-[#e5e0d9]"
      aria-labelledby="how-it-works-heading"
    >
      {/* Header reveal */}
      <ScrollReveal className="w-full">
        <header className="flex flex-col items-center gap-2 self-stretch w-full text-center">
          <h2
            id="how-it-works-heading"
            className="font-bold text-3xl md:text-[32px] tracking-tight text-[#161414]"
          >
            How It Works
          </h2>
          <p className="font-normal text-base text-[#4a4340] max-w-2xl">
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
              className="
                group shine-wrap card-interactive
                flex h-full flex-col items-start gap-3 p-5
                rounded-2xl border border-solid border-[#e5e0d9] bg-[#fbf8f0]
                shadow-[0px_2px_8px_#0000000d]
                hover:bg-[#7a1f32] hover:border-[#7a1f32]
                hover:shadow-[0_18px_44px_rgba(122,31,50,0.28)]
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
                  group-hover:text-white/85
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
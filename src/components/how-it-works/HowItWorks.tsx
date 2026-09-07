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

export const HowItWorks = (): JSX.Element => {
  return (
    <section
      id="how-it-works"
      className="flex flex-col items-start gap-8 px-6 md:px-16 py-16 bg-white border-b border-solid border-[#e5e0d9]"
      aria-labelledby="how-it-works-heading"
    >
      <header className="flex flex-col items-center gap-2 self-stretch w-full text-center">
        <h2
          id="how-it-works-heading"
          className="font-bold text-3xl md:text-[32px] tracking-tight text-[#161414]"
        >
          How It Works
        </h2>
        <p className="font-normal text-base text-[#4a4340]">
          Four simple steps to conquer your goals on campus
        </p>
      </header>

      <ol className="flex flex-col md:flex-row items-stretch gap-6 self-stretch w-full list-none m-0 p-0">
        {steps.map((step) => (
          <li
            key={step.number}
            className="flex flex-col items-start gap-3 p-5 flex-1 bg-[#fbf8f0] rounded-2xl border border-solid border-[#e5e0d9] shadow-[0px_2px_8px_#0000000d]"
          >
            <span
              className="font-extrabold text-[40px] leading-none tracking-tight text-[#c9a227] [text-shadow:0px_4px_10px_#7a1f3214]"
              aria-hidden="true"
            >
              {step.number}
            </span>
            <h3 className="font-bold text-lg tracking-wide text-[#7a1f32]">
              {step.title}
            </h3>
            <p className="self-stretch font-normal text-sm leading-relaxed text-[#4a4340]">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
};
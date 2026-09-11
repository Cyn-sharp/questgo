const safetyChecks = [
  "Official @cit.edu email verification",
  "One verified account per student profile",
  "One dedicated Quest Runner per task",
  "Automatic 30-minute Quest expiration",
  "Secure chat messenger after acceptance",
  "Instant report and blocking tools",
  "Transparent ratings and reputation status",
  "No-risk cash on delivery payment flow",
];

export const SafetyChecklist = (): JSX.Element => {
  return (
    <section
      id="safety"
      aria-labelledby="safety-checklist-title"
      className="relative flex flex-col items-start gap-8 border-b border-[#e5e0d9] bg-white px-6 md:px-16 py-16"
    >
      <header className="relative flex w-full flex-col items-center gap-2 text-center">
        <h2
          id="safety-checklist-title"
          className="font-bold text-3xl md:text-[32px] tracking-tight text-[#161414]"
        >
          Campus Safety First
        </h2>
        <p className="font-normal text-base text-[#4a4340]">
          Multiple layers of verification and transparency
        </p>
      </header>

      <ul
        aria-label="Campus safety protections"
        className="grid w-full grid-cols-1 md:grid-cols-2 gap-4"
      >
        {safetyChecks.map((safetyCheck) => (
          <li
            key={safetyCheck}
            className="flex items-center gap-3 rounded-xl border border-[#e5e0d9] bg-[#fdfcf8] px-4 py-3.5 transition-colors hover:border-[#c9a227]/40 hover:bg-[#fbf8f0]"
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#e8d9a8] bg-[#fdf9eb]"
            >
              <span className="text-xs font-bold text-[#c9a227]">✓</span>
            </span>
            <span className="font-medium text-[15px] leading-snug text-[#161414]">
              {safetyCheck}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
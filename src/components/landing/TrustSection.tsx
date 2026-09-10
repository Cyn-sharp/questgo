const trustCards = [
  {
    title: "CIT-U Verified",
    titleClassName: "text-[#7a1f32]",
    description:
      "Students register using their official @cit.edu email to guarantee security.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          stroke="#7a1f32"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="#7a1f32"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Safer Quest System",
    titleClassName: "text-[#161414]",
    description:
      "Each Quest can only be accepted by one Quest Runner at a time to prevent disputes.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#7a1f32" strokeWidth="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#7a1f32" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: "Cash on Delivery",
    titleClassName: "text-[#161414]",
    description:
      "Quest payments are made directly through COD upon verified completion.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2" y="6" width="20" height="12" rx="2" stroke="#7a1f32" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" stroke="#7a1f32" strokeWidth="2" />
      </svg>
    ),
  },
];

export const TrustSection = () => {
  return (
    <section
      className="flex flex-col items-start gap-8 px-6 md:px-16 py-16 bg-[#fbf8f0]"
      aria-labelledby="trust-section-heading"
    >
      <header className="flex flex-col items-center gap-2 self-stretch w-full text-center">
        <h2
          id="trust-section-heading"
          className="font-bold text-3xl md:text-[32px] tracking-tight text-[#161414]"
        >
          Built for the CIT-U Student Community
        </h2>
        <p className="font-normal text-base text-[#4a4340]">
          Safer, local peer-to-peer exchanges designed around university life
        </p>
      </header>

      <div className="flex flex-col md:flex-row items-stretch gap-6 self-stretch w-full">
        {trustCards.map((card, index) => (
          <article
            key={card.title}
            className={`
              shine-wrap card-lift
              flex flex-col items-start gap-4 p-6 flex-1
              bg-white rounded-2xl border border-solid border-[#e5e0d9]
              shadow-[0px_2px_8px_#0000000d]
              animate-fade-up
              ${index === 0 ? "delay-100" : index === 1 ? "delay-200" : "delay-300"}
            `}
          >
            <div
              className="w-12 h-12 flex items-center justify-center bg-[#fbf8f0] rounded-xl transition-transform duration-300 group-hover:scale-110"
              aria-hidden="true"
            >
              {card.icon}
            </div>
            <h3 className={`font-bold text-xl tracking-tight ${card.titleClassName}`}>
              {card.title}
            </h3>
            <p className="self-stretch font-normal text-sm leading-relaxed text-[#4a4340]">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};
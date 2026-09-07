const navigationItems = [
  {
    label: "Home",
    href: "#home",
    className:
      "text-[#c9a227] relative w-fit mt-[-1.00px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-[15px] tracking-[0] leading-[normal] whitespace-nowrap",
  },
  {
    label: "How It Works",
    href: "#how-it-works",
    className:
      "relative w-fit mt-[-1.00px] [font-family:'Fraunces-SemiBold',Helvetica] font-semibold text-white text-[15px] tracking-[0] leading-[normal] whitespace-nowrap",
  },
  {
    label: "Safety",
    href: "#safety",
    className:
      "relative w-fit mt-[-1.00px] [font-family:'Inter-Medium',Helvetica] font-medium text-white text-[15px] tracking-[0] leading-[normal] whitespace-nowrap",
  },
];

export const HeaderContainer = (): JSX.Element => {
  return (
    <header className="flex flex-col items-start relative bg-[#161414] border border-solid border-[#e8e7e3]">
      <div className="flex items-center justify-between px-16 py-4 relative self-stretch w-full flex-[0_0_auto]">
        <a
          href="#home"
          aria-label="QuestGo CIT-U Campus home"
          className="inline-flex items-center gap-3 relative flex-[0_0_auto]"
        >
          <span
            aria-hidden="true"
            className="relative w-10 h-10 rounded-[10px] bg-[url(/logo-icon.png)] bg-cover bg-[50%_50%]"
          />
          <span className="inline-flex flex-col items-start gap-0.5 relative flex-[0_0_auto]">
            <span className="relative w-fit mt-[-1.00px] [font-family:'Outfit-Bold',Helvetica] font-bold text-white text-xl tracking-[0] leading-[normal]">
              QuestGo
            </span>
            <span className="relative w-fit [font-family:'Inter-Medium',Helvetica] font-medium text-white text-[11px] tracking-[0.11px] leading-[normal] whitespace-nowrap">
              CIT-U CAMPUS
            </span>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <ul className="inline-flex items-center gap-8 relative flex-[0_0_auto]">
            {navigationItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  aria-current={item.label === "Home" ? "page" : undefined}
                  className={item.className}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="inline-flex items-center gap-4 relative flex-[0_0_auto]">
          <a
            href="/login"
            className="bg-[#161414] border-[1.5px] border-solid border-[#7a1f32] shadow-[0px_2px_8px_#0000001a] inline-flex items-center justify-center gap-2 px-6 py-3 relative flex-[0_0_auto] rounded-xl"
          >
            <span className="relative w-fit mt-[-1.50px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-white text-[15px] tracking-[0] leading-[normal] whitespace-nowrap">
              Log In
            </span>
          </a>
          <a
            href="/register"
            className="bg-[#7a1f32] shadow-[0px_8px_18px_#7a1f3226] inline-flex items-center justify-center gap-2 px-6 py-3 relative flex-[0_0_auto] rounded-xl"
          >
            <span className="text-white relative w-fit mt-[-1.00px] [font-family:'Inter-SemiBold',Helvetica] font-semibold text-[15px] tracking-[0] leading-[normal] whitespace-nowrap">
              Register
            </span>
          </a>
        </div>
      </div>
    </header>
  );
};

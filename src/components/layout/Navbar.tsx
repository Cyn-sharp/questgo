import Image from "next/image";

const navigationItems = [
  {
    label: "Home",
    href: "#home",
    className:
      "font-semibold text-[15px] text-[#c9a227] hover:text-[#e6b93d] transition",
  },
  {
    label: "How It Works",
    href: "#how-it-works",
    className:
      "font-medium text-[15px] text-white/90 hover:text-[#c9a227] transition",
  },
  {
    label: "Safety",
    href: "#safety",
    className:
      "font-medium text-[15px] text-white/90 hover:text-[#c9a227] transition",
  },
];



export const HeaderContainer = (): JSX.Element => {
  return (
    <header className="flex flex-col items-start bg-[#161414] border-b border-[#2a2a2a]">
      <div className="flex items-center justify-between px-6 md:px-16 py-4 w-full">
        <a
          href="#home"
          aria-label="QuestGo CIT-U Campus home"
          className="inline-flex items-center gap-3"
        >
          <Image
            src="/logo.png"
            alt="QuestGo logo"
            width={40}
            height={40}
            className="rounded-[10px] object-contain"
            priority
          />
          <span className="inline-flex flex-col items-start gap-0.5">
            <span className="font-bold text-white text-xl tracking-tight leading-none">
              QuestGo
            </span>
            <span className="font-medium text-white/70 text-[11px] tracking-[0.12em] uppercase leading-none">
              CIT-U Campus
            </span>
          </span>
        </a>

        <nav aria-label="Primary navigation" className="hidden md:block">
          <ul className="inline-flex items-center gap-8">
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

        <div className="inline-flex items-center gap-3">
          <a
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border-[1.5px] border-[#7a1f32] font-semibold text-[14px] text-white hover:bg-white/5 transition"
          >
            Log In
          </a>
          <a
            href="/register"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#7a1f32] font-semibold text-[14px] text-white shadow-[0px_8px_18px_#7a1f3226] hover:bg-[#661a2a] transition"
          >
            Register
          </a>
        </div>
      </div>
    </header>
  );
};
import Image from "next/image";
import Link from "next/link";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Safety", href: "/#safety" },
];

export function AuthNavbar() {
  return (
    <header className="w-full border-b border-[#2a2a2a] bg-[#161414] shadow-[0_6px_16px_#00000014]">
      <nav
        className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 md:px-16"
        aria-label="Main navigation"
      >
        <Link href="/" className="inline-flex items-center gap-3" aria-label="QuestGo home">
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="rounded-[10px] object-contain"
            priority
          />
          <span className="inline-flex min-w-0 flex-col gap-0.5">
            <span className="font-outfit text-lg font-bold leading-none text-white sm:text-xl">QuestGo</span>
            <span className="hidden font-inter text-[11px] font-medium uppercase tracking-[0.11em] text-white/70 sm:inline">
              CIT-U Campus
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-inter text-[15px] font-medium text-white transition-colors hover:text-[#c9a227]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="inline-flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-[#7a1f32] px-3 py-2 font-inter text-xs font-semibold text-white transition hover:bg-white/5 sm:px-4 sm:py-2.5 sm:text-sm md:px-6"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-[#7a1f32] px-3 py-2 font-inter text-xs font-semibold text-white shadow-[0_8px_18px_#7a1f3226] transition hover:bg-[#661a2a] sm:px-4 sm:py-2.5 sm:text-sm md:px-6"
          >
            Register
          </Link>
        </div>
      </nav>
    </header>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";

// --- MARKETING NAVBAR (Unauthenticated / Public Landing Page) ---
const marketingNavItems = [
  {
    label: "Home",
    href: "#home",
    className: "font-semibold text-[15px] text-[#c9a227] hover:text-[#e6b93d] transition",
  },
  {
    label: "How It Works",
    href: "#how-it-works",
    className: "font-medium text-[15px] text-white/90 hover:text-[#c9a227] transition",
  },
  {
    label: "Safety",
    href: "#safety",
    className: "font-medium text-[15px] text-white/90 hover:text-[#c9a227] transition",
  },
];

export const HeaderContainer = (): JSX.Element => {
  return (
    <header className="flex flex-col items-start bg-[#161414] border-b border-[#2a2a2a]">
      <div className="flex items-center justify-between px-6 md:px-16 py-4 w-full max-w-screen-2xl mx-auto">
        <Link href="/" aria-label="QuestGo CIT-U Campus home" className="inline-flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="QuestGo logo"
            width={40}
            height={40}
            className="rounded-[10px] object-contain"
            priority
          />
          <span className="inline-flex flex-col items-start gap-0.5">
            <span className="font-bold text-white text-xl tracking-tight leading-none">QuestGo</span>
            <span className="font-medium text-white/70 text-[11px] tracking-[0.12em] uppercase leading-none">
              CIT-U Campus
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden md:block">
          <ul className="inline-flex items-center gap-8">
            {marketingNavItems.map((item) => (
              <li key={item.label}>
                <a href={item.href} className={item.className}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="inline-flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border-[1.5px] border-[#7a1f32] font-semibold text-[14px] text-white hover:bg-white/5 transition"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#7a1f32] font-semibold text-[14px] text-white shadow-[0px_8px_18px_#7a1f3226] hover:bg-[#661a2a] transition"
          >
            Register
          </Link>
        </div>
      </div>
    </header>
  );
};


// --- DASHBOARD NAVBAR (Logged-In User App Shell) ---
const dashboardNavItems = [
  { label: "Home", href: "/dashboard", isActive: true },
  { label: "Find a Quest", href: "/quests", isActive: false },
  { label: "Post a Quest", href: "/post-quest", isActive: false },
  { label: "My Requests", href: "/requests", isActive: false },
  { label: "Profile", href: "/profile", isActive: false },
];

export const Navbar = (): JSX.Element => {
  return (
    <header className="flex flex-col items-start bg-[#161414] border-b border-[#2a2a2a]">
      <div className="flex items-center justify-between px-6 md:px-16 py-4 w-full max-w-screen-2xl mx-auto">
        <Link href="/dashboard" aria-label="QuestGo CIT-U Campus home" className="inline-flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="QuestGo logo"
            width={40}
            height={40}
            className="rounded-[10px] object-contain"
            priority
          />
          <span className="inline-flex flex-col items-start gap-0.5">
            <span className="font-bold text-white text-xl tracking-tight leading-none">QuestGo</span>
            <span className="font-medium text-white/70 text-[11px] tracking-[0.12em] uppercase leading-none">
              CIT-U Campus
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden lg:block">
          <ul className="inline-flex items-center gap-8">
            {dashboardNavItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`text-[14px] font-medium transition-all pb-1 border-b-2 ${
                    item.isActive
                      ? "text-[#c9a227] border-[#c9a227]"
                      : "text-white/90 border-transparent hover:text-[#c9a227]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:inline-flex items-center gap-6">
          <div className="flex items-center gap-1.5 border border-[#3A3326] bg-[#221D15] px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a227]" />
            <span className="text-[#c9a227] text-[10px] font-bold tracking-widest uppercase">
              CIT-U Verified
            </span>
          </div>

          <button className="relative text-gray-400 hover:text-white transition">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#161414]"></span>
          </button>

          <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition">
            <Image
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Dave"
              alt="User avatar"
              width={36}
              height={36}
              className="rounded-full bg-white shrink-0"
            />
            <span className="text-white text-[14px] font-medium">Dave Alinson
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
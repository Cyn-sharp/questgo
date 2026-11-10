import Link from "next/link";
import { cn } from "@/lib/utils/cn";

// Molecule: a header navigation link with a clear active state.
export function NavLink({ href, active = false, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex h-9 items-center whitespace-nowrap rounded-full px-3 text-[14px] font-medium transition-colors lg:px-3.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        active ? "text-gold" : "text-white/75 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      {children}
      {active && <span aria-hidden className="absolute -bottom-[13px] left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-gold" />}
    </Link>
  );
}

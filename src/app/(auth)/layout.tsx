"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthPromoPanel } from "@/components/auth/AuthPromoPanel";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="flex min-h-screen flex-col bg-cream">
      <div className="flex items-start justify-center p-4 pb-8 sm:p-6 sm:pb-10 lg:flex-1 lg:items-center lg:overflow-visible lg:p-8">
        <div className="w-full max-w-[1180px]">
          <Link
            href="/"
            className="mb-3 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 py-2 font-inter text-sm font-semibold text-maroon transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon"
            aria-label="Back to QuestGo home"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </Link>
          <div className="flex h-[calc(100vh-2rem)] max-h-[760px] min-h-[620px] w-full overflow-hidden rounded-2xl border border-[#e5e0d9] bg-cream shadow-[0_16px_40px_#00000014] max-lg:h-auto max-lg:min-h-0 max-lg:flex-col max-lg:overflow-visible">
            <AuthPromoPanel />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, x: pathname === "/register" ? 18 : -18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: pathname === "/register" ? -18 : 18 }}
                transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
                className="flex min-w-0 w-full flex-1 max-lg:flex-none lg:w-1/2"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}

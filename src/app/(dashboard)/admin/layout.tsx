"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, ClipboardList, Flag, History, IdCard, Menu, ShieldCheck, X } from "lucide-react";


const SECTIONS = [
  { href: "/admin", label: "Settlement queue", Icon: ClipboardList },
  { href: "/admin/reports", label: "User reports", Icon: Flag },
  { href: "/admin/id-checks", label: "ID checks", Icon: IdCard },
  { href: "/admin/runners", label: "Runner applications", Icon: BadgeCheck },
  { href: "/admin/audit", label: "Audit log", Icon: History },
];

function AdminShell({ pathname, children }: { pathname: string; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 lg:flex">
      <header className="flex min-h-16 items-center justify-between border-b border-slate-700 bg-gradient-to-r from-maroon-deep to-slate-900 px-4 text-white lg:hidden">
        <span className="font-semibold">QuestGo Admin</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/30 px-2 py-1 text-xs font-semibold"><ShieldCheck size={13} aria-hidden="true" />Administrator mode</span>
        <button type="button" aria-expanded={menuOpen} aria-controls="admin-sidebar" onClick={() => setMenuOpen((open) => !open)} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg border border-white/35 px-3 text-sm font-semibold transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none">
          {menuOpen ? <X size={17} aria-hidden="true" /> : <Menu size={17} aria-hidden="true" />}<span className="sr-only">{menuOpen ? "Close" : "Open"} admin menu</span>
        </button>
      </header>
      <aside id="admin-sidebar" className={`grid overflow-hidden border-b border-slate-700 bg-gradient-to-b from-maroon-deep to-slate-900 text-white transition-[max-height,opacity] duration-200 motion-reduce:transition-none ${menuOpen ? "visible max-h-72 opacity-100" : "invisible max-h-0 opacity-0"} lg:visible lg:min-h-screen lg:max-h-none lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:opacity-100`}>
        <div className="p-5 lg:sticky lg:top-0">
          <div className="hidden border-b border-white/15 pb-5 lg:block"><p className="text-xs font-semibold uppercase tracking-wide text-white/65">QuestGo</p><p className="mt-1 text-lg font-semibold">Administrator</p><span className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/30 px-2 py-1 text-xs font-semibold"><ShieldCheck size={13} aria-hidden="true" />Administrator mode</span></div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/65 lg:mt-5">Review queues</p>
          <nav aria-label="Administrator sections" className="space-y-1">
            {SECTIONS.map((section) => {
              const current = section.href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/review") : pathname.startsWith(section.href);
              const Icon = section.Icon;
              return <Link key={section.href} href={section.href} aria-current={current ? "page" : undefined} onClick={() => setMenuOpen(false)} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none ${current ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}><Icon size={17} aria-hidden="true" />{section.label}</Link>;
            })}
          </nav>
          <div className="mt-8 hidden border-t border-white/15 pt-4 text-xs text-white/75 lg:block"><p className="font-semibold text-white">Staff console</p><p className="mt-1">Internal review tools</p></div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="hidden min-h-14 items-center justify-end border-b border-slate-200 bg-white px-8 lg:flex"><span className="inline-flex items-center gap-1 rounded-full border border-maroon/40 bg-rose-50 px-3 py-1 text-xs font-semibold text-maroon"><ShieldCheck size={13} aria-hidden="true" />Administrator mode</span></div>
        <main id="admin-main" className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Remount the shell on navigation so the mobile menu always closes on route changes.
  return <AdminShell key={pathname} pathname={pathname}>{children}</AdminShell>;
}

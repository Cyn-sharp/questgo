"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ClipboardList, Flag, History, IdCard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { auth } from "@/lib/auth/firebase";
import { endSession } from "@/lib/auth/logout";
import { BrandMark } from "@/components/ui/BrandMark";

// Only admin tools live here. Students' features (top bar, Messages, bottom tabs) stay in the student app.
const GROUPS = [
  {
    label: "Review queues",
    items: [
      { href: "/admin", label: "Settlement queue", Icon: ClipboardList },
      { href: "/admin/reports", label: "User reports", Icon: Flag },
      { href: "/admin/id-checks", label: "ID checks", Icon: IdCard },
    ],
  },
  {
    label: "Records",
    items: [{ href: "/admin/audit", label: "Audit log", Icon: History }],
  },
];

function isCurrent(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin" || pathname.startsWith("/admin/review");
  return pathname.startsWith(href);
}

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

type ShellProps = { name: string; email: string; children: React.ReactNode };

function Shell({ pathname, name, email, children }: ShellProps & { pathname: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      await endSession(() => auth.signOut());
      // A full page load also clears any admin data kept in memory.
      window.location.replace("/login");
    } catch {
      setSignOutError("Could not sign out. Please try again.");
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      {/* Phones and tablets: a bar pinned to the top of the screen, with the menu button. */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-maroon-deep to-slate-900 px-4 text-white lg:hidden">
        <Link href="/admin" aria-label="Admin console home" className={`rounded-lg ${focusRing}`}>
          <BrandMark subtitle={false} />
        </Link>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
          onClick={() => setMenuOpen((open) => !open)}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/35 px-3 transition-colors hover:bg-white/10 ${focusRing}`}
        >
          {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          <span className="sr-only">{menuOpen ? "Close" : "Open"} admin menu</span>
        </button>
      </header>

      {/* The menu is pinned in place, so it never scrolls away with the page:
          a left column on computers, a full-screen panel under the top bar on phones. */}
      <aside
        id="admin-sidebar"
        className={`${menuOpen ? "block" : "hidden"} fixed bottom-0 left-0 right-0 top-16 z-40 overflow-y-auto overscroll-contain bg-gradient-to-b from-maroon-deep to-slate-900 text-white lg:right-auto lg:top-0 lg:block lg:w-64 lg:border-r lg:border-white/10`}
      >
        <div className="flex min-h-full flex-col p-5">
          <div className="hidden border-b border-white/15 pb-5 lg:block">
            <Link href="/admin" aria-label="Admin console home" className={`inline-block rounded-lg ${focusRing}`}>
              <BrandMark subtitle={false} />
            </Link>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gold-bright/40 bg-white/5 px-2.5 py-1 text-xs font-semibold text-gold-bright">
              <ShieldCheck size={13} aria-hidden="true" />
              Admin console
            </p>
          </div>

          <nav aria-label="Admin sections" className="space-y-6 lg:mt-6">
            {GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-white/70">{group.label}</p>
                <ul className="space-y-1">
                  {group.items.map(({ href, label, Icon }) => {
                    const current = isCurrent(href, pathname);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          aria-current={current ? "page" : undefined}
                          onClick={() => setMenuOpen(false)}
                          className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors motion-reduce:transition-none ${focusRing} ${current ? "bg-white text-maroon shadow-sm" : "text-white/90 hover:bg-white/10 hover:text-white"}`}
                        >
                          <Icon size={18} aria-hidden="true" />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-6 border-t border-white/15 pt-4 lg:mt-auto">
            <div className="flex items-center gap-3 px-3">
              <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-bright text-sm font-bold text-dark">
                {name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{name}</p>
                {email ? <p className="truncate text-xs text-white/70">{email}</p> : null}
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link href="/dashboard" className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white ${focusRing}`}>
                <ArrowLeft size={18} aria-hidden="true" />
                Back to QuestGo
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                disabled={signingOut}
                className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60 ${focusRing}`}
              >
                <LogOut size={18} aria-hidden="true" />
                {signingOut ? "Signing out…" : "Log out"}
              </button>
            </div>
            {signOutError ? <p role="alert" className="mt-2 px-3 text-xs font-medium text-red-200">{signOutError}</p> : null}
          </div>
        </div>
      </aside>

      {/* Leaves room for the pinned top bar (phones) or the pinned menu (computers). */}
      <div className="pt-16 lg:pl-64 lg:pt-0">
        <main id="admin-main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

/** The admin console frame. Only rendered after the server confirmed the visitor is an admin. */
export function AdminShell({ name, email, children }: ShellProps) {
  const pathname = usePathname();
  // Remount on navigation so the phone menu always closes on page changes.
  return <Shell key={pathname} pathname={pathname} name={name} email={email}>{children}</Shell>;
}
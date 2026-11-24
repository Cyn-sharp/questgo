import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

// Shared frame for the pages reached from the profile menu.
export function SubPage({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="page-container py-8">
      <Link href="/profile" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-parchment/90 hover:text-white">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Back to profile
      </Link>
      <PageHeader eyebrow="Profile" title={title} description={description} />
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/40 bg-white/95 p-5 text-[#161414] shadow-[0_12px_32px_rgba(0,0,0,0.15)] sm:p-6">
      {title && <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>}
      {children}
    </section>
  );
}

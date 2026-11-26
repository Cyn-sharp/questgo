import type { ReactNode } from "react";

export function AdminPageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">{<div>{eyebrow && <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{eyebrow}</p>}<h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>{description && <p className="mt-1 max-w-3xl text-sm text-slate-600">{description}</p>}</div>}{action}</div>;
}

export function AdminPanel({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_6px_18px_rgba(15,23,42,0.03)] ${className}`}>{children}</section>;
}

export function AdminStatusChip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warning" | "danger" | "success" }) {
  const tones = { neutral: "border-slate-300 bg-slate-100 text-slate-800", warning: "border-amber-200 bg-amber-50 text-amber-950", danger: "border-red-200 bg-red-50 text-red-950", success: "border-emerald-200 bg-emerald-50 text-emerald-950" };
  return <span className={`inline-flex min-h-6 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}><span aria-hidden="true">●</span>{children}</span>;
}

export function AdminLoadingRows({ label = "Loading queue", rows = 4, columns = 5 }: { label?: string; rows?: number; columns?: number }) {
  return <div role="status" aria-label={label} className="space-y-2 p-4"><span className="sr-only">{label}</span>{Array.from({ length: rows }, (_, row) => <div key={row} aria-hidden="true" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }, (_, col) => <span key={col} className="h-9 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />)}</div>)}</div>;
}

export function AdminEmptyState({ children }: { children: ReactNode }) {
  return <p role="status" className="border border-slate-300 bg-white p-6 text-sm text-slate-700">{children}</p>;
}

export function AdminErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" className="border border-red-300 bg-white p-4 text-sm text-red-900"><p className="text-red-900">{message}</p><button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-11 items-center border border-red-800 px-3 font-semibold text-red-900 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon">Retry</button></div>;
}

export function AdminTableFrame({ caption, children }: { caption: string; children: ReactNode }) {
  return <div className="hidden overflow-x-auto lg:block"><table className="w-full border-collapse text-left text-sm"><caption className="sr-only">{caption}</caption>{children}</table></div>;
}

export const adminTh = "sticky top-0 border-b border-slate-200 bg-white/95 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 backdrop-blur";
export const adminTd = "border-b border-slate-100 px-3 py-3 align-top text-slate-800";
export const adminInput = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-maroon motion-reduce:transition-none";

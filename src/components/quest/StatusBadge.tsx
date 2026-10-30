import { cn } from "@/lib/utils/cn";

const STYLES: Record<string, { label: string; className: string }> = {
  available: { label: "Waiting for runner", className: "bg-parchment text-maroon" },
  accepted: { label: "Accepted", className: "bg-sky-50 text-sky-800" },
  in_progress: { label: "In progress", className: "bg-amber-50 text-amber-800" },
  settlement: { label: "Needs settlement", className: "bg-red-50 text-red-700" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", className: "bg-stone-100 text-stone-600" },
  expired: { label: "Expired", className: "bg-stone-100 text-stone-600" },
};

// Atom: a quest's status as a coloured pill.
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STYLES[status] ?? { label: status.replaceAll("_", " "), className: "bg-stone-100 text-stone-600" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", style.className, className)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {style.label}
    </span>
  );
}

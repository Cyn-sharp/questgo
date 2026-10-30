import type { LucideIcon } from "lucide-react";

// Molecule: a friendly placeholder when a list has nothing to show.
export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-10 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-gold">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-parchment/75">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

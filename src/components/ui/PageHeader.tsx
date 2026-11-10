import { cn } from "@/lib/utils/cn";

// Molecule: the title block at the top of each page on the maroon background.
export function PageHeader({ eyebrow, title, description, actions, className }: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8", className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">{eyebrow}</p>}
        <h1 className="font-display text-[28px] font-bold leading-[1.1] tracking-tight text-white sm:text-[36px]">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-parchment/80 sm:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

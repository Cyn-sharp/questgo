import { cn } from "@/lib/utils/cn";

type Option<T extends string> = { value: T; label: string; count?: number };

// Molecule: a compact switch between a few views, for use on the maroon background.
export function SegmentedControl<T extends string>({ label, options, value, onChange, className }: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex max-w-full overflow-x-auto rounded-2xl bg-black/25 p-1 ring-1 ring-white/10 scrollbar-hide", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3.5 text-[13.5px] font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              selected ? "bg-cream text-maroon-dark shadow-sm" : "text-white/75 hover:text-white",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn("min-w-5 rounded-full px-1.5 text-center text-[11px] font-bold tabular-nums leading-5",
                selected ? "bg-maroon text-white" : "bg-white/10 text-white/80")}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

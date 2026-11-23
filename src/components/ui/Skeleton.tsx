import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type SkeletonTone = "light" | "gold" | "maroon" | "dark";

// light  = grey-beige block on white cards (default)
// gold   = hints at a price or a gold badge
// maroon = hints at a maroon button or link
// dark   = for blocks placed directly on the maroon page background
const TONE_CLASS: Record<SkeletonTone, string> = {
  light: "",
  gold: "skeleton-gold",
  maroon: "skeleton-maroon",
  dark: "skeleton-dark",
};

// Atom: one shimmering placeholder block. It is a <span> so it is valid anywhere, even inside <p>.
export function Skeleton({ className, tone = "light", style }: {
  className?: string;
  tone?: SkeletonTone;
  style?: CSSProperties;
}) {
  return <span aria-hidden="true" className={cn("skeleton", TONE_CLASS[tone], className)} style={style} />;
}

// Atom: placeholder lines for a paragraph. The last line is shorter so it reads like real text.
export function SkeletonText({ lines = 2, tone = "light", className, lineClassName = "h-3" }: {
  lines?: number;
  tone?: SkeletonTone;
  className?: string;
  lineClassName?: string;
}) {
  return (
    <span aria-hidden="true" className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} tone={tone} className={cn(lineClassName, lines > 1 && i === lines - 1 ? "w-3/5" : "w-full")} />
      ))}
    </span>
  );
}

// Molecule: wraps a skeleton layout, fades it in, and tells screen readers what is loading.
export function SkeletonRegion({ label, className, children }: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" className={cn("skeleton-enter", className)}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

// Delays the shimmer a little more for each card, so a list shimmers in a wave instead of all at once.
export function waveDelay(index: number, stepMs = 140): CSSProperties {
  return { ["--skeleton-delay" as string]: `${index * stepMs}ms` };
}
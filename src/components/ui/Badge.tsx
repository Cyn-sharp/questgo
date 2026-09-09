import { cn } from "@/lib/utils/cn";
import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: "gold" | "maroon" | "muted";
};

export function Badge({ className, tone = "gold", ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        tone === "gold" && "bg-parchment text-maroon",
        tone === "maroon" && "bg-[#fff0f0] text-maroon",
        tone === "muted" && "bg-[#f3f1ec] text-muted",
        className
      )}
      {...props}
    />
  );
}
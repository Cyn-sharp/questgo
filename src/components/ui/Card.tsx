import { cn } from "@/lib/utils/cn";
import { HTMLAttributes } from "react";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-white shadow-[0_2px_8px_rgb(0,0,0,0.05)]",
        className
      )}
      {...props}
    />
  );
}
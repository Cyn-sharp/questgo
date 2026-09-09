import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-60",
        variant === "primary" &&
          "bg-maroon text-white hover:bg-maroon-dark hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(122,31,50,0.35)]",
        variant === "outline" &&
          "bg-white text-maroon border-[1.5px] border-maroon hover:bg-cream hover:-translate-y-0.5",
        variant === "ghost" && "bg-transparent text-maroon hover:bg-cream",
        size === "sm" && "px-4 py-2 text-sm",
        size === "md" && "px-6 py-3 text-[15px]",
        size === "lg" && "px-7 py-4 text-base",
        className
      )}
      {...props}
    />
  );
}
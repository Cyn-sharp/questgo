import Image from "next/image";
import { cn } from "@/lib/utils/cn";

// Atom: the QuestGo logo and wordmark used in every header.
export function BrandMark({ subtitle = true, className }: { subtitle?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-[10px] object-contain" priority />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[19px] font-bold tracking-tight text-white">QuestGo</span>
        {subtitle && (
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">CIT-U Campus</span>
        )}
      </span>
    </span>
  );
}

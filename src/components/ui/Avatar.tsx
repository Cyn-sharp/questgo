import Image from "next/image";
import { cn } from "@/lib/utils/cn";

// Atom: a round profile picture, falling back to maroon initials.
export function avatarUrl(name: string, photoUrl?: string | null) {
  return photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=7a1f32&textColor=f6ecc8`;
}

export function Avatar({ name, src, size = 32, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  return (
    <Image
      src={avatarUrl(name, src)}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("shrink-0 rounded-full bg-maroon object-cover", className)}
      unoptimized
    />
  );
}

// Atom: a small red count for unread conversations. Screen readers get the
// count from the owning link's label instead, so this is hidden from them.
export function UnreadBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span aria-hidden className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold leading-none text-white ring-2 ring-white ${className}`}>
      {count > 9 ? "9+" : count}
    </span>
  );
}

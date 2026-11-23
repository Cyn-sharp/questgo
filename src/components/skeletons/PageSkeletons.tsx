import { Skeleton, SkeletonRegion, SkeletonText, waveDelay } from "@/components/ui/Skeleton";

// Each skeleton below copies the layout of the real page, so nothing jumps when the data arrives.

/* ─────────────────────────────────────────────────────────
   SHARED PIECES
───────────────────────────────────────────────────────── */
function PageHeaderSkeleton() {
  return (
    <div className="mb-6 max-w-2xl space-y-3 sm:mb-8">
      <Skeleton tone="dark" className="h-3 w-24" />
      <Skeleton tone="dark" className="h-8 w-72 max-w-full sm:h-10" />
      <Skeleton tone="dark" className="h-4 w-full max-w-xl" />
    </div>
  );
}

function FieldSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className={tall ? "h-28 w-full rounded-xl" : "h-12 w-full rounded-xl"} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   QUEST CARDS — Dashboard "Available Quests" + Quest Marketplace
───────────────────────────────────────────────────────── */
function QuestCardSkeleton({ index, withDescription }: { index: number; withDescription: boolean }) {
  return (
    <div
      style={waveDelay(index)}
      className="flex h-full flex-col rounded-2xl border border-white/15 bg-white/95 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.15)] backdrop-blur-md sm:p-6"
    >
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-4 w-14" />
      </div>
      <Skeleton className="mb-2 h-5 w-4/5 sm:h-6" />
      {withDescription && <SkeletonText lines={2} className="mb-4" />}
      <div className="mb-4 flex items-end gap-2 sm:mb-5">
        <Skeleton tone="gold" className="h-8 w-20 sm:h-9 sm:w-24" />
        <Skeleton className="mb-1 h-3 w-24" />
      </div>
      {withDescription && <SkeletonText lines={2} lineClassName="h-3.5" className="mb-4 w-3/4" />}
      <div className="mb-4 flex flex-grow flex-col gap-2.5 sm:mb-5">
        <Skeleton className="h-3 w-3/4" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="ml-auto mt-1 h-3.5 w-12" />
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#e5e0d8] pt-3 sm:pt-4">
        <Skeleton tone="gold" className="h-5 w-24 rounded-full" />
        <Skeleton tone="maroon" className="h-8 w-24 rounded-lg sm:h-9" />
      </div>
    </div>
  );
}

export function QuestGridSkeleton({ count = 3, withDescription = false }: { count?: number; withDescription?: boolean }) {
  return (
    <SkeletonRegion label="Loading quests" className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <QuestCardSkeleton key={i} index={i} withDescription={withDescription} />
      ))}
    </SkeletonRegion>
  );
}

/* ─────────────────────────────────────────────────────────
   QUEST DETAILS — /quests/viewquest and /quests/active
───────────────────────────────────────────────────────── */
export function QuestDetailSkeleton() {
  return (
    <SkeletonRegion label="Loading quest details" className="page-container max-w-4xl py-8">
      <Skeleton tone="dark" className="h-4 w-36" />
      <div className="mt-5 space-y-5 rounded-2xl border border-border bg-white p-6 shadow-[0_2px_8px_rgb(0,0,0,0.05)] sm:p-8">
        <div className="flex flex-wrap justify-between gap-3">
          <Skeleton tone="gold" className="h-6 w-24 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-8 w-3/4 sm:h-9" />
        <div className="space-y-2 rounded-xl bg-amber-50 p-4">
          <Skeleton tone="gold" className="h-3.5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <SkeletonText lines={3} lineClassName="h-3.5" />
        <div className="rounded-xl border p-4">
          <Skeleton className="mb-3 h-5 w-40" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-36 max-w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-3">
          <Skeleton tone="gold" className="h-8 w-24" />
          <Skeleton className="mb-1 h-3 w-48 max-w-[50%]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40 max-w-full" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <Skeleton tone="maroon" className="h-12 w-40 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/* ─────────────────────────────────────────────────────────
   MESSENGER — /messenger
───────────────────────────────────────────────────────── */
const BUBBLES = [
  { mine: false, width: "62%", lines: 2 },
  { mine: true, width: "46%", lines: 1 },
  { mine: false, width: "38%", lines: 1 },
  { mine: true, width: "68%", lines: 2 },
  { mine: false, width: "52%", lines: 1 },
];

export function MessengerSkeleton() {
  return (
    <SkeletonRegion label="Loading conversation" className="page-container max-w-4xl py-6">
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="space-y-3 border-b p-5">
          <Skeleton tone="maroon" className="h-4 w-28" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="h-[50vh] space-y-3 overflow-hidden p-5">
          {BUBBLES.map((bubble, i) => (
            <div key={i} style={waveDelay(i, 120)} className={bubble.mine ? "flex justify-end" : "flex justify-start"}>
              <div
                style={{ width: bubble.width }}
                className={`max-w-[85%] space-y-2 rounded-2xl px-4 py-3 ${bubble.mine ? "bg-cream" : "bg-gray-100"}`}
              >
                <Skeleton className="h-3 w-14" />
                <SkeletonText lines={bubble.lines} lineClassName="h-3.5" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-4">
          <Skeleton className="mb-3 h-3 w-56 max-w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton tone="maroon" className="h-12 w-20 rounded-xl" />
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}

/* ─────────────────────────────────────────────────────────
   PROFILE — /profile
───────────────────────────────────────────────────────── */
export function ProfileSkeleton() {
  return (
    <SkeletonRegion label="Loading your profile" className="page-container py-6 sm:py-10 lg:py-12">
      <section className="relative mb-4 rounded-2xl border border-white/40 bg-white/95 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-md sm:mb-5">
        <div className="h-16 rounded-t-2xl bg-gradient-to-br from-[#7a1f32] via-[#5f1727] to-[#380913] sm:h-20" />
        <div className="relative rounded-b-2xl bg-white px-5 pb-5 pt-10 sm:px-6 sm:pb-6 sm:pt-12">
          <div className="relative -mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <Skeleton className="h-20 w-20 shrink-0 rounded-full border-4 border-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] sm:h-24 sm:w-24" />
              <div className="space-y-2 sm:pb-1">
                <Skeleton className="h-6 w-44 sm:h-7 sm:w-56" />
                <Skeleton className="h-4 w-52" />
              </div>
            </div>
            <Skeleton tone="maroon" className="h-10 w-full rounded-xl sm:mb-1 sm:w-36" />
          </div>
        </div>
      </section>

      <div className="mb-4 grid grid-cols-3 gap-2.5 sm:mb-5 sm:gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            style={waveDelay(i)}
            className="rounded-2xl border border-white/40 bg-white/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md sm:p-5"
          >
            <Skeleton className="mb-2 h-8 w-8 rounded-lg sm:mb-3 sm:h-10 sm:w-10" />
            <Skeleton tone={i === 2 ? "gold" : "light"} className="h-6 w-12 sm:h-8 sm:w-16" />
            <Skeleton className="mt-2 h-3 w-16 max-w-full" />
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-[0_12px_32px_rgba(0,0,0,0.15)] backdrop-blur-md">
        <ul className="divide-y divide-[#e5e0d8]">
          {Array.from({ length: 7 }, (_, i) => (
            <li key={i} style={waveDelay(i, 90)} className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl sm:h-11 sm:w-11" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
              <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
            </li>
          ))}
        </ul>
      </section>
    </SkeletonRegion>
  );
}

/* ─────────────────────────────────────────────────────────
   MY QUESTS — /requests
───────────────────────────────────────────────────────── */
export function MyQuestsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonRegion label="Loading your quests" className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={waveDelay(i)}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton tone="maroon" className="h-7 w-16" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <div className="grid gap-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
          <Skeleton tone="maroon" className="mt-auto h-11 w-full rounded-xl" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

/* ─────────────────────────────────────────────────────────
   MESSAGE ARCHIVE — /profile/archive
───────────────────────────────────────────────────────── */
export function ArchiveListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonRegion label="Loading archived quests" className="mt-3 space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={waveDelay(i)} className="space-y-3 rounded-xl bg-gray-100 p-5">
          <div className="flex flex-wrap justify-between gap-2">
            <Skeleton className="h-5 w-48 max-w-[60%] bg-gray-200" />
            <Skeleton className="h-4 w-28 bg-gray-200" />
          </div>
          <Skeleton className="h-3.5 w-40 bg-gray-200" />
          <Skeleton tone="maroon" className="h-3.5 w-32" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

/* ─────────────────────────────────────────────────────────
   POST A QUEST — /post-quest (while checking for an active quest)
───────────────────────────────────────────────────────── */
export function PostQuestSkeleton() {
  return (
    <SkeletonRegion label="Checking your account" className="page-container py-6 sm:py-10 lg:py-12">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-8 rounded-2xl border border-white/40 bg-white/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-md sm:p-8 lg:col-span-8">
          <div className="space-y-4">
            <Skeleton tone="maroon" className="h-3 w-36" />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton tall />
          </div>
          <div className="space-y-4">
            <Skeleton tone="maroon" className="h-3 w-28" />
            <FieldSkeleton />
          </div>
          <div className="space-y-4">
            <Skeleton tone="maroon" className="h-3 w-32" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </div>
          <Skeleton tone="maroon" className="h-12 w-full rounded-xl" />
        </div>
        <div className="space-y-4 rounded-2xl border border-white/40 bg-white/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-md sm:p-6 lg:col-span-4">
          <Skeleton className="h-5 w-44" />
          <div className="space-y-2 rounded-xl border border-[#f0e0a8] bg-[#fbf6e4] p-4">
            <Skeleton tone="gold" className="h-3 w-40" />
            <SkeletonText lines={2} />
          </div>
          <div className="space-y-2 rounded-xl border border-[#e5e0d8] bg-white p-4">
            <Skeleton className="h-3 w-32" />
            <SkeletonText lines={2} />
          </div>
          <Skeleton tone="maroon" className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/* ─────────────────────────────────────────────────────────
   QUEST ACTIVITY — /quests/activity
───────────────────────────────────────────────────────── */
function ActivityRows({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={waveDelay(i, 100)} className="space-y-2 border-b py-3">
          <Skeleton className="h-4 w-56 max-w-full" />
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </>
  );
}

// Just the event rows, shown inside the real page while the history loads.
export function ActivityEventsSkeleton() {
  return (
    <SkeletonRegion label="Loading quest activity">
      <ActivityRows />
    </SkeletonRegion>
  );
}

// The whole page, shown while the route itself is still loading.
export function ActivitySkeleton() {
  return (
    <SkeletonRegion label="Loading quest activity" className="page-container py-8">
      <div className="space-y-4 rounded-xl bg-white p-6">
        <Skeleton tone="maroon" className="h-4 w-28" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-3.5 w-full max-w-lg" />
        <div>
          <ActivityRows />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/* ─────────────────────────────────────────────────────────
   MESSAGES PANEL — the floating "Messages" inbox
───────────────────────────────────────────────────────── */
export function InboxSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonRegion label="Loading messages" className="mt-3 space-y-2">
      <Skeleton className="h-3 w-28" />
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={waveDelay(i, 110)} className="space-y-2 rounded-lg bg-amber-50 p-3">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </SkeletonRegion>
  );
}
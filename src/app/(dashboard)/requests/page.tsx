"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  Navigation,
  CheckCircle2,
  XCircle,
  Timer,
  MessageCircle,
  Star,
  Ban,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────────────────────── */
function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  variant = "fade-up" as "fade-up" | "scale",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "fade-up" | "scale";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${variant === "scale" ? "reveal-scale" : "reveal"} ${className}`}
      style={{ ["--reveal-delay" as string]: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TYPES & MOCK DATA
───────────────────────────────────────────────────────── */
type RequestStatus = "active" | "completed" | "expired" | "cancelled";
type RequestState =
  | "waiting"
  | "in_progress"
  | "completed"
  | "expired"
  | "cancelled";

type QuestRequest = {
  id: number;
  title: string;
  price: string;
  pickup: string;
  payment: string;
  tab: RequestStatus;
  state: RequestState;
  timeRemaining?: string;
  runnerName?: string;
  runnerAvatar?: string;
  completedAt?: string;
};

const TABS: { key: RequestStatus; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "expired", label: "Expired" },
  { key: "cancelled", label: "Cancelled" },
];

const MOCK_REQUESTS: QuestRequest[] = [
  {
    id: 1,
    title: "Print CPE Module",
    price: "30",
    pickup: "Library",
    payment: "COD",
    tab: "active",
    state: "waiting",
    timeRemaining: "24:31",
  },
  {
    id: 2,
    title: "Pick Up Document",
    price: "50",
    pickup: "Main Campus",
    payment: "COD",
    tab: "active",
    state: "in_progress",
    runnerName: "John Doe",
    runnerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  },
  {
    id: 3,
    title: "Deliver Lunch",
    price: "45",
    pickup: "Cafeteria",
    payment: "COD",
    tab: "active",
    state: "completed",
    runnerName: "Ana Reyes",
    completedAt: "2 hours ago",
  },
  {
    id: 4,
    title: "Buy Notebooks",
    price: "35",
    pickup: "Campus Store",
    payment: "COD",
    tab: "completed",
    state: "completed",
    runnerName: "Mark Santos",
    completedAt: "Yesterday",
  },
  {
    id: 5,
    title: "Print Lab Report",
    price: "40",
    pickup: "CPE Lab",
    payment: "COD",
    tab: "expired",
    state: "expired",
  },
  {
    id: 6,
    title: "Return USB Drive",
    price: "20",
    pickup: "N-Building",
    payment: "COD",
    tab: "cancelled",
    state: "cancelled",
  },
];

/* ─────────────────────────────────────────────────────────
   STATUS UI HELPERS
───────────────────────────────────────────────────────── */
function StatusBadge({ state }: { state: RequestState }) {
  if (state === "waiting") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8c96a] bg-[#fbf6e4] px-3 py-1 text-xs font-semibold text-[#8a6a1f]">
        <Clock className="w-3.5 h-3.5" />
        Waiting for Runner
      </span>
    );
  }

  if (state === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7a1f32] px-3 py-1 text-xs font-semibold text-white">
        <Navigation className="w-3.5 h-3.5" />
        In Progress
      </span>
    );
  }

  if (state === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f8ee] px-3 py-1 text-xs font-semibold text-[#1f9d57]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Completed
      </span>
    );
  }

  if (state === "expired") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f2ef] px-3 py-1 text-xs font-semibold text-[#4a4340]">
        <Timer className="w-3.5 h-3.5" />
        Expired
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdecec] px-3 py-1 text-xs font-semibold text-[#b42318]">
      <XCircle className="w-3.5 h-3.5" />
      Cancelled
    </span>
  );
}

function RequestIcon({ state }: { state: RequestState }) {
  if (state === "waiting") {
    return (
      <div className="w-12 h-12 rounded-xl bg-[#f6f0e8] flex items-center justify-center shrink-0">
        <Clock className="w-5 h-5 text-[#7a1f32]" />
      </div>
    );
  }

  if (state === "in_progress") {
    return (
      <div className="w-12 h-12 rounded-xl bg-[#fbf0d6] flex items-center justify-center shrink-0">
        <Navigation className="w-5 h-5 text-[#c9a227]" />
      </div>
    );
  }

  if (state === "completed") {
    return (
      <div className="w-12 h-12 rounded-xl bg-[#e7f8ee] flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-5 h-5 text-[#1f9d57]" />
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="w-12 h-12 rounded-xl bg-[#f4f2ef] flex items-center justify-center shrink-0">
        <Timer className="w-5 h-5 text-[#4a4340]" />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-xl bg-[#fdecec] flex items-center justify-center shrink-0">
      <Ban className="w-5 h-5 text-[#b42318]" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   REQUEST ROW CARD
───────────────────────────────────────────────────────── */
function RequestCard({
  request,
  onCancel,
}: {
  request: QuestRequest;
  onCancel: (id: number) => void;
}) {
  return (
    <article
      className="
        group shine-wrap card-interactive card-surface
        p-4 sm:p-5
        hover:shadow-[0_14px_36px_rgba(122,31,50,0.12)]
      "
    >
      <div className="relative z-[1] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: icon + details */}
        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
          <RequestIcon state={request.state} />

          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-[#161414] truncate">
              {request.title}
            </h3>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-bold text-[#c9a227]">₱{request.price}</span>

              {request.state === "completed" && request.runnerName ? (
                <>
                  <span className="text-[#d8d3cc]">•</span>
                  <span className="text-[#4a4340]">
                    Runner:{" "}
                    <span className="font-medium text-[#161414]">
                      {request.runnerName}
                    </span>
                  </span>
                  {request.completedAt && (
                    <>
                      <span className="text-[#d8d3cc]">•</span>
                      <span className="text-[#4a4340]">
                        Completed {request.completedAt}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[#d8d3cc]">•</span>
                  <span className="text-[#4a4340]">
                    Pickup: {request.pickup}
                  </span>
                  <span className="text-[#d8d3cc]">•</span>
                  <span className="text-[#4a4340]">{request.payment}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Middle: runner / timer / status */}
        <div className="flex flex-wrap items-center gap-3 lg:justify-center lg:px-4">
          {request.state === "waiting" && request.timeRemaining && (
            <div className="flex flex-col items-start sm:items-center gap-1.5">
              <StatusBadge state={request.state} />
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c9a227]">
                <Timer className="w-3.5 h-3.5" />
                {request.timeRemaining} remaining
              </div>
            </div>
          )}

          {request.state === "in_progress" && (
            <div className="flex flex-wrap items-center gap-3">
              {request.runnerName && (
                <div className="flex items-center gap-2.5">
                  <Image
                    src={
                      request.runnerAvatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.runnerName}`
                    }
                    alt={request.runnerName}
                    width={36}
                    height={36}
                    className="rounded-full bg-[#f4f2ef] shrink-0"
                    unoptimized
                  />
                  <div className="leading-tight">
                    <p className="text-[11px] text-[#4a4340]">Runner Assigned</p>
                    <p className="text-sm font-semibold text-[#161414]">
                      {request.runnerName}
                    </p>
                  </div>
                </div>
              )}
              <StatusBadge state={request.state} />
            </div>
          )}

          {(request.state === "completed" ||
            request.state === "expired" ||
            request.state === "cancelled") && (
            <StatusBadge state={request.state} />
          )}
        </div>

        {/* Right: action button */}
        <div className="flex items-center lg:justify-end shrink-0">
          {request.state === "waiting" && (
            <button
              type="button"
              onClick={() => onCancel(request.id)}
              className="
                px-4 py-2.5 rounded-xl border border-[#e5e0d8] bg-white
                text-sm font-semibold text-[#4a4340]
                hover:border-[#7a1f32] hover:text-[#7a1f32]
                transition-all duration-300
              "
            >
              Cancel Quest
            </button>
          )}

          {request.state === "in_progress" && (
            <Link
              href="/messenger"
              className="
                inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                bg-[#7a1f32] text-white text-sm font-semibold
                hover:bg-[#5f1727] transition-all duration-300
                shadow-[0_8px_18px_rgba(122,31,50,0.22)]
              "
            >
              <MessageCircle className="w-4 h-4" />
              Open Chat
            </Link>
          )}

          {/* UPDATED: Link directly to /requests/rate */}
          {request.state === "completed" && (
            <Link
              href="/requests/rate"
              className="
                inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                border border-[#7a1f32] text-[#7a1f32] bg-white
                text-sm font-semibold
                hover:bg-[#7a1f32] hover:text-white
                transition-all duration-300
              "
            >
              <Star className="w-4 h-4" />
              Rate Quest Runner
            </Link>
          )}

          {(request.state === "expired" || request.state === "cancelled") && (
            <Link
              href="/post-quest"
              className="
                px-4 py-2.5 rounded-xl bg-[#7a1f32] text-white
                text-sm font-semibold hover:bg-[#5f1727]
                transition-all duration-300
              "
            >
              Post Again
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState<RequestStatus>("active");
  const [requests, setRequests] = useState<QuestRequest[]>(MOCK_REQUESTS);

  const filtered = useMemo(() => {
    if (activeTab === "active") {
      return requests.filter(
        (r) =>
          r.tab === "active" ||
          (r.state === "completed" && r.tab === "active")
      );
    }
    return requests.filter((r) => r.tab === activeTab);
  }, [activeTab, requests]);

  const counts = useMemo(() => {
    return {
      active: requests.filter((r) => r.tab === "active").length,
      completed: requests.filter((r) => r.tab === "completed").length,
      expired: requests.filter((r) => r.tab === "expired").length,
      cancelled: requests.filter((r) => r.tab === "cancelled").length,
    };
  }, [requests]);

  function handleCancel(id: number) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, tab: "cancelled", state: "cancelled", timeRemaining: undefined }
          : r
      )
    );
  }

  return (
    <div className="bg-[#fbf8f0] min-h-full">
      <div className="page-container py-10 lg:py-12">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#161414] mb-2">
              My Quest Requests
            </h1>
            <p className="text-[#4a4340] text-base">
              Track, manage, and complete tasks that you have broadcasted
            </p>
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal delayMs={80}>
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
                    ${
                      isActive
                        ? "bg-[#7a1f32] text-white shadow-[0_8px_18px_rgba(122,31,50,0.25)]"
                        : "bg-white text-[#4a4340] border border-[#e5e0d8] hover:border-[#7a1f32] hover:text-[#7a1f32]"
                    }
                  `}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 text-[11px] ${
                      isActive ? "text-white/80" : "text-[#4a4340]/60"
                    }`}
                  >
                    ({counts[tab.key]})
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* List */}
        {filtered.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filtered.map((request, i) => (
              <ScrollReveal
                key={request.id}
                delayMs={i * 70}
                variant="scale"
              >
                <RequestCard request={request} onCancel={handleCancel} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal>
            <div className="card-surface p-10 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[#f6f0e8] flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-[#7a1f32]" />
              </div>
              <p className="text-lg font-bold text-[#161414] mb-2">
                No {activeTab} requests
              </p>
              <p className="text-sm text-[#4a4340] mb-5 max-w-md mx-auto">
                {activeTab === "active"
                  ? "You don’t have any active quests right now. Broadcast a task to get started."
                  : `You don’t have any ${activeTab} quests yet.`}
              </p>
              {activeTab === "active" && (
                <Link href="/post-quest" className="btn-primary">
                  Post a Quest
                </Link>
              )}
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
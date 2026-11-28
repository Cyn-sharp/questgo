"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, MessageCircle, Plus, Search } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { StatusBadge } from "@/components/quest/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useMyQuests, useQuestClock } from "@/hooks/useQuests";
import { getProfileName } from "@/lib/auth/profile-name";
import { getQuestExpirationMillis } from "@/lib/db/quests";
import { timestampMillis } from "@/lib/quests/conversations";
import { questNextStep } from "@/lib/quests/progress";
import type { Quest } from "@/types/quest";

const ONGOING_STATUSES = new Set(["accepted", "in_progress", "settlement"]);

function statusPriority(status: string) {
  if (status === "settlement") return 0;
  if (status === "in_progress") return 1;
  if (status === "accepted") return 2;
  return 3;
}

export default function DashboardHero() {
  const { user } = useAuth();
  const { posted, running, loading } = useMyQuests();
  const now = useQuestClock();
  const firstName = user ? getProfileName(user.displayName).split(/\s+/)[0] : "Wildcat";

  const isLive = (quest: Quest) =>
    ONGOING_STATUSES.has(quest.status) ||
    (quest.status === "available" && (getQuestExpirationMillis(quest) ?? 0) > now);

  const liveQuests = [...new Map([...running, ...posted].map((quest) => [quest.id, quest])).values()]
    .filter(isLive)
    .sort((a, b) => {
      const priorityDiff = statusPriority(a.status) - statusPriority(b.status);
      if (priorityDiff !== 0) return priorityDiff;
      const aTime = timestampMillis(a.updatedAt ?? a.acceptedAt ?? a.createdAt);
      const bTime = timestampMillis(b.updatedAt ?? b.acceptedAt ?? b.createdAt);
      return bTime - aTime;
    });

  const primary = liveQuests[0];
  const others = liveQuests.slice(1);

  if (loading) {
    return (
      <section className="bg-transparent pt-5 pb-2 sm:pt-6">
        <div className="page-container">
          <div className="h-[260px] animate-pulse rounded-2xl border border-white/15 bg-dark/80 sm:rounded-3xl" />
        </div>
      </section>
    );
  }

  if (primary) {
    const requester = primary.requesterId === user?.uid;
    const activeHref = `/quests/active?id=${encodeURIComponent(primary.id)}`;
    const chatHref = `/messenger?id=${encodeURIComponent(primary.id)}`;
    const canChat = ONGOING_STATUSES.has(primary.status);
    const trackable = requester && ["accepted", "in_progress"].includes(primary.status);
    const partnerName = requester ? primary.runnerName : primary.requesterName;

    return (
      <section className="bg-transparent pt-5 pb-2 sm:pt-6">
        <div className="page-container">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-dark p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.4)] sm:rounded-3xl sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(122,31,50,0.55)_0%,transparent_60%),radial-gradient(circle_at_100%_0%,rgba(201,162,39,0.16)_0%,transparent_45%)]" />

              <div className="relative z-10 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-gold-bright">
                      {requester ? "Your active request" : "You're running"}
                    </span>
                    <StatusBadge status={primary.status} />
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Link
                      href="/quests"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-white/85 transition hover:border-gold/40 hover:bg-white/10"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Find Quest
                    </Link>
                    <Link
                      href="/post-quest"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-white/85 transition hover:border-gold/40 hover:bg-white/10"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Post Quest
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <h1 className="break-words text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                      {primary.title}
                    </h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-cream/85 sm:text-base">
                      {questNextStep(primary, requester)}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs font-medium text-parchment/85 sm:text-sm">
                      <span className="font-bold text-gold-bright">
                        ₱{Number(primary.reward || 0).toLocaleString()} reward
                      </span>
                      {primary.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gold-bright" />
                          {primary.location}
                          {primary.meetUpPoint ? ` → ${primary.meetUpPoint}` : ""}
                        </span>
                      )}
                      {partnerName && (
                        <span>
                          {requester ? "Runner" : "Requester"}:{" "}
                          <strong className="text-white">{partnerName}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:shrink-0">
                    <Link
                      href={activeHref}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-[15px] font-bold text-dark shadow-[0_4px_20px_rgba(201,162,39,0.3)] transition hover:bg-[#b08b1e] active:scale-[0.98]"
                    >
                      Open Quest
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    {canChat && (
                      <Link
                        href={chatHref}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-gold hover:bg-white/15 active:scale-[0.98]"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </Link>
                    )}

                    {trackable && (
                      <Link
                        href={`${activeHref}#runner-map`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-gold hover:bg-white/10 active:scale-[0.98]"
                      >
                        <MapPin className="h-4 w-4" />
                        Track Runner
                      </Link>
                    )}
                  </div>
                </div>

                {others.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white/60">
                      Other ongoing quests ({others.length})
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {others.map((quest) => {
                        const isReq = quest.requesterId === user?.uid;
                        return (
                          <Link
                            key={quest.id}
                            href={`/quests/active?id=${encodeURIComponent(quest.id)}`}
                            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 transition hover:border-gold/40 hover:bg-white/10"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{quest.title}</p>
                              <p className="text-[11px] text-white/65">
                                {isReq ? "Your request" : "Running"} ·{" "}
                                {quest.status.replaceAll("_", " ")}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 shrink-0 text-gold-bright" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-transparent pt-5 pb-2 sm:pt-6">
      <div className="page-container">
        <ScrollReveal>
          <div className="relative grid overflow-hidden rounded-2xl border border-white/15 bg-dark shadow-[0_20px_60px_rgba(0,0,0,0.4)] sm:rounded-3xl md:grid-cols-[1.35fr_1fr]">
            {/* Photo: a banner strip on mobile, a side panel on desktop */}
            <div className="relative h-36 sm:h-44 md:order-last md:h-auto md:min-h-[260px]">
              <Image
                src="/images/citu-students.jpg"
                alt="CIT-U students on campus"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover object-[center_35%]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/30 to-transparent md:hidden" />
              <div className="absolute inset-0 hidden bg-gradient-to-r from-dark via-dark/35 to-transparent md:block" />
            </div>

            <div className="relative z-10 flex flex-col justify-center gap-4 p-6 sm:p-8 md:p-10">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_0%_0%,rgba(122,31,50,0.55)_0%,transparent_60%)]" />
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-gold-bright" />
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-parchment">
                  Welcome back, {firstName}
                </span>
              </span>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                Turn tasks into <span className="text-gold-bright">opportunities</span>
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-cream/80 sm:text-base">
                Help a fellow Wildcat, complete a quest, and earn extra cash on campus. Simple, secure, and cash-on-delivery.
              </p>
              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <Link
                  href="/quests"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-[15px] font-bold text-dark shadow-[0_4px_20px_rgba(201,162,39,0.3)] transition-all duration-200 hover:bg-[#b08b1e] active:scale-[0.98]"
                >
                  Find a Quest
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/post-quest"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 px-6 py-3 text-[15px] font-semibold text-white transition-all duration-200 hover:border-gold hover:bg-white/10 active:scale-[0.98]"
                >
                  Post a Quest
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
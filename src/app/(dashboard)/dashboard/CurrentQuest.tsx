"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { useMyQuests, useQuestClock } from "@/hooks/useQuests";
import { getQuestExpirationMillis } from "@/lib/db/quests";
import { questNextStep } from "@/lib/quests/progress";
import type { Quest } from "@/types/quest";

const ONGOING = ["accepted", "in_progress", "settlement"];
const STATUS_LABEL: Record<string, string> = {
  available: "Waiting for a runner",
  accepted: "Accepted",
  in_progress: "In progress",
  settlement: "Needs settlement",
};

// The one thing a returning user most needs: where their current quest stands.
export default function CurrentQuest() {
  const { posted, running, loading } = useMyQuests();
  const now = useQuestClock();
  if (loading) return null;

  const live = (quest: Quest) =>
    ONGOING.includes(quest.status) || (quest.status === "available" && (getQuestExpirationMillis(quest) ?? 0) > now);
  const runningQuest = running.find(live);
  const postedQuest = posted.find(live);
  const quest = runningQuest ?? postedQuest;
  if (!quest) return null;

  const requester = quest === postedQuest;
  const trackable = requester && ["accepted", "in_progress"].includes(quest.status);
  const href = `/quests/active?id=${encodeURIComponent(quest.id)}`;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-[#c9a227]/40 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.15)] sm:flex-row sm:items-center sm:p-6">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
          <span className="text-[#7a1f32]">{requester ? "Your request" : "You're running"}</span>
          <span className="rounded-full bg-[#f6ecc8] px-2.5 py-0.5 text-[#8a6a1f]">{STATUS_LABEL[quest.status] ?? quest.status}</span>
        </div>
        <h2 className="truncate text-lg font-bold text-[#161414] sm:text-xl">{quest.title}</h2>
        <p className="text-sm text-[#4a4340]">{questNextStep(quest, requester)}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        {trackable && (
          <Link href={`${href}#runner-map`} className="inline-flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#7a1f32] px-4 py-2.5 text-sm font-semibold text-[#7a1f32] hover:bg-[#fbf8f0]">
            <MapPin className="h-4 w-4" /> Track runner
          </Link>
        )}
        <Link href={href} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7a1f32] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95">
          Open quest <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

"use client";


import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import QuestCard from "./QuestCard";
import {
  getQuestExpirationMillis,
} from "@/lib/db/quests";
import { useAvailableQuests, useQuestClock } from "@/hooks/useQuests";
import type { Quest as FirestoreQuest } from "@/types/quest";

type DisplayQuest = {
  id: string;
  category: string;
  timeLeft: string;
  title: string;
  price: string;
  location: string;
  distance: string;
  time: string;
  rating: string;
};

function formatTimeLeft(expiresAt: number): string {
  const secs = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function toDisplayQuest(q: FirestoreQuest): DisplayQuest | null {
  const expiresAt = getQuestExpirationMillis(q);
  if (!expiresAt || expiresAt <= Date.now()) return null;

  return {
    id: q.id,
    category: (q.category || "OTHER").toUpperCase(),
    timeLeft: formatTimeLeft(expiresAt),
    title: q.title,
    price: String(q.reward),
    location: q.location,
    distance: "On campus",
    time: q.preferredTime || "Not specified",
    rating: "New",
  };
}

export default function AvailableQuests() {
  const { records, isLoading, hasError, retry } = useAvailableQuests();
  const now = useQuestClock();
  const quests = records.filter((quest) => (getQuestExpirationMillis(quest) ?? 0) > now)
    .sort((a, b) => (getQuestExpirationMillis(b) ?? 0) - (getQuestExpirationMillis(a) ?? 0))
    .slice(0, 3).map(toDisplayQuest).filter((quest): quest is DisplayQuest => quest !== null);

  return (
    <section className="bg-transparent">
      <div className="page-container py-10 sm:py-12 lg:py-14">
        {hasError && <p role="alert" className="text-white">Unable to load quests. <button onClick={retry} className="underline">Retry</button></p>}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
          <ScrollReveal>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                Available Quests Near You
              </h2>
              <p className="text-xs sm:text-sm text-[#f6ecc8]/85">
                Active quests on campus waiting for a runner
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={100}>
            <Link
              href="/quests"
              className="text-[#c9a227] font-semibold text-sm inline-flex items-center gap-1 hover:underline shrink-0 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
            >
              See All Quests
              <ArrowRight className="w-4 h-4" />
            </Link>
          </ScrollReveal>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-[#f6ecc8]/70">
            Loading quests...
          </div>
        ) : quests.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <p className="text-[#f6ecc8]/85 text-sm sm:text-base">
              No available quests right now. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {quests.map((quest, i) => (
              <ScrollReveal
                key={quest.id}
                delayMs={i * 100}
                variant="scale"
                className="h-full"
              >
                <QuestCard {...quest} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
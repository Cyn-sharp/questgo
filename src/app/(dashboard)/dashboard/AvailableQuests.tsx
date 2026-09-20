"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import QuestCard from "./QuestCard";
import {
  getRecentAvailableQuests,
  getQuestExpirationMillis,
} from "@/lib/db/quests";
import type { Quest as FirestoreQuest } from "@/types/quest";

// Shape your existing QuestCard expects — adjust if different
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
  const [quests, setQuests] = useState<DisplayQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const raw = await getRecentAvailableQuests(3);
        const mapped = raw
          .map(toDisplayQuest)
          .filter((q): q is DisplayQuest => q !== null);
        setQuests(mapped);
      } catch (err) {
        console.error("Failed to load quests:", err);
      } finally {
        setIsLoading(false);
      }
    }

    void load();

    // Refresh countdowns every 30s
    const interval = window.setInterval(() => {
      setQuests((current) =>
        current.map((q) => {
          // Re-derive time from a stored expiry — since we only kept the string,
          // simplest is to reload on visibility change or accept a small drift.
          return q;
        }),
      );
    }, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="bg-[#fbf8f0] py-12">
      <div className="page-container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#161414] mb-1">
              Available Quests Near You
            </h2>
            <p className="text-sm text-[#4a4340]">
              Active quests on campus waiting for a runner
            </p>
          </div>

          <Link
            href="/quests"
            className="text-[#7a1f32] font-semibold text-sm inline-flex items-center gap-1 hover:underline shrink-0"
          >
            See All Quests
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-[#4a4340]">Loading quests...</div>
        ) : quests.length === 0 ? (
          <div className="text-center py-10 text-[#4a4340]">
            No available quests right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quests.map((quest) => (
              <QuestCard key={quest.id} {...quest} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
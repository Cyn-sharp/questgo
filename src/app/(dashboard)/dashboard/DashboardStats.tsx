"use client";

import { useEffect, useState } from "react";
import { Search, Clock, CheckSquare, Briefcase, type LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  getAvailableQuestsCount,
  getMyActiveRequestsCount,
  getCompletedQuestsCount,
  getQuestEarnings,
} from "@/lib/db/quests";

type StatConfig = {
  label: string;
  key: "available" | "active" | "completed" | "earnings";
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  prefix?: string;
};

const STAT_CONFIG: StatConfig[] = [
  {
    label: "Available Quests",
    key: "available",
    icon: Search,
    iconBg: "bg-[#fdf0f2]",
    iconColor: "text-[#7a1f32]",
  },
  {
    label: "My Active Requests",
    key: "active",
    icon: Clock,
    iconBg: "bg-[#fff5eb]",
    iconColor: "text-orange-600",
  },
  {
    label: "Completed Quests",
    key: "completed",
    icon: CheckSquare,
    iconBg: "bg-[#eefbf3]",
    iconColor: "text-green-600",
  },
  {
    label: "Quest Earnings",
    key: "earnings",
    icon: Briefcase,
    iconBg: "bg-[#f6ecc8]",
    iconColor: "text-[#c9a227]",
    prefix: "₱",
  },
];

export default function DashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    available: 0,
    active: 0,
    completed: 0,
    earnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const available = await getAvailableQuestsCount();

        if (user) {
          const [active, completed, earnings] = await Promise.all([
            getMyActiveRequestsCount(user.uid),
            getCompletedQuestsCount(user.uid),
            getQuestEarnings(user.uid),
          ]);
          setStats({ available, active, completed, earnings });
        } else {
          setStats({ available, active: 0, completed: 0, earnings: 0 });
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    }

    void loadStats();
  }, [user]);

  const formatValue = (key: StatConfig["key"], prefix?: string) => {
    if (isLoading) return "…";
    const value = stats[key];
    if (prefix) return `${prefix}${value.toLocaleString()}`;
    return String(value);
  };

  return (
    <section className="bg-transparent border-y border-white/10">
      <div className="page-container py-8 sm:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {STAT_CONFIG.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <ScrollReveal key={stat.label} delayMs={i * 80} variant="scale" className="h-full">
                <article
                  className="
                    group shine-wrap card-interactive h-full rounded-2xl border border-white/15
                    bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.15)]
                    hover:shadow-[0_18px_44px_rgba(0,0,0,0.35)]
                  "
                >
                  <div className="relative z-[1] flex items-center gap-3 sm:gap-4">
                    <div
                      className={`
                        w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0
                        transition-colors duration-500 ${stat.iconBg}
                      `}
                    >
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] sm:text-xs text-[#4a4340] font-medium truncate">
                        {stat.label}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-[#161414] leading-tight mt-0.5">
                        {formatValue(stat.key, stat.prefix)}
                      </p>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
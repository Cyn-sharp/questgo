"use client";

import { useEffect, useState } from "react";
import { Search, Clock, CheckSquare, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAvailableQuestsCount,
  getMyActiveRequestsCount,
  getCompletedQuestsCount,
  getQuestEarnings,
} from "@/lib/db/quests";

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

  const displayStats = [
    {
      label: "Available Quests",
      value: isLoading ? "…" : String(stats.available),
      icon: Search,
      iconBg: "bg-red-50",
      iconColor: "text-red-900",
    },
    {
      label: "My Active Requests",
      value: isLoading ? "…" : String(stats.active),
      icon: Clock,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-700",
    },
    {
      label: "Completed Quests",
      value: isLoading ? "…" : String(stats.completed),
      icon: CheckSquare,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Quest Earnings",
      value: isLoading ? "…" : `₱${stats.earnings.toLocaleString()}`,
      icon: Briefcase,
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
  ];

  return (
    <div className="bg-[#FAF9F5] py-12 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4"
            >
              <div className={`p-4 rounded-full ${stat.iconBg}`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
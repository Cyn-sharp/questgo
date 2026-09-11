import { Search, Clock, CheckSquare, Briefcase, type LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

type Stat = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  iconHoverBg: string;
};

const STATS: Stat[] = [
  {
    label: "Available Quests",
    value: "24",
    icon: Search,
    iconBg: "bg-[#fdf0f2]",
    iconColor: "text-maroon",
    iconHoverBg: "group-hover:bg-white/15",
  },
  {
    label: "My Active Requests",
    value: "3",
    icon: Clock,
    iconBg: "bg-[#fff5eb]",
    iconColor: "text-orange-600",
    iconHoverBg: "group-hover:bg-white/15",
  },
  {
    label: "Completed Quests",
    value: "47",
    icon: CheckSquare,
    iconBg: "bg-[#eefbf3]",
    iconColor: "text-green-600",
    iconHoverBg: "group-hover:bg-white/15",
  },
  {
    label: "Quest Earnings",
    value: "₱1,250",
    icon: Briefcase,
    iconBg: "bg-parchment",
    iconColor: "text-gold",
    iconHoverBg: "group-hover:bg-white/15",
  },
];

export default function DashboardStats() {
  return (
    <section className="bg-cream border-y border-border">
      <div className="page-container py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <ScrollReveal key={stat.label} delayMs={i * 100} variant="scale" className="h-full">
                {/* Informational tiles: shine + lift only (no maroon fill) */}
                <article
                  className="
                    group shine-wrap card-interactive h-full rounded-2xl border border-border
                    bg-white p-5 shadow-card
                    hover:shadow-[0_18px_44px_rgba(122,31,50,0.18)]
                  "
                >
                  <div className="relative z-[1] flex items-center gap-4">
                    <div
                      className={`
                        w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                        transition-colors duration-500
                        ${stat.iconBg}
                      `}
                    >
                      <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted font-medium truncate">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-dark leading-tight mt-0.5">
                        {stat.value}
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
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  Search,
  Clock,
  CheckSquare,
  Briefcase,
  MapPin,
  Navigation,
  Calendar,
  Star,
} from "lucide-react";

/* ───────────────── Quest Card ───────────────── */
interface QuestCardProps {
  category: string;
  timeLeft: string;
  title: string;
  price: string;
  location: string;
  distance: string;
  time: string;
  rating: string;
}

function QuestCard({
  category,
  timeLeft,
  title,
  price,
  location,
  distance,
  time,
  rating,
}: QuestCardProps) {
  return (
    <div className="card-surface p-6 flex flex-col h-full hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="bg-[#fdf0f2] text-maroon text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wide uppercase">
          {category}
        </span>
        <div className="flex items-center text-maroon text-sm font-semibold gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {timeLeft}
        </div>
      </div>

      {/* Title & Price */}
      <h3 className="text-lg font-bold text-dark mb-2">{title}</h3>
      <div className="flex items-end gap-2 mb-5">
        <span className="text-3xl font-extrabold text-gold">₱{price}</span>
        <span className="text-xs text-muted mb-1 font-medium">Cash on Delivery</span>
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-2.5 text-xs text-muted mb-5 flex-grow">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-subtle shrink-0" />
          {location}
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-subtle shrink-0" />
            {distance}
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-subtle shrink-0" />
            {time}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 text-dark font-bold text-sm pt-1">
          <Star className="w-3.5 h-3.5 text-gold fill-gold" />
          {rating}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
        <span className="badge-gold gap-1">
          <CheckCircle2 className="w-3 h-3" />
          CIT-U VERIFIED
        </span>
        <Link
          href="/quests/1"
          className="bg-maroon hover:bg-maroon-dark text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          View Quest
        </Link>
      </div>
    </div>
  );
}

/* ───────────────── Hero ───────────────── */
/* ───────────────── Hero ───────────────── */
function DashboardHero() {
  return (
    <section className="bg-white">
      <div className="page-container py-14 lg:py-16">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left copy */}
          <div className="flex-1 w-full space-y-6 animate-fade-up">
            <div className="badge-gold !text-[11px] !px-3.5 !py-1.5 tracking-wider uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Exclusive to Verified CIT-U Students
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold text-maroon leading-[1.12]">
              Turn Tasks Into
              <br />
              <span className="text-gold">Opportunities</span>
            </h1>

            <p className="text-muted text-base sm:text-lg max-w-md leading-relaxed">
              Help a fellow student, complete a quest, and earn extra cash on
              campus. Simple, secure, and cash-on-delivery.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/quests" className="btn-primary">
                Find a Quest
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/post-quest" className="btn-outline">
                Post a Quest
              </Link>
            </div>
          </div>

          {/* Right image — Official CIT-U Banner (.jpg) */}
          <div className="flex-1 w-full max-w-xl lg:max-w-none animate-fade-up delay-100">
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-card border border-border">
              <Image
                src="/images/citu-banner.jpg"
                alt="CIT-U Built Around You Banner"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
/* ───────────────── Stats ───────────────── */
function DashboardStats() {
  const stats = [
    {
      label: "Available Quests",
      value: "24",
      icon: Search,
      iconBg: "bg-[#fdf0f2]",
      iconColor: "text-maroon",
    },
    {
      label: "My Active Requests",
      value: "3",
      icon: Clock,
      iconBg: "bg-[#fff5eb]",
      iconColor: "text-orange-600",
    },
    {
      label: "Completed Quests",
      value: "47",
      icon: CheckSquare,
      iconBg: "bg-[#eefbf3]",
      iconColor: "text-green-600",
    },
    {
      label: "Quest Earnings",
      value: "₱1,250",
      icon: Briefcase,
      iconBg: "bg-parchment",
      iconColor: "text-gold",
    },
  ];

  return (
    <section className="bg-cream border-y border-border">
      <div className="page-container py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="card-surface p-5 flex items-center gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}
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
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────── Available Quests ───────────────── */
function AvailableQuests() {
  const MOCK_QUESTS = [
    {
      id: 1,
      category: "PRINTING",
      timeLeft: "29:42",
      title: "Print CPE Module",
      price: "30",
      location: "CIT-U Library",
      distance: "0.5 km away",
      time: "4:30 PM",
      rating: "4.8",
    },
    {
      id: 2,
      category: "PICKUP",
      timeLeft: "18:15",
      title: "Pick Up Document",
      price: "50",
      location: "Main Campus",
      distance: "0.3 km away",
      time: "5:00 PM",
      rating: "4.5",
    },
    {
      id: 3,
      category: "SHOPPING",
      timeLeft: "25:08",
      title: "Buy School Supplies",
      price: "40",
      location: "CIT-U Main Campus",
      distance: "0.7 km away",
      time: "6:00 PM",
      rating: "4.9",
    },
  ];

  return (
    <section className="bg-cream">
      <div className="page-container py-12 lg:py-14">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-dark mb-1">
              Available Quests Near You
            </h2>
            <p className="text-sm text-muted">
              Active quests on campus waiting for a runner
            </p>
          </div>
          <Link
            href="/quests"
            className="text-maroon font-semibold text-sm inline-flex items-center gap-1 hover:underline shrink-0"
          >
            See All Quests
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_QUESTS.map((quest) => (
            <QuestCard key={quest.id} {...quest} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────── Page ───────────────── */
export default function DashboardPage() {
  return (
    <div className="flex flex-col w-full">
      <DashboardHero />
      <DashboardStats />
      <AvailableQuests />
    </div>
  );
}
import Link from "next/link";
import {
  Clock,
  MapPin,
  Navigation,
  Calendar,
  Star,
  CheckCircle2,
} from "lucide-react";

interface QuestCardProps {
  id?: string | number;
  category: string;
  timeLeft: string;
  title: string;
  price: string;
  location: string;
  distance: string;
  time: string;
  rating: string;
}

export default function QuestCard({
  id = 1,
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
    <article
      className="
        group shine-wrap card-interactive h-full rounded-2xl border border-white/15
        bg-white p-5 sm:p-6 shadow-[0_8px_24px_rgba(0,0,0,0.15)] flex flex-col
        hover:shadow-[0_18px_44px_rgba(0,0,0,0.35)]
        hover:bg-maroon-dark hover:border-gold/50
      "
    >
      <div className="relative z-[1] flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <span
            className="
              bg-[#fdf0f2] text-maroon text-xs sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-md
              tracking-wide uppercase transition-colors duration-500
              group-hover:bg-white/15 group-hover:text-gold-bright
            "
          >
            {category}
          </span>
          <div
            className="
              flex items-center text-maroon text-xs sm:text-sm font-semibold gap-1.5
              transition-colors duration-500 group-hover:text-gold-bright
            "
          >
            <Clock className="w-3.5 h-3.5" />
            {timeLeft}
          </div>
        </div>

        {/* Title & Price */}
        <h3 className="text-base sm:text-lg font-bold text-dark mb-2 transition-colors duration-500 group-hover:text-white">
          {title}
        </h3>
        <div className="flex items-end gap-2 mb-4 sm:mb-5">
          <span className="text-2xl sm:text-3xl font-extrabold text-gold-ink group-hover:text-gold-bright">
            ₱{price}
          </span>
          <span className="text-xs sm:text-xs text-muted mb-1 font-medium transition-colors duration-500 group-hover:text-white/70">
            Cash on Delivery
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-2 sm:gap-2.5 text-xs sm:text-xs text-muted mb-4 sm:mb-5 flex-grow transition-colors duration-500 group-hover:text-white/75">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-subtle group-hover:text-gold-bright transition-colors duration-500" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 shrink-0 text-subtle group-hover:text-gold-bright transition-colors duration-500" />
              {distance}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-subtle group-hover:text-gold-bright transition-colors duration-500" />
              {time}
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 text-dark font-bold text-xs sm:text-sm pt-1 transition-colors duration-500 group-hover:text-white">
            <Star className="w-3.5 h-3.5 text-gold-star fill-gold-star group-hover:text-gold-bright group-hover:fill-gold-bright" />
            {rating}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 sm:pt-4 border-t border-border transition-colors duration-500 group-hover:border-white/20">
          <span
            className="
              inline-flex items-center gap-1 rounded-full bg-parchment text-maroon
              px-2 py-1 text-xs sm:text-xs font-bold tracking-wide
              transition-colors duration-500
              group-hover:bg-white/15 group-hover:text-gold-bright
            "
          >
            <CheckCircle2 className="w-3 h-3" />
            <span className="hidden sm:inline">CIT-U VERIFIED</span>
            <span className="sm:hidden">VERIFIED</span>
          </span>
          <Link
            href={`/quests/viewquest?id=${encodeURIComponent(id)}`}
            className="
              bg-maroon text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg
              transition-all duration-300 active:scale-95
              group-hover:bg-white group-hover:text-maroon
              hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]
            "
          >
            View Quest
          </Link>
        </div>
      </div>
    </article>
  );
}
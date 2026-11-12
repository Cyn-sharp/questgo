import Link from "next/link";
import {
  Clock,
  MapPin,
  Navigation,
  Calendar,
  Star,
  CheckCircle2,
} from "lucide-react";

export type QuestCardProps = {
  id: number | string;
  category: string;
  timeLeft: string;
  title: string;
  price: string;
  location: string;
  distance: string;
  time: string;
  rating: string;
};

export default function QuestCard({
  id,
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
        group shine-wrap card-interactive h-full rounded-2xl border border-border
        bg-white p-6 shadow-card flex flex-col
        hover:shadow-[0_18px_44px_rgba(122,31,50,0.18)]
        hover:bg-maroon hover:border-maroon
      "
    >
      <div className="relative z-[1] flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <span
            className="
              bg-[#fdf0f2] text-maroon text-[11px] font-bold px-2.5 py-1 rounded-md
              tracking-wide uppercase transition-colors duration-500
              group-hover:bg-white/15 group-hover:text-gold
            "
          >
            {category}
          </span>
          <div
            className="
              flex items-center text-maroon text-sm font-semibold gap-1.5
              transition-colors duration-500 group-hover:text-gold
            "
          >
            <Clock className="w-3.5 h-3.5" />
            {timeLeft}
          </div>
        </div>

        {/* Title & Price */}
        <h3 className="text-lg font-bold text-dark mb-2 transition-colors duration-500 group-hover:text-white">
          {title}
        </h3>
        <div className="flex items-end gap-2 mb-5">
          <span className="text-3xl font-extrabold text-gold transition-colors duration-500">
            ₱{price}
          </span>
          <span className="text-xs text-muted mb-1 font-medium transition-colors duration-500 group-hover:text-white/70">
            Cash on Delivery
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-2.5 text-xs text-muted mb-5 flex-grow transition-colors duration-500 group-hover:text-white/75">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-subtle group-hover:text-gold transition-colors duration-500" />
            {location}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 shrink-0 text-subtle group-hover:text-gold transition-colors duration-500" />
              {distance}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-subtle group-hover:text-gold transition-colors duration-500" />
              {time}
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 text-dark font-bold text-sm pt-1 transition-colors duration-500 group-hover:text-white">
            <Star className="w-3.5 h-3.5 text-gold fill-gold" />
            {rating}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border transition-colors duration-500 group-hover:border-white/20">
          <span
            className="
              badge-gold gap-1 transition-colors duration-500
              group-hover:bg-white/15 group-hover:text-gold
            "
          >
            <CheckCircle2 className="w-3 h-3" />
            CIT-U VERIFIED
          </span>
          <Link
            href={`/quests/${id}`}
            className="
              bg-maroon text-white text-xs font-semibold px-4 py-2 rounded-lg
              transition-all duration-300 btn-lift
              group-hover:bg-white group-hover:text-maroon
            "
          >
            View Quest
          </Link>
        </div>
      </div>
    </article>
  );
}
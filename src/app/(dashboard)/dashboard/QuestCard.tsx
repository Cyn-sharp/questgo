import { Clock, MapPin, Navigation, Calendar, Star, CheckCircle2 } from "lucide-react";
import Link from "next/link";

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

export default function QuestCard({ category, timeLeft, title, price, location, distance, time, rating }: QuestCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="bg-red-50 text-[#791B32] text-xs font-bold px-2 py-1 rounded tracking-wide">
          {category}
        </span>
        <div className="flex items-center text-[#791B32] text-sm font-semibold gap-1">
          <Clock className="w-4 h-4" />
          {timeLeft}
        </div>
      </div>

      {/* Title & Price */}
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <div className="flex items-end gap-2 mb-6">
        <span className="text-3xl font-extrabold text-[#D2A02A]">₱{price}</span>
        <span className="text-xs text-gray-500 mb-1 font-medium">Cash on Delivery</span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-gray-600 mb-6 flex-grow">
        <div className="flex items-center gap-1 col-span-2">
          <MapPin className="w-4 h-4 text-gray-400" /> {location}
        </div>
        <div className="flex items-center gap-1">
          <Navigation className="w-4 h-4 text-gray-400" /> {distance}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-400" /> {time}
        </div>
        <div className="flex items-center gap-1 col-span-2 justify-end text-gray-900 font-bold">
          <Star className="w-4 h-4 text-[#D2A02A] fill-[#D2A02A]" /> {rating}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1 bg-[#F6E8D6] text-[#A67B27] px-2 py-1 rounded text-[10px] font-bold">
          <CheckCircle2 className="w-3 h-3" /> CIT-U VERIFIED
        </div>
        <Link 
          href={`/quests/1`} // Will be dynamic later
          className="bg-[#791B32] hover:bg-[#5a1425] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          View Quest
        </Link>
      </div>
    </div>
  );
}
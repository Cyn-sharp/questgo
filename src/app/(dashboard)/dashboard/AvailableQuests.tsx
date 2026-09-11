import Link from "next/link";
import { ArrowRight } from "lucide-react";
import QuestCard from "./QuestCard";

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

export default function AvailableQuests() {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_QUESTS.map((quest) => (
            <QuestCard key={quest.id} {...quest} />
          ))}
        </div>
      </div>
    </section>
  );
}
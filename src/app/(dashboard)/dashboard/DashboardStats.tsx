import { Search, Clock, CheckSquare, Briefcase } from "lucide-react";

export default function DashboardStats() {
  const stats = [
    { label: "Available Quests", value: "24", icon: Search, iconBg: "bg-red-50", iconColor: "text-red-900" },
    { label: "My Active Requests", value: "3", icon: Clock, iconBg: "bg-orange-50", iconColor: "text-orange-700" },
    { label: "Completed Quests", value: "47", icon: CheckSquare, iconBg: "bg-green-50", iconColor: "text-green-600" },
    { label: "Quest Earnings", value: "₱1,250", icon: Briefcase, iconBg: "bg-yellow-50", iconColor: "text-yellow-600" },
  ];

  return (
    <div className="bg-[#FAF9F5] py-12 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
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
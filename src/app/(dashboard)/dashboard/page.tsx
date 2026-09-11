import DashboardHero from "./DashboardHero";
import DashboardStats from "./DashboardStats";
import AvailableQuests from "./AvailableQuests";

export default function DashboardPage() {
  return (
    <div className="flex flex-col w-full">
      <DashboardHero />
      <DashboardStats />
      <AvailableQuests />
    </div>
  );
}
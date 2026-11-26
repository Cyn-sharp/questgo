import DashboardHero from "./DashboardHero";
import DashboardStats from "./DashboardStats";
import AvailableQuests from "./AvailableQuests";
import { RunnerApplyCard } from "@/components/runner/RunnerApplyCard";

export default function DashboardPage() {
  return (
    <div className="flex flex-col w-full">
      <DashboardHero />
      <DashboardStats />
      <RunnerApplyCard />
      <AvailableQuests />
    </div>
  );
}
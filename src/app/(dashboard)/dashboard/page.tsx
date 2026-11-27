import DashboardHero from "./DashboardHero";
import DashboardStats from "./DashboardStats";
import AvailableQuests from "./AvailableQuests";
import { IdVerificationCard } from "@/components/auth/IdVerificationCard";

export default function DashboardPage() {
  return (
    <div className="flex flex-col w-full">
      <DashboardHero />
      <DashboardStats />
      <IdVerificationCard />
      <AvailableQuests />
    </div>
  );
}
import { VerificationPending } from "@/components/auth/VerificationPending";

export const metadata = {
  title: "Verify Email | QuestGo",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  return <VerificationPending email={params.email ?? "Your email address"} />;
}
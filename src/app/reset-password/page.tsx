import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset Password | QuestGo",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ oobCode?: string }>;
}) {
  const params = await searchParams;
  return <ResetPasswordForm code={params.oobCode ?? ""} />;
}
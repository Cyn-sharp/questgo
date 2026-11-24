import Link from "next/link";
import { redirect } from "next/navigation";
import { currentIdCheck, currentSession } from "@/lib/auth/id-check-server";
import { StudentIdCheck } from "@/components/auth/StudentIdCheck";

export const metadata = {
  title: "Verification | QuestGo",
};

// Profile → Verification: shows the student's CIT-U ID status and lets them send a photo.
export default async function VerificationPage() {
  const session = await currentSession();
  if (!session) redirect("/login");
  const idCheck = await currentIdCheck();
  if (!idCheck) redirect("/login");

  const submittedLabel = idCheck.submittedAt
    ? new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" }).format(idCheck.submittedAt)
    : "";

  return (
    <div className="page-container max-w-2xl py-8 text-white">
      <Link href="/profile" className="underline">Back to Profile</Link>
      <h1 className="mt-4 text-3xl font-bold">Verification</h1>
      <p className="mt-2 text-white/80">
        Anyone can look around QuestGo. To post or accept quests, an admin checks your CIT-U ID first.
      </p>
      <StudentIdCheck
        uid={session.uid}
        state={idCheck.state}
        isAdmin={idCheck.isAdmin}
        reason={idCheck.reason}
        submittedLabel={submittedLabel}
      />
    </div>
  );
}
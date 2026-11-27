import Link from "next/link";
import { Clock3, IdCard, TriangleAlert } from "lucide-react";
import { currentIdCheck } from "@/lib/auth/id-check-server";

const NOTICE = {
  pending: {
    Icon: Clock3,
    text: "We're still checking your CIT-U ID. You can post quests as soon as an admin approves it.",
    button: "View ID Status",
  },
  rejected: {
    Icon: TriangleAlert,
    text: "Your CIT-U ID photo wasn't approved. Send a new photo, and you can post quests once an admin approves it.",
    button: "Send a New Photo",
  },
  missing: {
    Icon: IdCard,
    text: "Send a photo of your CIT-U ID first. You can post quests once an admin approves it.",
    button: "Verify My ID",
  },
};

// Posting a quest needs an admin-approved CIT-U ID. Until then, students see
// this notice instead of the form. (The server checks again when they post.)
export default async function PostQuestLayout({ children }: { children: React.ReactNode }) {
  const idCheck = await currentIdCheck().catch(() => null);
  if (!idCheck || idCheck.canPostAndAccept || idCheck.state === "approved") return children;
  const notice = NOTICE[idCheck.state];
  const Icon = notice.Icon;

  return (
    <div className="page-container max-w-2xl py-10">
      <section
        className="rounded-2xl border border-border bg-white p-6 text-center shadow-[0_2px_8px_rgb(0,0,0,0.05)] sm:p-8"
        aria-labelledby="post-locked-heading"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fbf8f0] text-maroon">
          <Icon className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 id="post-locked-heading" className="mt-5 font-outfit text-2xl font-extrabold text-maroon">
          Posting Needs a Verified ID
        </h1>
        <p className="mx-auto mt-3 max-w-md font-inter text-[14px] leading-[21px] text-muted">{notice.text}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/profile/verification" className="btn-primary">
            {notice.button}
          </Link>
          <Link href="/quests" className="btn-outline">
            Browse Quests
          </Link>
        </div>
      </section>
    </div>
  );
}
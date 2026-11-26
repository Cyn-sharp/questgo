"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { Clock3, IdCard, TriangleAlert } from "lucide-react";
import { db } from "@/lib/auth/firebase";
import { useAuth } from "@/hooks/useAuth";
import { idCheckState, type IdCheckState } from "@/lib/auth/id-check";

const BANNER = {
  pending: {
    Icon: Clock3,
    title: "We're checking your CIT-U ID.",
    text: "You can look around, but posting and accepting quests unlock once an admin approves it.",
    link: "View status",
    tone: "border-[#f3d98b] bg-[#fff8df]",
  },
  rejected: {
    Icon: TriangleAlert,
    title: "Your CIT-U ID photo wasn't approved.",
    text: "Send a new photo to start posting and accepting quests.",
    link: "Send new photo",
    tone: "border-red-200 bg-red-50",
  },
  missing: {
    Icon: IdCard,
    title: "Verify your CIT-U ID.",
    text: "Send a photo of your CIT-U ID to start posting and accepting quests.",
    link: "Verify now",
    tone: "border-[#eadcc0] bg-[#fbf8f0]",
  },
};

type IdCheckBannerProps = {
  uid: string;
  state: IdCheckState;
  reason: string;
};

export function IdCheckBanner({ uid, state, reason }: IdCheckBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Live updates: when an admin approves or rejects the ID, refresh the page so
  // the banner, the Post page and the Verification page all update by themselves.
  useEffect(() => {
    if (!user || user.uid !== uid) return;
    return onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        if (idCheckState(snapshot.data()) !== state) router.refresh();
      },
      (error) => console.error("ID check status listener failed:", error)
    );
  }, [user, uid, state, router]);

  // The Verification page already shows the full status.
  if (state === "approved" || pathname === "/profile/verification") return null;
  const banner = BANNER[state];
  const Icon = banner.Icon;

  return (
    <div className="page-container pt-4">
      <div
        role="status"
        className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-[0_2px_8px_rgb(0,0,0,0.08)] sm:flex-row sm:items-center ${banner.tone}`}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-maroon">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 font-inter text-[13px] leading-[19px]">
            <p className="font-semibold text-maroon">{banner.title}</p>
            <p className="text-dark">
              {banner.text}
              {state === "rejected" && reason ? (
                <>
                  {" "}
                  <span className="font-semibold">Admin&apos;s note:</span> {reason}
                </>
              ) : null}
            </p>
          </div>
        </div>
        <Link
          href="/profile/verification"
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-maroon px-4 font-inter text-[13px] font-semibold text-white transition-colors hover:bg-maroon-dark"
        >
          {banner.link}
        </Link>
      </div>
    </div>
  );
}
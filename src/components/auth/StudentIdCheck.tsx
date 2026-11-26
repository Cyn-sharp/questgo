"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Clock3, IdCard, ShieldCheck, TriangleAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { IdCheckState } from "@/lib/auth/id-check";
import { STUDENT_ID_ACCEPT, shrinkStudentIdPhoto, studentIdPickProblem, uploadStudentId } from "@/lib/auth/student-id";

type StudentIdCheckProps = {
  uid: string;
  state: IdCheckState;
  isAdmin: boolean;
  reason: string;
  submittedLabel: string;
};

const LOOK = {
  approved: { Icon: BadgeCheck, title: "You're Verified", pill: "Approved", pillClass: "bg-emerald-50 text-emerald-700" },
  admin: { Icon: ShieldCheck, title: "Admin Account", pill: "No ID check needed", pillClass: "bg-[#fbf8f0] text-maroon" },
  pending: { Icon: Clock3, title: "We're Checking Your ID", pill: "Waiting for approval", pillClass: "bg-[#fff8df] text-[#aa7b00]" },
  rejected: { Icon: TriangleAlert, title: "Please Send a New ID Photo", pill: "Not approved", pillClass: "bg-red-50 text-maroon" },
  missing: { Icon: IdCard, title: "Verify Your CIT-U ID", pill: "Not verified yet", pillClass: "bg-[#fbf8f0] text-maroon" },
};

const TEXT = "mt-4 font-inter text-[13px] leading-[19px] text-muted";

export function StudentIdCheck({ uid, state, isAdmin, reason, submittedLabel }: StudentIdCheckProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [photo, setPhoto] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const view = state === "approved" ? "approved" : isAdmin ? "admin" : state;
  const look = LOOK[view];
  const Icon = look.Icon;
  const canUpload = view === "missing" || view === "rejected" || (view === "pending" && isReplacing);
  const busy = isUploading || isRefreshing;

  const handlePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    const problem = studentIdPickProblem(file);
    if (problem) {
      setMessage(problem);
      event.target.value = "";
      return;
    }
    setPhoto(file);
    setMessage("");
  };

  const sendPhoto = async () => {
    if (!photo) {
      setMessage("Choose a photo of your CIT-U ID first.");
      return;
    }
    if (!user || user.uid !== uid) {
      setMessage("Your login has ended. Please log out and log in again.");
      return;
    }
    setIsUploading(true);
    setMessage("");
    try {
      await uploadStudentId(await user.getIdToken(), await shrinkStudentIdPhoto(photo));
      setPhoto(null);
      setIsReplacing(false);
      startRefresh(() => router.refresh());
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "Your ID photo could not be uploaded.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section
      className="mt-6 rounded-2xl border border-border bg-white p-6 text-center shadow-[0_2px_8px_rgb(0,0,0,0.05)] sm:p-8"
      aria-labelledby="id-check-heading"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fbf8f0] text-maroon">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>
      <h2 id="id-check-heading" className="mt-5 font-outfit text-xl font-extrabold text-maroon sm:text-[22px]">
        {look.title}
      </h2>
      <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.08em] ${look.pillClass}`}>
        {look.pill}
      </span>

      {view === "approved" ? (
        <p className={TEXT}>Your CIT-U ID was approved. You can post and accept quests.</p>
      ) : view === "admin" ? (
        <p className={TEXT}>Admin accounts can post and accept quests without an ID check.</p>
      ) : view === "pending" ? (
        <>
          <p className={TEXT}>
            Thanks! A QuestGo admin is checking the photo of your CIT-U ID. You can look around while you wait.
            Posting and accepting quests unlock as soon as you&apos;re approved.
          </p>
          {submittedLabel ? (
            <p className="mt-3 rounded-lg bg-[#fbf8f0] px-3 py-2 font-inter text-[12px] text-dark">
              Sent <span className="font-semibold">{submittedLabel}</span>
            </p>
          ) : null}
        </>
      ) : view === "rejected" ? (
        <>
          <p className={TEXT}>An admin couldn&apos;t approve the photo you sent. Please send a new one.</p>
          {reason ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-left font-inter text-[13px] leading-[18px] text-maroon">
              <span className="font-semibold">Admin&apos;s note:</span> {reason}
            </p>
          ) : null}
        </>
      ) : (
        <p className={TEXT}>
          Send a photo of your CIT-U ID so an admin can confirm you&apos;re a CIT-U student. You only do this once.
        </p>
      )}

      {canUpload ? (
        <div className="mx-auto mt-5 max-w-md text-left">
          <input
            ref={inputRef}
            id="id-check-photo"
            type="file"
            accept={STUDENT_ID_ACCEPT}
            className="sr-only"
            onChange={handlePick}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl border-[1.5px] border-dashed p-2.5 text-left text-maroon transition-colors hover:border-maroon hover:bg-[#fdf9eb] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-maroon disabled:opacity-60 ${photo ? "border-maroon bg-[#fdf9eb]" : "border-[#d9b8bf] bg-cream"}`}
            aria-label="Choose a photo of your CIT-U ID"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
              <IdCard className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-inter text-[13px] font-semibold">
                {photo ? photo.name : "Click to choose your CIT-U ID photo"}
              </span>
              <span className="block font-inter text-[11px] font-normal text-muted">
                Front side, JPG or PNG. Your name and photo must be clear.
              </span>
            </span>
          </button>
        </div>
      ) : null}

      {message ? (
        <p role="alert" className="mx-auto mt-3 max-w-md rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-inter text-[12px] leading-4 text-maroon">
          {message}
        </p>
      ) : null}

      {canUpload ? (
        <button
          type="button"
          onClick={sendPhoto}
          disabled={busy}
          className="mx-auto mt-4 block h-11 w-full max-w-md rounded-lg bg-maroon font-inter text-[12px] font-semibold text-white shadow-[0_8px_18px_#7a1f3226] transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        >
          {isUploading ? "SENDING..." : view === "missing" ? "SEND ID PHOTO" : "SEND NEW PHOTO"}
        </button>
      ) : null}

      {view === "approved" || view === "admin" ? (
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/post-quest" className="btn-primary">Post a Quest</Link>
          <Link href="/quests" className="btn-outline">Find Quests</Link>
        </div>
      ) : null}

      {view === "pending" && !isReplacing ? (
        <div className="mt-5 flex justify-center">
          <Link href="/quests" className="btn-outline">Browse Quests</Link>
        </div>
      ) : null}

      {view === "pending" ? (
        <button
          type="button"
          onClick={() => {
            setIsReplacing((value) => !value);
            setPhoto(null);
            setMessage("");
          }}
          disabled={busy}
          className="mt-3 block w-full font-inter text-[12px] font-semibold text-maroon hover:underline disabled:opacity-50"
        >
          {isReplacing ? "Keep the photo I sent" : "Sent the wrong photo? Replace it"}
        </button>
      ) : null}

      <p className="mt-6 border-t border-[#eee9df] pt-4 font-inter text-[11px] text-muted">
        Only QuestGo admins can see your ID photo.
      </p>
    </section>
  );
}
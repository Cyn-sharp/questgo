"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIdStatus } from "@/hooks/useIdStatus";
import type { IdCheckState } from "@/lib/auth/id-check";

// One check for everyone: once an admin approves a student's CIT-U ID,
// they can both post quests and run quests. There is no separate runner application.
export const ID_STEPS = ["Send your ID", "Admin review", "Post & run quests"] as const;

const COPY: Record<IdCheckState, { eyebrow: string; title: string; body: string; action: string; href: string; pose: string; step: number }> = {
  missing: { eyebrow: "Get verified", title: "Verify your CIT-U ID", body: "Send a photo of your CIT-U ID once. After an administrator approves it, you can post quests and run quests for classmates.", action: "Send my ID photo", href: "/profile/verification", pose: "point", step: 0 },
  rejected: { eyebrow: "ID update", title: "Your ID wasn't approved", body: "Please send a clearer photo of your CIT-U ID.", action: "Send a new photo", href: "/profile/verification", pose: "think", step: 0 },
  pending: { eyebrow: "ID sent", title: "Under review", body: "An administrator is checking your CIT-U ID. You can post and run quests as soon as it's approved.", action: "", href: "", pose: "think", step: 1 },
  approved: { eyebrow: "CIT-U verified", title: "You're all set", body: "Your CIT-U ID is approved. Post a quest, or run one for a classmate in your free time.", action: "Browse quests", href: "/quests", pose: "cheer", step: 3 },
};

// `step` is the current step (0-based). Steps before it are done; 3 means all done.
function stateOf(index: number, step: number) {
  return index < step ? "done" : index === step ? "current" : "todo";
}

function StepsRail({ step }: { step: number }) {
  return (
    <ol aria-label="Verification progress" className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {ID_STEPS.map((label, index) => {
        const state = stateOf(index, step);
        const look = state === "done" ? "bg-gold-bright text-dark" : state === "current" ? "border-2 border-gold-bright text-gold-bright" : "border border-white/30 text-white/70";
        return (
          <li key={label} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${look}`}>
              {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : index + 1}
            </span>
            <span className={`text-xs ${state === "current" ? "font-semibold text-white" : "text-parchment/80"}`}>{label}</span>
            {index < ID_STEPS.length - 1 && <span aria-hidden="true" className="hidden h-px w-6 bg-white/25 sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

// Display only, so every state can be previewed without a signed-in account.
export function IdVerificationCardView({ status, reason }: { status: IdCheckState; reason?: string }) {
  const copy = COPY[status];
  const body = status === "rejected" && reason ? `Reason: ${reason}` : copy.body;

  return (
    <section aria-labelledby="id-card-title" className="page-container pb-8">
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-dark shadow-[0_20px_60px_rgba(0,0,0,0.4)] sm:rounded-3xl">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(122,31,50,0.75)_0%,transparent_60%),radial-gradient(circle_at_0%_100%,rgba(201,162,39,0.10)_0%,transparent_45%)]" />

        <div className="relative grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:gap-12 md:px-12 md:py-10">
          <div className="min-w-0 md:max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright">{copy.eyebrow}</p>
            <h2 id="id-card-title" className="mt-2 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">{copy.title}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-parchment/85">{body}</p>

            <div className="mt-6"><StepsRail step={copy.step} /></div>

            {copy.action && (
              <Link
                href={copy.href}
                className={`mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-[15px] font-bold transition ${status === "approved" ? "border-2 border-white/25 text-white hover:bg-white/10" : "bg-gold-bright text-dark hover:brightness-95"}`}
              >
                {copy.action}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>

          <div aria-hidden="true" className="relative order-first mx-auto md:order-last md:mx-0">
            <div className="absolute inset-x-2 bottom-0 top-8 rounded-full bg-maroon/60 blur-2xl" />
            <Image src={`/mascot/pose-${copy.pose}.png`} alt="" width={364} height={510} className="relative h-36 w-auto drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] sm:h-44 md:h-56" />
          </div>
        </div>
      </div>
    </section>
  );
}

// Admins don't need an ID check, so they don't see the card. `null` until we know.
function useIsAdmin() {
  const { user } = useAuth();
  const [result, setResult] = useState<{ uid: string; admin: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    let current = true;
    user.getIdTokenResult().then(
      (token) => { if (current) setResult({ uid: user.uid, admin: token.claims.admin === true }); },
      () => { if (current) setResult({ uid: user.uid, admin: false }); },
    );
    return () => { current = false; };
  }, [user]);

  return user && result?.uid === user.uid ? result.admin : null;
}

// Home-page card. Shows where the student is in the ID check.
export function IdVerificationCard() {
  const { status, rejectReason } = useIdStatus();
  const isAdmin = useIsAdmin();
  if (status === "loading" || isAdmin !== false) return null;
  return <IdVerificationCardView status={status} reason={rejectReason} />;
}
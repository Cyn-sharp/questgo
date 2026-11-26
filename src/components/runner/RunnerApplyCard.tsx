"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRunnerStatus } from "@/hooks/useRunnerStatus";
import { RunnerStepsRail } from "@/components/runner/RunnerSteps";
import type { RunnerStatus } from "@/lib/quests/runner";

const COPY: Record<RunnerStatus, { eyebrow: string; title: string; body: string; action: string; href: string; pose: string; step: number }> = {
  none: { eyebrow: "For runners", title: "Become a Verified Runner", body: "Take quests from classmates and earn on campus. Apply once; an administrator reviews your application before you can accept quests.", action: "Apply as a runner", href: "/runner/apply", pose: "point", step: 0 },
  rejected: { eyebrow: "Application update", title: "Your application wasn't approved", body: "You can review the details and apply again.", action: "Apply again", href: "/runner/apply", pose: "think", step: 0 },
  pending: { eyebrow: "Application sent", title: "Under review", body: "An administrator is reviewing your application. You can accept quests as soon as it's approved.", action: "", href: "", pose: "think", step: 1 },
  approved: { eyebrow: "Verified Runner", title: "You're cleared to run quests", body: "Your application is approved. Pick a quest from the marketplace.", action: "Browse quests", href: "/quests", pose: "cheer", step: 3 },
};

// Display only, so every state can be previewed without a signed-in account.
export function RunnerCardView({ status, reviewNote }: { status: RunnerStatus; reviewNote?: string }) {
  const copy = COPY[status];
  const body = status === "rejected" && reviewNote ? `Reason: ${reviewNote}` : copy.body;

  return (
    <section aria-labelledby="runner-card-title" className="page-container pb-8">
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-dark shadow-[0_20px_60px_rgba(0,0,0,0.4)] sm:rounded-3xl">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(122,31,50,0.75)_0%,transparent_60%),radial-gradient(circle_at_0%_100%,rgba(201,162,39,0.10)_0%,transparent_45%)]" />

        <div className="relative grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:gap-12 md:px-12 md:py-10">
          <div className="min-w-0 md:max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright">{copy.eyebrow}</p>
            <h2 id="runner-card-title" className="mt-2 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">{copy.title}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-parchment/85">{body}</p>

            <div className="mt-6"><RunnerStepsRail step={copy.step} /></div>

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

// Home-page entry point. Reflects where the user is in the runner application.
export function RunnerApplyCard() {
  const { status, reviewNote } = useRunnerStatus();
  if (status === "loading" || status === "error") return null;
  return <RunnerCardView status={status} reviewNote={reviewNote} />;
}

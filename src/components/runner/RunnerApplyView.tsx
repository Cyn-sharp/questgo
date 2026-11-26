"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Clock, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { RunnerTimeline } from "@/components/runner/RunnerSteps";
import { VerifiedRunnerBadge } from "@/components/runner/VerifiedRunnerBadge";
import { RUNNER_DECLARATIONS, RUNNER_TERMS_VERSION, type RunnerStatus } from "@/lib/quests/runner";

export type ApplicationPayload = { availability: string; declarations: Record<string, boolean>; healthConsent: boolean; termsAccepted: boolean; termsVersion: string };

const HEADER: Record<RunnerStatus, { title: string; description: string; step: number; pose: string }> = {
  none: { title: "Apply as a Verified Runner", description: "It takes about two minutes. An administrator reviews every application before you can accept quests.", step: 0, pose: "point" },
  rejected: { title: "Apply again", description: "Your last application wasn't approved. Review the note below and send a new one.", step: 0, pose: "think" },
  pending: { title: "Application under review", description: "Your application is with an administrator. Nothing more is needed from you.", step: 1, pose: "think" },
  approved: { title: "You're a Verified Runner", description: "Your application was approved. You can accept quests from the marketplace.", step: 3, pose: "cheer" },
};

const longDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-PH", { dateStyle: "long" }) : "");

function SectionTitle({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <div>
      <h2 className="flex items-center gap-3 font-display text-lg font-bold text-dark">
        <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-maroon text-xs font-bold text-white">{n}</span>
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted sm:pl-10">{hint}</p>
    </div>
  );
}

function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-relaxed text-dark transition-colors hover:bg-cream has-[:checked]:border-maroon has-[:checked]:bg-cream">
      <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-maroon" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

function StatusPanel({ status, submittedAt }: { status: "pending" | "approved"; submittedAt?: string }) {
  const pending = status === "pending";
  const Icon = pending ? Clock : BadgeCheck;
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-parchment text-maroon"><Icon className="h-6 w-6" aria-hidden="true" /></span>
        <div>
          {pending ? (
            <>
              <p className="font-display text-xl font-bold text-dark">We&apos;ve got your application</p>
              {submittedAt && <p className="mt-1 text-sm text-muted">Submitted {longDate(submittedAt)}</p>}
            </>
          ) : (
            <>
              <p className="font-display text-xl font-bold text-dark">You&apos;re cleared to run quests</p>
              <div className="mt-2"><VerifiedRunnerBadge /></div>
            </>
          )}
        </div>
      </div>
      <ul className="space-y-2 border-t border-border pt-5 text-sm text-muted">
        {(pending
          ? ["The result will show here and on your home page.", "You can keep posting quests and browsing the marketplace while you wait.", "If it's approved, a Verified Runner badge appears on your profile."]
          : ["The Verified Runner badge now shows on your profile.", "Only accept a quest when you are well enough to finish it.", "Remember: you take quests at your own risk, as set out in the Runner Terms."]
        ).map((line) => (
          <li key={line} className="flex gap-3"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-maroon" />{line}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Link href={pending ? "/dashboard" : "/quests"} className="btn-primary">{pending ? "Back to home" : "Browse quests"}</Link>
        <Link href={pending ? "/quests" : "/profile"} className="btn-outline">{pending ? "Browse quests" : "View my profile"}</Link>
      </div>
    </div>
  );
}

function ApplicationForm({ status, reviewNote, busy, error, onSubmit }: { status: "none" | "rejected"; reviewNote?: string; busy: boolean; error: string; onSubmit: (payload: ApplicationPayload) => void }) {
  const [availability, setAvailability] = useState("");
  const [declared, setDeclared] = useState<Record<string, boolean>>({});
  const [consent, setConsent] = useState(false);
  const [terms, setTerms] = useState(false);

  const availabilityOk = availability.trim().length >= 10;
  const total = 1 + RUNNER_DECLARATIONS.length + 2; // availability, each statement, consent, terms
  const completed = Number(availabilityOk) + RUNNER_DECLARATIONS.filter((item) => declared[item.key]).length + Number(consent) + Number(terms);
  const ready = completed === total;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    onSubmit({ availability, declarations: declared, healthConsent: consent, termsAccepted: terms, termsVersion: RUNNER_TERMS_VERSION });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-9">
      {status === "rejected" && (
        <div role="status" className="rounded-xl border border-border bg-cream p-4">
          <p className="text-sm font-semibold text-dark">Why it wasn&apos;t approved</p>
          <p className="mt-1 text-sm text-muted">{reviewNote || "No reason was recorded."}</p>
        </div>
      )}

      <section className="space-y-4">
        <SectionTitle n={1} title="Availability" hint="So administrators know when you can realistically take quests." />
        <div className="sm:pl-10">
          <label htmlFor="availability" className="mb-1.5 block text-sm font-semibold text-dark">When are you usually free?</label>
          <textarea id="availability" value={availability} onChange={(event) => setAvailability(event.target.value)} maxLength={300} rows={3}
            placeholder="e.g. Weekdays after 1 PM, mostly around the library and main gate"
            className="w-full resize-y rounded-xl border border-field bg-white px-4 py-3 text-sm text-dark placeholder:text-muted/80" />
          <p className="mt-1 text-right text-xs text-muted">{availability.trim().length} / 300</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle n={2} title="Health and fitness" hint="A self-declaration. Confirm each statement that is true for you." />
        <fieldset className="space-y-3 sm:pl-10">
          <legend className="sr-only">Health and fitness statements</legend>
          {RUNNER_DECLARATIONS.map((item) => (
            <CheckRow key={item.key} checked={Boolean(declared[item.key])} onChange={(value) => setDeclared((current) => ({ ...current, [item.key]: value }))}>{item.label}</CheckRow>
          ))}
        </fieldset>
      </section>

      <section className="space-y-4">
        <SectionTitle n={3} title="Agreements" hint="Both are required." />
        <div className="space-y-3 sm:pl-10">
          <CheckRow checked={consent} onChange={setConsent}>I consent to administrators using my answers only to decide this application.</CheckRow>
          <CheckRow checked={terms} onChange={setTerms}>
            I accept the <Link href="/runner-terms" target="_blank" className="font-semibold text-maroon underline">Runner Terms</Link>, including that I take quests at my own risk and that QuestGo&apos;s administrators are not responsible for what happens while I run a quest.
          </CheckRow>
        </div>
      </section>

      <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm text-muted">
          <span className="font-semibold text-dark">{completed} of {total}</span> completed{!ready && " · finish every item to submit"}
        </p>
        <button type="submit" disabled={!ready || busy} className="btn-primary sm:min-w-52">{busy ? "Submitting…" : "Submit application"}</button>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
    </form>
  );
}

export function RunnerApplyView({ status, reviewNote, submittedAt, busy = false, error = "", onSubmit }: { status: RunnerStatus; reviewNote?: string; submittedAt?: string; busy?: boolean; error?: string; onSubmit: (payload: ApplicationPayload) => void }) {
  const head = HEADER[status];
  return (
    <div className="page-container py-8">
      <PageHeader eyebrow="Runner application" title={head.title} description={head.description} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:p-8">
          {status === "pending" || status === "approved" ? <StatusPanel status={status} submittedAt={submittedAt} /> : <ApplicationForm status={status} reviewNote={reviewNote} busy={busy} error={error} onSubmit={onSubmit} />}
        </div>

        <aside aria-label="About the application" className="relative overflow-hidden rounded-2xl border border-white/15 bg-dark p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] lg:sticky lg:top-24">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(122,31,50,0.75)_0%,transparent_60%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright">How it works</p>
                <h2 className="mt-2 font-display text-xl font-bold text-white">Three steps to your badge</h2>
              </div>
              <Image src={`/mascot/pose-${head.pose}.png`} alt="" aria-hidden="true" width={364} height={510} className="-mt-1 h-24 w-auto shrink-0 drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]" />
            </div>
            <div className="mt-6"><RunnerTimeline step={head.step} /></div>
            <div className="mt-6 flex gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold-bright" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-parchment/85">
                <span className="font-semibold text-white">What we keep.</span> Your availability and the fact that you confirmed each statement. No medical details. Only administrators can see it.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

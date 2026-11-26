import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

// One check for everyone: an approved CIT-U ID lets a student both post and run quests.
const STEPS = [
  { n: "1", title: "Sign up", body: "Create your QuestGo account and send a photo of your CIT-U ID." },
  { n: "2", title: "Get verified", body: "An administrator checks your ID. Once it's approved, you can post and run quests." },
  { n: "3", title: "Start earning", body: "Pick quests from classmates that fit your free time between classes." },
];

export function RunnerCta() {
  return (
    <section id="runner" className="px-6 py-20 md:px-16 md:py-24 border-b border-white/10" aria-labelledby="runner-heading">
      <ScrollReveal>
        <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright">For runners</p>
            <h2 id="runner-heading" className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Free between classes? Run quests and earn on campus
            </h2>
            <p className="mt-4 text-base text-parchment/85">
              Every verified CIT-U student can run quests. There&apos;s no separate application: once your ID is approved, you&apos;re ready.
            </p>
            <Link href="/register" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-gold-bright px-6 py-3 text-[15px] font-semibold text-dark hover:brightness-95">
              Create your account
            </Link>
            <p className="mt-3 text-xs text-parchment/75">
              Read the <Link href="/runner-terms" className="underline">Runner Terms</Link> first.
            </p>
          </div>
          <ol className="grid max-w-xl gap-3">
            {STEPS.map((step) => (
              <li key={step.n} className="flex gap-4 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-maroon text-sm font-bold text-white">{step.n}</span>
                <div>
                  <h3 className="text-base font-bold text-dark">{step.title}</h3>
                  <p className="mt-0.5 text-sm text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </ScrollReveal>
    </section>
  );
}
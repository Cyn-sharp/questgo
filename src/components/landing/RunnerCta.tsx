import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const STEPS = [
  { n: "1", title: "Apply", body: "Tell us when you're free and confirm a short health and fitness self-declaration." },
  { n: "2", title: "Get approved", body: "An administrator reviews your application. Only approved runners can accept quests." },
  { n: "3", title: "Start earning", body: "Take quests from classmates, get a Verified Runner badge on your profile." },
];

export function RunnerCta() {
  return (
    <section id="runner" className="px-6 py-20 md:px-16 md:py-24 border-b border-white/10" aria-labelledby="runner-heading">
      <ScrollReveal>
        <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold-bright">For runners</p>
            <h2 id="runner-heading" className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Want to earn on campus? Become a Verified Runner
            </h2>
            <p className="mt-4 text-base text-parchment/85">
              Quests are taken by students who have been reviewed and approved. It takes a few minutes to apply.
            </p>
            <Link href="/runner/apply" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-gold-bright px-6 py-3 text-[15px] font-semibold text-dark hover:brightness-95">
              Apply as a runner
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

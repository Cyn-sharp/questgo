import { Check } from "lucide-react";

export const RUNNER_STEPS = [
  { label: "Apply", detail: "Tell us when you're free and confirm the health and fitness statements." },
  { label: "Review", detail: "An administrator reviews your application. The result appears here and on your home page." },
  { label: "Accept quests", detail: "Approved runners get a Verified Runner badge and can accept quests." },
] as const;

// `step` is the current step (0-based). Steps before it are done; 3 means all done.
function stateOf(index: number, step: number) {
  return index < step ? "done" : index === step ? "current" : "todo";
}

function Marker({ state, index }: { state: "done" | "current" | "todo"; index: number }) {
  const look = state === "done" ? "bg-gold-bright text-dark" : state === "current" ? "border-2 border-gold-bright text-gold-bright" : "border border-white/30 text-white/70";
  return (
    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${look}`}>
      {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : index + 1}
    </span>
  );
}

// Compact, horizontal. For dark surfaces.
export function RunnerStepsRail({ step }: { step: number }) {
  return (
    <ol aria-label="Application progress" className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {RUNNER_STEPS.map((item, index) => {
        const state = stateOf(index, step);
        return (
          <li key={item.label} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
            <Marker state={state} index={index} />
            <span className={`text-xs ${state === "current" ? "font-semibold text-white" : "text-parchment/80"}`}>{item.label}</span>
            {index < RUNNER_STEPS.length - 1 && <span aria-hidden="true" className="hidden h-px w-6 bg-white/25 sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

// Vertical, with a short description per step. For dark surfaces.
export function RunnerTimeline({ step }: { step: number }) {
  return (
    <ol aria-label="Application progress">
      {RUNNER_STEPS.map((item, index) => {
        const state = stateOf(index, step);
        const last = index === RUNNER_STEPS.length - 1;
        return (
          <li key={item.label} className="relative flex gap-4 pb-6 last:pb-0" aria-current={state === "current" ? "step" : undefined}>
            {!last && <span aria-hidden="true" className={`absolute left-3 top-7 h-[calc(100%-1.75rem)] w-px ${state === "done" ? "bg-gold-bright/70" : "bg-white/20"}`} />}
            <Marker state={state} index={index} />
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${state === "todo" ? "text-parchment/80" : "text-white"}`}>{item.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-parchment/75">{item.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

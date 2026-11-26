import { BadgeCheck } from "lucide-react";

// Wording lives here so the profile badge can be renamed in one place.
export const RUNNER_BADGE_LABEL = "Verified Runner";

// Shown on the profile in place of the plain "Verified" pill once an administrator
// has approved the runner application. Same size and casing as that pill.
export function VerifiedRunnerBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-maroon px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
      <BadgeCheck className="h-3.5 w-3.5 text-gold-bright" aria-hidden="true" />
      {RUNNER_BADGE_LABEL}
    </span>
  );
}

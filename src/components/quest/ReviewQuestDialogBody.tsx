import { Banknote, Clock, MapPin, Paperclip, Wallet } from "lucide-react";

export type ReviewRow = { label: string; value: string };

type Props = {
  title: string;
  category: string;
  description: string;
  reward: string;
  pickup: string;
  meetup: string;
  time: string;
  details: ReviewRow[];
  fileLabel?: string;
  funding: { method: string; budget: string };
  error?: string | null;
  submitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

function Group({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3.5 py-4">
      <span aria-hidden="true" className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-parchment text-maroon">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <div className="mt-1 text-[15px] text-dark">{children}</div>
      </div>
    </div>
  );
}

export function ReviewQuestDialogBody({ title, category, description, reward, pickup, meetup, time, details, fileLabel, funding, error, submitting, onBack, onConfirm }: Props) {
  return (
    <>
      <div className="px-5 pb-5 pt-6 sm:px-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-maroon">Final check</p>
        <h2 id="review-title" className="mt-1 font-display text-2xl font-bold text-dark">Review your quest</h2>
        <p className="mt-1.5 text-sm text-muted">Check the details below. Runners will see exactly this.</p>
      </div>

      <div className="border-y border-border bg-cream px-5 py-5 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-parchment px-2.5 py-1 text-xs font-semibold capitalize text-maroon">{category}</span>
            <h3 className="mt-2.5 break-words font-display text-lg font-bold leading-snug text-dark">{title}</h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-2xl font-bold leading-none text-maroon">₱{reward}</p>
            <p className="mt-1 text-xs text-muted">Cash on delivery</p>
          </div>
        </div>
        {description.trim() && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">{description}</p>}
      </div>

      <dl className="divide-y divide-border px-5 sm:px-7">
        <Group icon={MapPin} label="Pickup / task location">
          <p className="break-words font-medium">{pickup}</p>
        </Group>
        <Group icon={Clock} label="Meet-up">
          <p className="break-words font-medium">{meetup}</p>
          <p className="text-sm text-muted">{time}</p>
        </Group>
        {details.length > 0 && (
          <Group icon={Banknote} label="Requirements">
            <ul className="space-y-2">
              {details.map((row) => (
                <li key={row.label}>
                  <span className="block text-sm text-muted">{row.label}</span>
                  <span className="break-words font-medium">{row.value}</span>
                </li>
              ))}
            </ul>
          </Group>
        )}
        {fileLabel && (
          <Group icon={Paperclip} label="Attached file">
            <p className="break-all font-medium">{fileLabel}</p>
          </Group>
        )}
        <Group icon={Wallet} label="Funding">
          <p className="font-medium">{funding.method}</p>
          <p className="text-sm text-muted">Purchase limit: ₱{funding.budget}</p>
        </Group>
      </dl>

      {error && <p role="alert" className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:mx-7">{error}</p>}

      <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
        <button type="button" disabled={submitting} onClick={onBack} className="btn-outline w-full sm:w-auto">Go back and edit</button>
        <button type="button" disabled={submitting} onClick={onConfirm} className="btn-primary w-full sm:w-auto">{submitting ? "Uploading and posting…" : "Confirm and post"}</button>
      </div>
    </>
  );
}

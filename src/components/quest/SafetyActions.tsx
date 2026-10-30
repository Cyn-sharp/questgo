"use client";

import { useState, type FormEvent } from "react";
import { useBlockedUsers } from "@/hooks/useQuests";
import { questRequest, setUserBlocked } from "@/lib/quests/client";
import { REPORT_REASONS, type ReportReason } from "@/lib/quests/safety";
import { Button } from "@/components/ui/Button";
import type { Quest } from "@/types/quest";

// Report and block the other person on a quest. Blocking hides their quests
// and prevents either of you accepting the other's quests in future; it does
// not end a quest that is already underway, which still needs settling.
export function SafetyActions({ quest, uid }: { quest: Quest; uid: string }) {
  const requester = uid === quest.requesterId;
  const otherId = requester ? quest.questRunnerId : quest.requesterId;
  const otherName = (requester ? quest.runnerName : quest.requesterName) || "this user";
  const blocked = useBlockedUsers().some((entry) => entry.id === otherId);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  if (!otherId) return null;

  async function toggleBlock() {
    if (pending || !otherId) return;
    if (!blocked && !window.confirm(`Block ${otherName}? You won't see their quests, and neither of you can accept the other's quests. Any quest already underway continues until it is completed or settled.`)) return;
    setPending(true); setError(""); setNotice("");
    try {
      await setUserBlocked(otherId, !blocked);
      setNotice(blocked ? `${otherName} is unblocked.` : `${otherName} is blocked.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update block."); }
    finally { setPending(false); }
  }

  async function submitReport(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError(""); setNotice("");
    try {
      await questRequest(`/${encodeURIComponent(quest.id)}/report`, { reason, details, block: alsoBlock });
      setOpen(false); setReason(""); setDetails(""); setAlsoBlock(false);
      setNotice("Report sent. An administrator will review it. If you are in danger, contact campus security right away.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to send report."); }
    finally { setPending(false); }
  }

  return <section aria-label="Safety" className="rounded-xl border p-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-gray-600">Problem with {otherName}?</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => { setOpen((value) => !value); setError(""); }} aria-expanded={open}>Report</Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={toggleBlock}>{blocked ? "Unblock" : "Block"}</Button>
      </div>
    </div>
    {open && <form onSubmit={submitReport} className="space-y-3">
      <label className="block text-sm font-semibold">Reason
        <select required value={reason} onChange={(e) => setReason(e.target.value as ReportReason)} className="mt-1 block w-full rounded-xl border p-3 font-normal">
          <option value="" disabled>Choose a reason</option>
          {Object.entries(REPORT_REASONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold">What happened?
        <textarea required minLength={10} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} rows={4} className="mt-1 block w-full rounded-xl border p-3 font-normal" placeholder="Include times, amounts, and what was said. Administrators can see this quest's chat and activity." />
      </label>
      {!blocked && <label className="flex gap-2 text-sm"><input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} />Also block {otherName}</label>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || !reason || details.trim().length < 10}>{pending ? "Sending…" : "Send Report"}</Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
  </section>;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ExternalLink, IdCard, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatAge } from "@/lib/admin/presentation";
import { ID_REASON_MAX, ID_REASON_MIN, ID_REJECT_REASONS } from "@/lib/auth/id-review";
import { AdminEmptyState, AdminErrorState, AdminLoadingRows, AdminPageHeading, AdminPanel, AdminStatusChip, adminInput } from "@/components/admin/ConsoleUI";

type Student = { uid: string; name: string; email: string; course: string; submittedAt: string | null };
type GetToken = () => Promise<string>;

const phTime = new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });
const errorText = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

// One student's ID photo. It loads only when the card scrolls into view, and only for admins.
function IdPhoto({ uid, name, getToken }: { uid: string; name: string; getToken: GetToken }) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");
  const [attempt, setAttempt] = useState(0);
  const [photo, setPhoto] = useState<{ url?: string; error?: string } | null>(null);

  useEffect(() => {
    const element = box.current;
    if (visible || !element) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "300px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let current = true;
    let url = "";
    void (async () => {
      try {
        const response = await fetch(`/api/admin/id-checks/${encodeURIComponent(uid)}/photo`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
          cache: "no-store",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "The photo could not be loaded.");
        }
        url = URL.createObjectURL(await response.blob());
        if (current) setPhoto({ url });
      } catch (error) {
        if (current) setPhoto({ error: errorText(error, "The photo could not be loaded.") });
      }
    })();
    return () => {
      current = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [visible, uid, getToken, attempt]);

  return (
    <div ref={box}>
      <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        {photo?.url ? (
          <Image src={photo.url} alt={`CIT-U ID photo sent by ${name}`} fill unoptimized className="object-contain" />
        ) : photo?.error ? (
          <div role="alert" className="max-w-xs px-4 text-center text-sm text-slate-700">
            <p>{photo.error}</p>
            <button
              type="button"
              onClick={() => { setPhoto(null); setAttempt((value) => value + 1); }}
              className="mt-2 font-semibold text-maroon underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        ) : (
          <p role="status" className="text-sm text-slate-600">Loading ID photo…</p>
        )}
      </div>
      {photo?.url ? (
        <a href={photo.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-maroon underline underline-offset-2">
          Open full size <ExternalLink size={13} aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}

export default function AdminIdChecksPage() {
  const { user, isLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  const getToken = useCallback<GetToken>(async () => {
    if (!user) throw new Error("Sign in as an administrator.");
    return user.getIdToken();
  }, [user]);

  const fetchStudents = useCallback(async () => {
    const response = await fetch("/api/admin/id-checks", { headers: { Authorization: `Bearer ${await getToken()}` }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Unable to load ID checks.");
    if (!Array.isArray(data.students)) throw new Error("Unexpected ID check response.");
    return data.students as Student[];
  }, [getToken]);

  useEffect(() => {
    if (isLoading) return;
    let current = true;
    void fetchStudents().then(
      (items) => { if (current) { setStudents(items); setStatus("ready"); } },
      (error) => { if (current) { setLoadError(errorText(error, "Unable to load ID checks.")); setStatus("error"); } },
    );
    return () => { current = false; };
  }, [isLoading, fetchStudents]);

  async function refresh() {
    setStatus("loading");
    setLoadError("");
    setCardErrors({});
    try {
      setStudents(await fetchStudents());
      setStatus("ready");
    } catch (error) {
      setLoadError(errorText(error, "Unable to load ID checks."));
      setStatus("error");
    }
  }

  async function decide(student: Student, outcome: "approve" | "reject") {
    if (busy) return;
    const reason = (reasons[student.uid] ?? "").trim();
    const question = outcome === "approve"
      ? `Approve ${student.name}'s CIT-U ID? They will be able to post and accept quests.`
      : `Reject ${student.name}'s ID photo? They will see your reason and can send a new photo.`;
    if (!window.confirm(question)) return;
    setBusy(student.uid);
    setNotice("");
    setCardErrors((current) => ({ ...current, [student.uid]: "" }));
    try {
      const response = await fetch("/api/admin/id-checks", {
        method: "POST",
        headers: { Authorization: `Bearer ${await getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uid: student.uid, outcome, reason, submittedAt: student.submittedAt ?? "" }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 409) {
        // Someone else decided, or the student sent a new photo: show the latest list.
        await refresh();
        setNotice(data.message || "This ID changed. The list was refreshed.");
        return;
      }
      if (!response.ok) throw new Error(data.message || "Unable to save the decision.");
      setStudents((items) => items.filter((item) => item.uid !== student.uid));
      setNotice(outcome === "approve" ? `Approved ${student.name}. They can now post and accept quests.` : `Rejected ${student.name}'s photo. They'll see your reason.`);
    } catch (error) {
      setCardErrors((current) => ({ ...current, [student.uid]: errorText(error, "Unable to save the decision.") }));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <AdminPageHeading
        eyebrow="Verification"
        title="ID checks"
        description="Students send a photo of their CIT-U ID when they sign up. Approve it so they can post and accept quests."
        action={
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={status === "loading"}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon disabled:opacity-50"
          >
            <RefreshCw size={15} aria-hidden="true" /> Refresh
          </button>
        }
      />

      <AdminPanel className="mb-4 rounded-xl p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><IdCard size={16} aria-hidden="true" /> Before you approve, check that:</h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-slate-700">
          <li>the name on the ID matches the account name,</li>
          <li>it is a CIT-U student ID, and</li>
          <li>the photo is clear and nothing is cut off or covered.</li>
        </ul>
        <p className="mt-3 text-xs text-slate-600">Only admins can see these photos. Each photo is deleted as soon as you approve or reject it.</p>
      </AdminPanel>

      <p role="status" aria-live="polite" className={notice ? "mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-950" : "sr-only"}>
        {notice}
      </p>

      {status === "error" ? <div className="mb-4"><AdminErrorState message={loadError} onRetry={() => void refresh()} /></div> : null}
      {status === "loading" ? <AdminPanel className="rounded-xl"><AdminLoadingRows label="Loading ID checks" rows={3} columns={3} /></AdminPanel> : null}
      {status === "ready" && !students.length ? <AdminEmptyState>No IDs are waiting for review. New sign-ups will appear here.</AdminEmptyState> : null}

      {status === "ready" && students.length > 0 ? (
        <>
          <p className="mb-3 text-sm font-medium text-slate-700">{students.length} waiting · oldest first</p>
          <ul className="grid gap-4 xl:grid-cols-2">
            {students.map((student) => {
              const reason = reasons[student.uid] ?? "";
              const reasonOk = reason.trim().length >= ID_REASON_MIN;
              const isBusy = busy === student.uid;
              return (
                <li key={student.uid}>
                  <AdminPanel className="h-full space-y-4 rounded-xl p-4">
                    <IdPhoto uid={student.uid} name={student.name} getToken={getToken} />

                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className="text-lg font-semibold text-slate-950">{student.name}</h2>
                        <AdminStatusChip tone="warning">Waiting</AdminStatusChip>
                      </div>
                      <p className="break-all text-sm text-slate-700">{student.email || "No email on the account"}</p>
                      {student.course ? <p className="text-sm text-slate-700">{student.course}</p> : null}
                      <p className="mt-1 text-xs text-slate-600">
                        {student.submittedAt
                          ? `Sent ${formatAge(student.submittedAt)} · ${phTime.format(new Date(student.submittedAt))}`
                          : "Send time unknown"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void decide(student, "approve")}
                      disabled={Boolean(busy)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-maroon px-4 text-sm font-semibold text-white transition hover:bg-maroon-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon disabled:opacity-50"
                    >
                      {isBusy ? "Saving…" : "Approve ID"}
                    </button>

                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <label htmlFor={`reason-${student.uid}`} className="block text-xs font-semibold text-slate-800">
                        Not approving? Tell the student what to fix (they will see this)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ID_REJECT_REASONS.map((text) => (
                          <button
                            key={text}
                            type="button"
                            onClick={() => setReasons((current) => ({ ...current, [student.uid]: text }))}
                            className={`rounded-full border px-2.5 py-1 text-left text-xs transition ${reason === text ? "border-maroon bg-rose-50 text-maroon" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`}
                          >
                            {text}
                          </button>
                        ))}
                      </div>
                      <textarea
                        id={`reason-${student.uid}`}
                        value={reason}
                        maxLength={ID_REASON_MAX}
                        rows={2}
                        onChange={(event) => setReasons((current) => ({ ...current, [student.uid]: event.target.value }))}
                        className={`${adminInput} min-h-16 py-2`}
                      />
                      <button
                        type="button"
                        onClick={() => void decide(student, "reject")}
                        disabled={Boolean(busy) || !reasonOk}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-maroon bg-white px-4 text-sm font-semibold text-maroon transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon disabled:opacity-50"
                      >
                        Reject photo
                      </button>
                    </div>

                    {cardErrors[student.uid] ? <p role="alert" className="text-sm text-red-800">{cardErrors[student.uid]}</p> : null}
                  </AdminPanel>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { SubPage, Panel } from "@/components/profile/SubPage";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { auth, db } from "@/lib/auth/firebase";
import { COURSES } from "@/lib/auth/courses";
import { getProfileName } from "@/lib/auth/profile-name";
import { setUserBlocked, updateMyProfile } from "@/lib/quests/client";

type Blocked = { id: string; name: string };
const field = "w-full rounded-xl border border-field bg-white px-4 py-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <SubPage title="Settings"><Panel><p>Loading…</p></Panel></SubPage>;
  if (!user) return <SubPage title="Settings"><Panel><p>Please log in again.</p></Panel></SubPage>;
  // Keyed so the form state starts fresh for each signed-in account.
  return <SettingsForm key={user.uid} user={user} />;
}

function SettingsForm({ user }: { user: User }) {
  const [name, setName] = useState(() => getProfileName(user.displayName));
  const [course, setCourse] = useState("");
  const [note, setNote] = useState<{ kind: "ok" | "error"; text: string }>();
  const [busy, setBusy] = useState("");
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [blockedError, setBlockedError] = useState("");

  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    getDoc(doc(db, "users", user.uid)).then((snapshot) => { if (active) setCourse(String(snapshot.data()?.course ?? "")); }).catch(() => undefined);
    return () => { active = false; };
  }, [user.uid]);

  useEffect(() => {
    let active = true;
    getDocs(collection(db, "users", user.uid, "blocks"))
      .then((snapshot) => {
        if (!active) return;
        setBlocked(snapshot.docs.map((d) => ({ id: d.id, name: String(d.data().blockedName || "QuestGo User") })));
        setBlockedError("");
      })
      .catch(() => { if (active) setBlockedError("Could not load your blocked users."); });
    return () => { active = false; };
  }, [user.uid, refresh]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy("profile"); setNote(undefined);
    try {
      const saved = await updateMyProfile(name, course);
      await user.reload();
      setName(saved.fullName); setCourse(saved.course);
      setNote({ kind: "ok", text: "Profile saved." });
    } catch (error) { setNote({ kind: "error", text: error instanceof Error ? error.message : "Could not save your profile." }); }
    finally { setBusy(""); }
  }

  async function sendReset() {
    if (!user.email || busy) return;
    setBusy("reset"); setNote(undefined);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setNote({ kind: "ok", text: `Password reset link sent to ${user.email}.` });
    } catch { setNote({ kind: "error", text: "Could not send the reset email. Try again in a few minutes." }); }
    finally { setBusy(""); }
  }

  async function unblock(id: string) {
    if (busy) return;
    setBusy(id);
    try { await setUserBlocked(id, false); setRefresh((n) => n + 1); }
    catch (error) { setBlockedError(error instanceof Error ? error.message : "Could not unblock this user."); }
    finally { setBusy(""); }
  }

  return (
    <SubPage title="Settings" description="Manage your profile, password and blocked users.">
      {note && <p role={note.kind === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm font-semibold ${note.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{note.text}</p>}
      <Panel title="Profile">
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label htmlFor="settings-name" className="mb-1.5 block text-sm font-semibold">Full name</label>
            <input id="settings-name" className={field} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="settings-course" className="mb-1.5 block text-sm font-semibold">Course</label>
            <select id="settings-course" className={field} value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">Not specified</option>
              {course && !COURSES.includes(course) && <option value={course}>{course}</option>}
              {COURSES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <Button type="submit" disabled={busy === "profile"}>{busy === "profile" ? "Saving…" : "Save profile"}</Button>
        </form>
      </Panel>
      <Panel title="Password">
        <p className="mb-3 text-sm text-stone-600">We&apos;ll email a secure link to {user.email} so you can choose a new password.</p>
        <Button variant="outline" onClick={sendReset} disabled={busy === "reset"}>{busy === "reset" ? "Sending…" : "Email me a reset link"}</Button>
      </Panel>
      <Panel title="Blocked users">
        {blockedError && <p role="alert" className="mb-3 text-sm text-red-700">{blockedError}</p>}
        {!blocked.length && !blockedError && <p className="text-sm text-stone-600">You haven&apos;t blocked anyone. Blocked users can&apos;t accept your quests or message you.</p>}
        <ul className="divide-y divide-border">
          {blocked.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <span className="font-semibold">{item.name}</span>
              <Button size="sm" variant="outline" disabled={busy === item.id} onClick={() => unblock(item.id)}>{busy === item.id ? "Unblocking…" : "Unblock"}</Button>
            </li>
          ))}
        </ul>
      </Panel>
    </SubPage>
  );
}

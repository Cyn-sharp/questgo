"use client";

import { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { SubPage, Panel } from "@/components/profile/SubPage";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { isAllowedEmail } from "@/lib/auth/email-policy";

export default function VerificationPage() {
  const { user, isLoading } = useAuth();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  if (isLoading || !user) return <SubPage title="Verification"><Panel><p>{isLoading ? "Loading…" : "Please log in again."}</p></Panel></SubPage>;
  const official = isAllowedEmail(user.email);
  const ok = user.emailVerified && official;

  async function resend() {
    if (!user || sending) return;
    setSending(true); setNote("");
    try { await sendEmailVerification(user); setNote("Verification email sent. Check your inbox."); }
    catch { setNote("Could not send the email. Please wait a few minutes and try again."); }
    finally { setSending(false); }
  }

  return (
    <SubPage title="Verification" description="QuestGo is for CIT-U students. Your account is verified through your school email.">
      <Panel>
        <div className="flex items-start gap-3">
          {ok ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden /> : <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" aria-hidden />}
          <div>
            <p className="font-bold">{ok ? "Verified CIT-U account" : "Verification needed"}</p>
            <p className="mt-1 text-sm text-stone-600">{user.email}</p>
            <ul className="mt-3 space-y-1 text-sm">
              <li>{official ? "✓" : "✗"} Official CIT-U email address</li>
              <li>{user.emailVerified ? "✓" : "✗"} Email address confirmed</li>
            </ul>
            {!user.emailVerified && <Button className="mt-4" size="sm" onClick={resend} disabled={sending}>{sending ? "Sending…" : "Resend verification email"}</Button>}
            {note && <p role="status" className="mt-3 text-sm font-semibold">{note}</p>}
          </div>
        </div>
      </Panel>
    </SubPage>
  );
}

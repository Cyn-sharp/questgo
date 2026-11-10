"use client";

import { useState } from "react";
import { auth } from "@/lib/auth/firebase";
import type { Quest } from "@/types/quest";

export function PrintingFile({ quest, canOpen }: { quest: Quest; canOpen: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const file = quest.attachment;
  if (!file) return null;
  async function download() {
    if (pending || !file || !auth.currentUser) return;
    setPending(true); setError("");
    try {
      const response = await fetch(`/api/quests/${encodeURIComponent(quest.id)}/file`, { headers: { Authorization: `Bearer ${await auth.currentUser.getIdToken()}` } });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message || "Could not download file."); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = file.name;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) { setError(error instanceof Error ? error.message : "Download failed. Please retry."); }
    finally { setPending(false); }
  }
  return <section className="rounded-xl border p-4 space-y-2">
    <h2 className="font-bold">Printing file</h2>
    <p className="break-all">{file.name} · {(file.size / 1024).toFixed(1)} KB · {file.contentType}</p>
    {canOpen ? <button disabled={pending} onClick={download} className="btn-outline">{pending ? "Downloading…" : "Download Printing File"}</button> : <p className="text-sm">The file is private. Download access opens after you accept this quest.</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </section>;
}

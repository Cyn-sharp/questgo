"use client";

import { useEffect, useId, useRef, useState } from "react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import type { User } from "firebase/auth";
import { questRequest } from "@/lib/quests/client";
import { Button } from "@/components/ui/Button";

type Props = {
  questId: string;
  user: User;
  isRequester: boolean;
  isRunner: boolean;
  disabled: boolean;
};

export function HandoverQr({ questId, user, isRequester, isRunner, disabled }: Props) {
  if (isRequester) return <RequesterQr questId={questId} user={user} />;
  if (isRunner) return <RunnerScanner questId={questId} disabled={disabled} />;
  return null;
}

function RequesterQr({ questId, user }: { questId: string; user: User }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [receiptChecked, setReceiptChecked] = useState(false);
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [data, setData] = useState<{ qrPayload: string; shortCode: string } | null>(null);
  const [error, setError] = useState("");
  const unlocked = receiptChecked && paymentChecked;

  useEffect(() => {
    if (!unlocked) return;
    let active = true;
    void (async () => {
      try {
        const res = await fetch(`/api/quests/${encodeURIComponent(questId)}/handover-qr`, {
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
          cache: "no-store",
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || "Unable to load handover QR.");
        if (active) {
          setData(body);
          setError("");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load handover QR.");
      }
    })();
    return () => { active = false; };
  }, [questId, unlocked, user]);

  useEffect(() => {
    if (!unlocked || !data?.qrPayload || !canvasRef.current) return;
    void QRCode.toCanvas(canvasRef.current, data.qrPayload, { width: 220, margin: 2 });
  }, [data, unlocked]);

  return (
    <section aria-label="Handover QR code" className="space-y-3 rounded-xl border border-amber-300 bg-amber-50/70 p-4">
      <h3 className="font-bold text-maroon">Handover verification QR</h3>
      <p className="text-sm text-gray-700">
        Inspect your item or service and pay the runner first. Then check both boxes below to show your unique QR code for the runner to scan.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={receiptChecked} onChange={(e) => setReceiptChecked(e.target.checked)} />
        I received and checked the item or service.
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={paymentChecked} onChange={(e) => setPaymentChecked(e.target.checked)} />
        I paid the runner reward and any approved reimbursement.
      </label>

      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}

      {unlocked && data && (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center">
          <canvas ref={canvasRef} aria-label="Quest handover QR code" />
          <p className="text-xs text-gray-600">Backup code (if camera fails):</p>
          <p className="font-mono text-xl font-bold tracking-widest text-maroon">{data.shortCode}</p>
          <p className="text-xs text-gray-600">
            Waiting for runner to scan… you will be taken to the rating page automatically.
          </p>
        </div>
      )}
    </section>
  );
}

function RunnerScanner({ questId, disabled }: { questId: string; disabled: boolean }) {
  const scannerRegionId = useId().replaceAll(":", "-");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const submittingRef = useRef(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [shortCode, setShortCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function stopScanner() {
    const instance = scannerRef.current;
    scannerRef.current = null;
    if (instance) {
      try {
        await instance.stop();
        instance.clear();
      } catch { /* camera may already be stopped */ }
    }
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      const instance = scannerRef.current;
      scannerRef.current = null;
      if (instance) void instance.stop().catch(() => undefined);
    };
  }, []);

  async function submitCompletion(payload: { token?: string; shortCode?: string }) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    setError("");
    try {
      await questRequest(`/${encodeURIComponent(questId)}`, {
        action: "complete-by-qr",
        paymentConfirmed: true,
        ...payload,
      });
      await stopScanner();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify handover code.");
      submittingRef.current = false;
    } finally {
      setBusy(false);
    }
  }

  async function startCamera() {
    if (disabled || busy || !paymentConfirmed) return;
    setError("");
    setScanning(true);
    await new Promise((r) => setTimeout(r, 0));
    try {
      const scanner = new Html5Qrcode(scannerRegionId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          try {
            const parsed = JSON.parse(decodedText) as { questId?: string; token?: string };
            if (parsed.questId !== questId || !parsed.token) {
              setError("This QR code belongs to a different quest.");
              return;
            }
            void submitCompletion({ token: parsed.token });
          } catch {
            setError("Unrecognized QR code.");
          }
        },
        () => { /* ignore per-frame scan misses */ },
      );
    } catch {
      setError("Camera access failed or was denied. You can enter the 6-digit backup code below.");
      await stopScanner();
    }
  }

  return (
    <section aria-label="Scan requester handover QR" className="space-y-3 rounded-xl border border-amber-300 bg-amber-50/70 p-4">
      <h3 className="font-bold text-maroon">Confirm handover with requester QR</h3>
      <p className="text-sm text-gray-700">
        Once you hand over the item and receive payment, scan the requester&apos;s QR code to mark the quest complete.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={paymentConfirmed} onChange={(e) => setPaymentConfirmed(e.target.checked)} />
        I received the agreed reward and any approved reimbursement.
      </label>

      <div className="flex flex-wrap gap-2">
        {!scanning ? (
          <Button disabled={disabled || busy || !paymentConfirmed} onClick={() => void startCamera()}>
            Scan Handover QR
          </Button>
        ) : (
          <Button variant="outline" onClick={() => void stopScanner()}>Close Camera</Button>
        )}
      </div>

      {scanning && <div id={scannerRegionId} className="mx-auto max-w-xs overflow-hidden rounded-xl border bg-black" />}

      <div className="flex flex-wrap items-end gap-2 border-t border-amber-200 pt-2">
        <label className="text-xs font-medium text-gray-700">
          Or enter 6-digit backup code
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="mt-1 block w-36 rounded-lg border bg-white px-3 py-2 font-mono text-sm"
          />
        </label>
        <Button
          variant="outline"
          disabled={disabled || busy || !paymentConfirmed || shortCode.length !== 6}
          onClick={() => void submitCompletion({ shortCode })}
        >
          {busy ? "Verifying…" : "Verify Code"}
        </Button>
      </div>

      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
    </section>
  );
}
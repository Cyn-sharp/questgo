"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, BellRing, Check, CheckCircle2, Info, Loader2, MessageCircle, MonitorSmartphone, Send, Sparkles, TriangleAlert, Activity } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { useQuestNotifications } from "@/components/quest/QuestNotifications";
import { NOTIFICATION_CATEGORIES, toggleCategory, type NotificationPrefs } from "@/lib/notifications/preferences";
import { deviceAlertState, disableDeviceAlerts, enableDeviceAlerts, showDeviceAlert, subscribeDeviceAlerts, type DeviceAlertState } from "@/lib/notifications/device";

const card = "overflow-hidden rounded-2xl border border-white/40 bg-white/95 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.12)]";

export function NotificationSettings() {
  const { prefs, prefsLoaded, prefsError, savePrefs } = useQuestNotifications();
  const [status, setStatus] = useState<{ text: string; tone: "saving" | "saved" | "error" } | null>(null);

  async function update(next: NotificationPrefs) {
    setStatus({ text: "Saving…", tone: "saving" });
    try {
      await savePrefs(next);
      setStatus({ text: "Saved to your account", tone: "saved" });
    } catch {
      setStatus({ text: "Could not save. Check your connection and try again.", tone: "error" });
    }
  }

  const activeCount = [prefs.messages, prefs.questUpdates, prefs.newQuests].filter(Boolean).length;

  return (
    <div className="page-container max-w-3xl py-6 sm:py-10">
      <Link href="/profile" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Profile
      </Link>

      {/* Hero */}
      <section className="relative mt-3 mb-4 sm:mb-5 overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="relative bg-gradient-to-br from-[#7a1f32] via-[#5f1727] to-[#380913] px-5 sm:px-6 py-6 sm:py-7 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_40%,rgba(201,162,39,0.28)_0%,transparent_55%)]" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Bell className="h-6 w-6 sm:h-7 sm:w-7 text-[#f6ecc8]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-[28px] font-extrabold leading-tight">Notifications</h1>
              <p className="mt-1 text-sm text-white/80">Choose what QuestGo alerts you about.</p>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2.5 bg-white px-5 sm:px-6 py-3.5 text-[12px] sm:text-sm text-[#4a4340]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a227]" />
          <p>Unread badges on <span className="font-semibold text-[#161414]">My Quests</span> and <span className="font-semibold text-[#161414]">Messages</span> always stay on, so you never miss a conversation.</p>
        </div>
      </section>

      {/* Account alerts */}
      <section aria-labelledby="alerts-heading" className={card}>
        <header className="flex items-center justify-between gap-3 border-b border-[#f0ece6] px-4 sm:px-5 py-3.5">
          <div>
            <h2 id="alerts-heading" className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#7a1f32]">Alerts</h2>
            <p className="text-[11px] sm:text-xs text-[#4a4340]">Saved to your account · applies on every device</p>
          </div>
          {prefsLoaded && <span className="rounded-full bg-[#f6ecc8] px-2.5 py-1 text-[11px] font-bold text-[#7a1f32]">{activeCount} of 3 on</span>}
        </header>

        {!prefsLoaded ? (
          <div aria-busy="true" aria-label="Loading notification settings" className="divide-y divide-[#f0ece6]">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-center gap-4 px-5 py-4">
                <div className="h-11 w-11 animate-pulse rounded-xl bg-[#f4f2ef]" />
                <div className="flex-1 space-y-2"><div className="h-3.5 w-1/3 animate-pulse rounded bg-[#f4f2ef]" /><div className="h-3 w-2/3 animate-pulse rounded bg-[#f4f2ef]" /></div>
                <div className="h-7 w-12 animate-pulse rounded-full bg-[#f4f2ef]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[#f0ece6]">
            <Switch id="pref-messages" icon={MessageCircle} iconBg="bg-[#fdf0f2]" iconColor="text-[#7a1f32]"
              label="Chat messages" description="New messages in your quest chats"
              checked={prefs.messages} onChange={(messages) => update({ ...prefs, messages })} />
            <Switch id="pref-updates" icon={Activity} iconBg="bg-[#f4f2ef]" iconColor="text-[#161414]"
              label="Quest status updates" description="Accepted, started, completed, cancelled or settlement steps"
              checked={prefs.questUpdates} onChange={(questUpdates) => update({ ...prefs, questUpdates })} />
            <div>
              <Switch id="pref-new" icon={Sparkles} iconBg="bg-[#f6ecc8]" iconColor="text-[#b08b1e]"
                label="New quests posted" description="Quests you could run. Off by default — the marketplace can get busy"
                checked={prefs.newQuests} onChange={(newQuests) => update({ ...prefs, newQuests })} />
              {prefs.newQuests && (
                <fieldset className="mx-4 sm:mx-5 mb-4 rounded-xl bg-[#fbf8f0] p-3.5 sm:ml-[4.75rem]">
                  <legend className="sr-only">Categories for new-quest alerts</legend>
                  <p className="text-xs font-bold text-[#161414]">Categories</p>
                  <p className="text-[11px] text-[#4a4340]">{prefs.newQuestCategories.length ? `Only ${prefs.newQuestCategories.join(", ")}` : "All categories — tap to narrow it down"}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {NOTIFICATION_CATEGORIES.map((category) => {
                      const selected = prefs.newQuestCategories.includes(category);
                      return (
                        <button key={category} type="button" aria-pressed={selected} onClick={() => update(toggleCategory(prefs, category))}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] ${selected ? "border-[#7a1f32] bg-[#7a1f32] text-white shadow-[0_4px_10px_rgba(122,31,50,0.25)]" : "border-[#d8d3cc] bg-white text-[#4a4340] hover:border-[#7a1f32] hover:text-[#7a1f32]"}`}>
                          {selected && <Check aria-hidden="true" className="h-3.5 w-3.5" />}{category}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
            </div>
          </div>
        )}

        <div role="status" aria-live="polite" className="min-h-0">
          {(status || prefsError) && (
            <div className={`flex items-center gap-2 border-t border-[#f0ece6] px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold ${status?.tone === "error" || (!status && prefsError) ? "bg-[#fdecec]/60 text-[#b42318]" : status?.tone === "saved" ? "text-[#1f7a4d]" : "text-[#4a4340]"}`}>
              {status?.tone === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : status?.tone === "saved" ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
              {status?.text || prefsError}
            </div>
          )}
        </div>
      </section>

      <DeviceAlerts />

      <p className="mt-6 text-center text-[11px] font-medium text-white/60">Alerts work while QuestGo is open in a browser tab.</p>
    </div>
  );
}

const DEVICE_BADGE: Record<DeviceAlertState, { text: string; className: string }> = {
  checking: { text: "Checking", className: "bg-[#f4f2ef] text-[#4a4340]" },
  unsupported: { text: "Not supported", className: "bg-[#f4f2ef] text-[#4a4340]" },
  default: { text: "Off", className: "bg-[#f4f2ef] text-[#4a4340]" },
  denied: { text: "Blocked", className: "bg-[#fdecec] text-[#b42318]" },
  off: { text: "Off", className: "bg-[#f4f2ef] text-[#4a4340]" },
  on: { text: "On", className: "bg-[#e6f4ec] text-[#1f7a4d]" },
};

function DeviceAlerts() {
  const state = useSyncExternalStore(subscribeDeviceAlerts, deviceAlertState, () => "checking" as const);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function change(on: boolean) {
    setMessage(null);
    if (!on) return disableDeviceAlerts();
    const result = await enableDeviceAlerts();
    if (result === "denied") setMessage({ text: "Your browser blocked notifications for QuestGo.", ok: false });
  }

  function test() {
    const shown = showDeviceAlert("This is how QuestGo alerts will look.", "questgo-test", () => {});
    setMessage(shown
      ? { text: "Sent! Look at the corner of your screen.", ok: true }
      : { text: "This browser could not show a system notification. In-app alerts still work.", ok: false });
  }

  const hint = {
    checking: "Checking this browser…",
    unsupported: "This browser doesn't support system notifications. In-app alerts and badges still work.",
    denied: "Allow notifications in your browser's site settings (the icon next to the address bar), then come back.",
    default: "Your browser will ask for permission when you turn this on.",
    off: null,
    on: null,
  }[state];
  const badge = DEVICE_BADGE[state];

  return (
    <section aria-labelledby="device-heading" className={`${card} mt-4 sm:mt-5`}>
      <header className="flex items-center justify-between gap-3 border-b border-[#f0ece6] px-4 sm:px-5 py-3.5">
        <div>
          <h2 id="device-heading" className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#7a1f32]">This device</h2>
          <p className="text-[11px] sm:text-xs text-[#4a4340]">Set separately on each browser</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.className}`}>{badge.text}</span>
      </header>

      <Switch id="pref-device" icon={MonitorSmartphone} iconBg="bg-[#f6f0e8]" iconColor="text-[#7a1f32]"
        label="System notifications" description="Pop-ups from your computer or phone when QuestGo is in another tab or minimised"
        checked={state === "on"} disabled={state === "checking" || state === "unsupported" || state === "denied"} onChange={change} />

      {hint && (
        <div className={`mx-4 sm:mx-5 mb-4 flex items-start gap-2 rounded-xl px-3.5 py-3 text-xs sm:text-sm ${state === "denied" ? "bg-[#fdecec]/60 text-[#b42318]" : "bg-[#fbf8f0] text-[#4a4340]"}`}>
          {state === "denied" ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a227]" />}
          <p>{hint}</p>
        </div>
      )}

      {state === "on" && (
        <div className="flex flex-col gap-3 border-t border-[#f0ece6] px-4 sm:px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#4a4340]">
            <BellRing className="h-4 w-4 text-[#c9a227]" /> Check that pop-ups reach you
          </div>
          <button type="button" onClick={test}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7a1f32] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(122,31,50,0.28)] transition-all duration-300 hover:bg-[#5f1727] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] focus-visible:ring-offset-2">
            <Send className="h-4 w-4" /> Send a test
          </button>
        </div>
      )}

      <div role="status" aria-live="polite">
        {message && (
          <p className={`flex items-center gap-2 border-t border-[#f0ece6] px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold ${message.ok ? "text-[#1f7a4d]" : "text-[#b42318]"}`}>
            {message.ok ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}{message.text}
          </p>
        )}
      </div>
    </section>
  );
}

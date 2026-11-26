"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Switch } from "@/components/ui/Switch";
import { useQuestNotifications } from "@/components/quest/QuestNotifications";
import { NOTIFICATION_CATEGORIES, toggleCategory, type NotificationPrefs } from "@/lib/notifications/preferences";
import { deviceAlertState, disableDeviceAlerts, enableDeviceAlerts, showDeviceAlert, subscribeDeviceAlerts } from "@/lib/notifications/device";

export function NotificationSettings() {
  const { prefs, prefsLoaded, prefsError, savePrefs } = useQuestNotifications();
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);

  async function update(next: NotificationPrefs) {
    setStatus({ text: "Saving…", error: false });
    try {
      await savePrefs(next);
      setStatus({ text: "Saved. Applies on all your devices.", error: false });
    } catch {
      setStatus({ text: "Could not save. Check your connection and try again.", error: true });
    }
  }

  return (
    <div className="page-container max-w-3xl py-8 text-white">
      <Link href="/profile" className="underline">Back to Profile</Link>
      <h1 className="mt-4 text-3xl font-bold">Notifications</h1>
      <p className="mt-2">Choose what QuestGo alerts you about. Unread badges on My Quests and Messages always stay on, so you never lose a message.</p>

      <section aria-labelledby="in-app-heading" className="mt-6 rounded-2xl bg-white p-5 text-gray-900 shadow-lg">
        <h2 id="in-app-heading" className="text-lg font-bold">Alerts</h2>
        {!prefsLoaded ? (
          <div aria-busy="true" aria-label="Loading notification settings" className="space-y-4 py-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <Switch id="pref-messages" label="Chat messages" description="A new message in one of your quest chats."
              checked={prefs.messages} onChange={(messages) => update({ ...prefs, messages })} />
            <Switch id="pref-updates" label="Quest status updates" description="Your quest is accepted, started, completed, cancelled or needs a settlement step."
              checked={prefs.questUpdates} onChange={(questUpdates) => update({ ...prefs, questUpdates })} />
            <div>
              <Switch id="pref-new" label="New quests posted" description="Someone posts a quest you could run. Off by default because the marketplace can be busy."
                checked={prefs.newQuests} onChange={(newQuests) => update({ ...prefs, newQuests })} />
              {prefs.newQuests && (
                <fieldset className="pb-3">
                  <legend className="text-sm font-semibold text-gray-700">Only these categories</legend>
                  <p className="text-xs text-gray-500">{prefs.newQuestCategories.length ? "Alerts for the selected categories." : "None selected: alerts for every category."}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {NOTIFICATION_CATEGORIES.map((category) => {
                      const selected = prefs.newQuestCategories.includes(category);
                      return (
                        <button key={category} type="button" aria-pressed={selected} onClick={() => update(toggleCategory(prefs, category))}
                          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] ${selected ? "border-[#7a1f32] bg-[#7a1f32] text-white" : "border-gray-300 bg-white text-gray-700 hover:border-[#7a1f32]"}`}>
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
            </div>
          </div>
        )}
        {prefsError && <p role="alert" className="mt-2 text-sm text-red-700">{prefsError}</p>}
        <p role="status" aria-live="polite" className={`mt-2 min-h-5 text-sm ${status?.error ? "text-red-700" : "text-gray-600"}`}>{status?.text}</p>
      </section>

      <DeviceAlerts />
    </div>
  );
}

function DeviceAlerts() {
  const state = useSyncExternalStore(subscribeDeviceAlerts, deviceAlertState, () => "checking" as const);
  const [message, setMessage] = useState("");

  async function change(on: boolean) {
    setMessage("");
    if (!on) return disableDeviceAlerts();
    const result = await enableDeviceAlerts();
    if (result === "denied") setMessage("Your browser blocked notifications for QuestGo.");
  }

  function test() {
    const shown = showDeviceAlert("This is how QuestGo alerts will look.", "questgo-test", () => {});
    setMessage(shown ? "Test notification sent." : "This browser could not show a system notification. In-app alerts still work.");
  }

  const explanation = {
    checking: "Checking this browser…",
    unsupported: "This browser does not support system notifications. In-app alerts and badges still work.",
    denied: "Notifications are blocked for QuestGo. Allow them in your browser's site settings (the icon next to the address bar), then come back here.",
    default: "Your browser will ask for permission when you turn this on.",
    off: "Turned off on this device.",
    on: "On for this device.",
  }[state];

  return (
    <section aria-labelledby="device-heading" className="mt-6 rounded-2xl bg-white p-5 text-gray-900 shadow-lg">
      <h2 id="device-heading" className="text-lg font-bold">This device</h2>
      <Switch id="pref-device" label="System notifications"
        description="Show alerts from your computer or phone when QuestGo is open in another tab or minimised. Set separately on each device."
        checked={state === "on"} disabled={state === "checking" || state === "unsupported" || state === "denied"} onChange={change} />
      <p className="text-sm text-gray-600">{explanation}</p>
      {state === "on" && <button type="button" onClick={test} className="btn-outline mt-3">Send a test notification</button>}
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-gray-700">{message}</p>
      <p className="mt-2 text-xs text-gray-500">QuestGo needs to be open in a browser tab to alert you. Alerts after you close QuestGo are not available yet.</p>
    </section>
  );
}

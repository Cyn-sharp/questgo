// System (operating-system) alerts for this browser only. Permission is
// granted per browser, so the on/off choice is kept per browser as well.
// These appear while QuestGo is open in a tab, including a background tab.

export type DeviceAlertState = "checking" | "unsupported" | "default" | "denied" | "off" | "on";

const KEY = "questgo:system-alerts";
const EVENT = "questgo:system-alerts-change";

function supported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function deviceAlertState(): DeviceAlertState {
  if (!supported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "default") return "default";
  try { return localStorage.getItem(KEY) === "off" ? "off" : "on"; } catch { return "on"; }
}

// Permission can also change in the browser's site settings, so check again on focus.
export function subscribeDeviceAlerts(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("focus", onChange);
  };
}

function remember(value: "on" | "off") {
  try { localStorage.setItem(KEY, value); } catch { /* Storage disabled: permission alone decides. */ }
  window.dispatchEvent(new Event(EVENT));
}

export async function enableDeviceAlerts() {
  if (!supported()) return deviceAlertState();
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission === "granted") remember("on");
  else window.dispatchEvent(new Event(EVENT));
  return deviceAlertState();
}

export function disableDeviceAlerts() {
  remember("off");
}

// Returns false when nothing was shown. Some mobile browsers only allow
// notifications from a service worker and throw here; the in-app toast and
// the unread badges still cover those devices.
export function showDeviceAlert(text: string, tag: string, onOpen: () => void) {
  if (deviceAlertState() !== "on") return false;
  try {
    const alert = new Notification("QuestGo", { body: text, tag, icon: "/logo.svg" });
    alert.onclick = () => { window.focus(); onOpen(); alert.close(); };
    return true;
  } catch {
    return false;
  }
}

import { useCallback, useSyncExternalStore } from "react";
import { addAlert, markAllRead, parseAlerts, type AlertRecord } from "./history";

// One shared list per account in localStorage. Other tabs pick up changes
// through the "storage" event, so marking read in one tab clears the others.

const EVENT = "questgo:alerts-change";
const EMPTY: AlertRecord[] = [];
const cache = new Map<string, { raw: string | null; list: AlertRecord[] }>();
const key = (uid: string) => `questgo:alerts:${uid}`;

function load(uid: string): AlertRecord[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(key(uid)); } catch { /* Storage disabled: keep the in-memory list. */ return cache.get(uid)?.list ?? EMPTY; }
  const cached = cache.get(uid);
  // Return the same array until the stored text changes, as useSyncExternalStore requires.
  if (cached && cached.raw === raw) return cached.list;
  const list = parseAlerts(raw, Date.now());
  cache.set(uid, { raw, list });
  return list;
}

function save(uid: string, list: AlertRecord[]) {
  const raw = JSON.stringify(list);
  cache.set(uid, { raw, list });
  try { localStorage.setItem(key(uid), raw); } catch { /* Still shown for this visit. */ }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function recordAlert(uid: string, record: Omit<AlertRecord, "read">) {
  save(uid, addAlert(load(uid), { ...record, read: false }));
}

export function useAlertHistory(uid: string) {
  const alerts = useSyncExternalStore(subscribe, () => load(uid), () => EMPTY);
  const readAll = useCallback(() => save(uid, markAllRead(load(uid))), [uid]);
  const clear = useCallback(() => save(uid, []), [uid]);
  return { alerts, readAll, clear };
}

// Short-lived per-instance cache of account details, so a burst of requests (chat, location updates)
// costs one account lookup instead of one per request. Revocation and suspension are still enforced
// on every request by the token check; only the display name and email flags can be this stale.
export type CachedActor = { uid: string; name: string; email?: string | null; emailVerified: boolean; disabled: boolean };

export function createActorCache(ttlMs: number, now: () => number = Date.now, maxEntries = 1000) {
  const entries = new Map<string, { at: number; actor: CachedActor }>();
  return {
    get(uid: string) {
      const hit = entries.get(uid);
      if (!hit) return undefined;
      if (now() - hit.at >= ttlMs) { entries.delete(uid); return undefined; }
      return hit.actor;
    },
    set(actor: CachedActor) {
      if (entries.size >= maxEntries) entries.clear();
      entries.set(actor.uid, { at: now(), actor });
    },
    forget(uid: string) { entries.delete(uid); },
  };
}

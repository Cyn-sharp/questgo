import type { Firestore } from "firebase-admin/firestore";
import { QuestError } from "./policy.ts";

// Fixed-window counter. Pure so it can be unit tested without Firestore.
export function nextWindow(state: { start?: number; count?: number } | undefined, now: number, limit: number, windowMs: number) {
  const fresh = !state?.start || now - state.start >= windowMs;
  const start = fresh ? now : state!.start!;
  const count = fresh ? 1 : (state?.count ?? 0) + 1;
  return { start, count, allowed: count <= limit };
}

export function rateLimiter(db: Firestore) {
  return {
    async hit(uid: string, key: string, limit: number, windowMs: number) {
      const ref = db.collection("rateLimits").doc(`${uid}_${key}`);
      await db.runTransaction(async (tx) => {
        const now = Date.now();
        const next = nextWindow((await tx.get(ref)).data(), now, limit, windowMs);
        if (!next.allowed) throw new QuestError("You're doing that too often. Please wait a while and try again.", 429);
        tx.set(ref, { start: next.start, count: next.count });
      });
    },
  };
}

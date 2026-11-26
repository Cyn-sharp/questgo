import { adminAuth, adminDb } from "@/lib/auth/firebase-admin";
import { isAllowedEmail } from "@/lib/auth/email-policy";
import { idLockedMessage, type IdLockedAction } from "@/lib/auth/id-check";
import { readIdCheck } from "@/lib/auth/id-check-server";
import { QuestError } from "./policy";
import { questService } from "./service";
import { safetyService } from "./safety-service";
import { rateLimiter } from "./ratelimit";
import { auditService } from "./audit";
import { runnerService } from "./runner-service";
import { createActorCache } from "./actor-cache";
import { questBucket } from "./storage";

export const audit = auditService(adminDb);
export const safety = safetyService(adminDb, audit);
export const quests = questService(adminDb, safety, {
  remove: async (path) => { await questBucket().file(path).delete({ ignoreNotFound: true }); },
});
export const runners = runnerService(adminDb, audit);
export const limiter = rateLimiter(adminDb);

const actors = createActorCache(30_000);
// Call after changing an account's name so the next request sees it immediately.
export const forgetActor = (uid: string) => actors.forget(uid);

export async function verifiedActor(request: Request) {
  const bearer = request.headers.get("authorization");
  if (!bearer?.startsWith("Bearer ")) throw new QuestError("Please log in again.", 401);
  try {
    const token = await adminAuth.verifyIdToken(bearer.slice(7), true);
    if (!token.email_verified) throw new QuestError("Verify your email first.", 403);
    let account = actors.get(token.uid);
    if (!account) {
      const record = await adminAuth.getUser(token.uid);
      account = { uid: record.uid, name: record.displayName?.trim() || "QuestGo User", email: record.email, emailVerified: record.emailVerified, disabled: record.disabled };
      actors.set(account);
    }
    if (account.disabled || !account.emailVerified || !isAllowedEmail(account.email)) throw new QuestError("This account cannot access quests.", 403);
    return { uid: account.uid, name: account.name };
  } catch (error) {
    if (error instanceof QuestError) throw error;
    throw new QuestError("Your session is invalid. Please log in again.", 401);
  }
}

/** Posting and accepting quests need an admin-approved CIT-U ID. Admins always pass. */
export async function requireApprovedId(uid: string, action: IdLockedAction) {
  const idCheck = await readIdCheck(uid);
  if (!idCheck.canPostAndAccept) throw new QuestError(idLockedMessage(idCheck.state, action), 403);
}

export function questId(value: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new QuestError("Invalid quest ID.");
  return value;
}

export async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new QuestError("Missing request body.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16000) { await reader.cancel(); throw new QuestError("Request is too large.", 413); }
    chunks.push(value);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(text) as Record<string, unknown>; }
  catch { throw new QuestError("Invalid request body."); }
}

export function apiError(error: unknown) {
  if (error instanceof QuestError) return Response.json({ message: error.message }, { status: error.status });
  console.error("Quest operation failed", error);
  return Response.json({ message: "Unable to complete this request. Please try again." }, { status: 500 });
}
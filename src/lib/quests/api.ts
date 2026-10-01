import { adminAuth, adminDb } from "@/lib/auth/firebase-admin";
import { QuestError } from "./policy";
import { questService } from "./service";

export const quests = questService(adminDb);

export async function verifiedActor(request: Request) {
  const bearer = request.headers.get("authorization");
  if (!bearer?.startsWith("Bearer ")) throw new QuestError("Please log in again.", 401);
  try {
    const token = await adminAuth.verifyIdToken(bearer.slice(7), true);
    if (!token.email_verified) throw new QuestError("Verify your email first.", 403);
    const account = await adminAuth.getUser(token.uid);
    if (account.disabled || !account.emailVerified) throw new QuestError("This account cannot access quests.", 403);
    return { uid: account.uid, name: account.displayName?.trim() || "QuestGo User" };
  } catch (error) {
    if (error instanceof QuestError) throw error;
    throw new QuestError("Your session is invalid. Please log in again.", 401);
  }
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

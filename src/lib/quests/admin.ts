import { adminAuth } from "@/lib/auth/firebase-admin";
import { verifiedActor } from "./api";
import { QuestError } from "./policy";
export async function verifiedAdmin(request: Request) {
  const actor = await verifiedActor(request);
  const account = await adminAuth.getUser(actor.uid);
  if (account.customClaims?.admin !== true) throw new QuestError("Administrator access is required.", 403);
  return actor;
}

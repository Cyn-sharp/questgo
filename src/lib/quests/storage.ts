import { getStorage } from "firebase-admin/storage";
import { adminAuth } from "@/lib/auth/firebase-admin";
import { QuestError } from "./policy";

export function questBucket() {
  const name = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!name) throw new QuestError("Printing uploads are not configured. Please contact the QuestGo team.", 503);
  return getStorage(adminAuth.app).bucket(name);
}

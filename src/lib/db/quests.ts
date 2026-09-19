import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/auth/firebase";
import type { Quest } from "@/types/quest";

const questsCollection = collection(db, "quests");

function getTimestampMillis(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis();
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime())
      ? date.getTime()
      : null;
  }
  return null;
}

export async function createQuest(
  questData: Omit<
    Quest,
    | "id"
    | "requesterId"
    | "createdAt"
    | "expiresAt"
    | "status"
    | "acceptedAt"
    | "completedAt"
  >,
) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be logged in to post a quest.");
  }

  const now = Timestamp.now();

  const expiresAt = Timestamp.fromMillis(
    now.toMillis() + 30 * 60 * 1000,
  );

  const docRef = await addDoc(questsCollection, {
    ...questData,
    requesterId: currentUser.uid,

    status: "available",

    createdAt: serverTimestamp(),
    expiresAt,
  });

  return docRef.id;
}

export async function getAvailableQuests(): Promise<Quest[]> {
  const q = query(
    questsCollection,
    where("status", "==", "available"),
  );

  const snapshot = await getDocs(q);

  const now = Date.now();

  const quests = snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as Quest[];

  return quests
    .filter((quest) => {
      const expiresAt = getTimestampMillis(quest.expiresAt);
      return quest.status === "available" && expiresAt !== null && expiresAt > now;
    }) as Quest[];
}

export function getQuestExpirationMillis(quest: Quest): number | null {
  return getTimestampMillis(quest.expiresAt);
}

export async function getQuestById(
  questId: string,
): Promise<Quest | null> {
  const questRef = doc(db, "quests", questId);

  const snapshot = await getDoc(questRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Quest;
}
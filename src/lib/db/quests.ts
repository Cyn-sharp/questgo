import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
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

export async function acceptQuest(questId: string, userId: string) {
  const questRef = doc(db, "quests", questId);
  const snapshot = await getDoc(questRef);

  if (!snapshot.exists()) {
    throw new Error("Quest no longer exists.");
  }

  const quest = snapshot.data() as Quest;

  if (quest.requesterId === userId) {
    throw new Error("You cannot accept your own quest.");
  }

  if (quest.status !== "available") {
    throw new Error("This quest is no longer available.");
  }

  await updateDoc(questRef, {
    questRunnerId: userId,
    status: "accepted",
    acceptedAt: serverTimestamp(),
  });
}

export async function cancelQuest(questId: string, userId: string) {
  const questRef = doc(db, "quests", questId);
  const snapshot = await getDoc(questRef);

  if (!snapshot.exists()) {
    throw new Error("Quest not found.");
  }

  const quest = snapshot.data() as Quest;

  if (quest.requesterId !== userId) {
    throw new Error("You can only cancel quests you posted.");
  }

  if (quest.status === "completed" || quest.status === "cancelled") {
    throw new Error("This quest can no longer be cancelled.");
  }

  await updateDoc(questRef, {
    status: "cancelled",
    cancelledAt: serverTimestamp(),
    questRunnerId: null,
  });
}

export async function getMyRequests(userId: string): Promise<Quest[]> {
  const q = query(questsCollection, where("requesterId", "==", userId));
  const snapshot = await getDocs(q);
  const quests = snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as Quest[];

  return quests
    .sort((a, b) => {
      const aTime = getTimestampMillis(a.createdAt) ?? 0;
      const bTime = getTimestampMillis(b.createdAt) ?? 0;
      return bTime - aTime;
    });
}

export async function markQuestCompleted(questId: string, userId: string) {
  const questRef = doc(db, "quests", questId);
  const snapshot = await getDoc(questRef);

  if (!snapshot.exists()) {
    throw new Error("Quest not found.");
  }

  const quest = snapshot.data() as Quest;

  if (quest.questRunnerId && quest.questRunnerId !== userId) {
    throw new Error("You are not the assigned runner for this quest.");
  }

  await updateDoc(questRef, {
    status: "completed",
    completedAt: serverTimestamp(),
    questRunnerId: userId,
  });
}

// Count of available (open) quests on the platform
export async function getAvailableQuestsCount(): Promise<number> {
  const quests = await getAvailableQuests();
  return quests.length;
}

// Count of quests the logged-in user has POSTED and is still active
export async function getMyActiveRequestsCount(userId: string): Promise<number> {
  const q = query(
    questsCollection,
    where("requesterId", "==", userId),
    where("status", "in", ["available", "accepted", "in_progress"]),
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// Count of all quests the logged-in user has posted
export async function getMyPostedQuestsCount(userId: string): Promise<number> {
  const q = query(
    questsCollection,
    where("requesterId", "==", userId),
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// Count of quests the logged-in user has COMPLETED (as a runner)
export async function getCompletedQuestsCount(userId: string): Promise<number> {
  const q = query(
    questsCollection,
    where("questRunnerId", "==", userId),
    where("status", "==", "completed"),
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// Total earnings from completed quests (as a runner)
export async function getQuestEarnings(userId: string): Promise<number> {
  const q = query(
    questsCollection,
    where("questRunnerId", "==", userId),
    where("status", "==", "completed"),
  );
  const snapshot = await getDocs(q);

  let total = 0;
  snapshot.forEach((doc) => {
    const data = doc.data() as Quest;
    total += Number(data.reward) || 0;
  });
  return total;
}

// Fetch a limited number of recent available quests (for home preview)
export async function getRecentAvailableQuests(count = 3): Promise<Quest[]> {
  const all = await getAvailableQuests();
  // Sort by createdAt desc (newest first) and slice
  return all
    .sort((a, b) => {
      const aTime = getTimestampMillis(a.createdAt) ?? 0;
      const bTime = getTimestampMillis(b.createdAt) ?? 0;
      return bTime - aTime;
    })
    .slice(0, count);
}
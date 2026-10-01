import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/auth/firebase";
import type { Quest } from "@/types/quest";

import { questRequest } from "@/lib/quests/client";

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
  const result = await questRequest("", questData);
  if (!result.id) throw new Error("The server did not return the new quest.");
  return result.id;
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

export async function acceptQuest(questId: string) {
  await questRequest(`/${encodeURIComponent(questId)}`, { action: "accept" });
}

export async function cancelQuest(questId: string) {
  await questRequest(`/${encodeURIComponent(questId)}`, { action: "cancel" });
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

export async function markQuestCompleted(questId: string) {
  await questRequest(`/${encodeURIComponent(questId)}`, { action: "request-completion" });
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
  const now = Date.now();

  return snapshot.docs.filter((document) => {
    const quest = document.data() as Quest;
    if (quest.status !== "available") return true;

    const expiresAt = getTimestampMillis(quest.expiresAt);
    return expiresAt !== null && expiresAt > now;
  }).length;
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
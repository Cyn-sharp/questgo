import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/auth/firebase";
import type { Quest } from "@/types/quest";

export type QuestRatingInput = {
  questId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
};

export async function submitQuestRating({
  questId,
  reviewerId,
  revieweeId,
  rating,
  comment,
}: QuestRatingInput) {
  if (!questId || !reviewerId || !revieweeId) {
    throw new Error("Missing rating details.");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Please choose a rating between 1 and 5 stars.");
  }

  const questRef = doc(db, "quests", questId);
  const questSnapshot = await getDoc(questRef);

  if (!questSnapshot.exists()) {
    throw new Error("This quest could not be found.");
  }

  const quest = questSnapshot.data() as Quest;

  if (quest.status !== "completed") {
    throw new Error("You can only rate completed quests.");
  }

  if (quest.requesterId !== reviewerId && quest.questRunnerId !== reviewerId) {
    throw new Error("You did not participate in this quest.");
  }

  const expectedRevieweeId =
    quest.requesterId === reviewerId ? quest.questRunnerId : quest.requesterId;

  if (!expectedRevieweeId || revieweeId !== expectedRevieweeId) {
    throw new Error("This rating is being submitted to the wrong person.");
  }

  const existingRatingsQuery = query(
    collection(db, "ratings"),
    where("questId", "==", questId),
    where("reviewerId", "==", reviewerId),
  );

  const existingRatings = await getDocs(existingRatingsQuery);
  if (!existingRatings.empty) {
    throw new Error("You already submitted a rating for this quest.");
  }

  const trimmedComment = comment?.trim() ?? "";

  const ratingDoc = await addDoc(collection(db, "ratings"), {
    questId,
    reviewerId,
    revieweeId,
    rating,
    comment: trimmedComment,
    createdAt: serverTimestamp(),
  });

  const revieweeRatingsQuery = query(
    collection(db, "ratings"),
    where("revieweeId", "==", revieweeId),
  );

  const allRatings = await getDocs(revieweeRatingsQuery);
  let totalRating = 0;
  let ratingCount = 0;

  allRatings.forEach((snapshot) => {
    const value = snapshot.data();
    if (typeof value.rating === "number") {
      totalRating += value.rating;
      ratingCount += 1;
    }
  });

  const averageRating = ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(1)) : 0;

  await setDoc(
    doc(db, "users", revieweeId),
    {
      averageRating,
      ratingCount,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return ratingDoc.id;
}

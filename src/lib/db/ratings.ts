import { questRequest } from "@/lib/quests/client";
export type QuestRatingInput = { questId: string; reviewerId: string; revieweeId: string; rating: number; comment?: string };
export async function submitQuestRating({ questId, rating, comment }: QuestRatingInput) {
  await questRequest("/" + encodeURIComponent(questId) + "/rating", { rating, comment });
  return questId;
}

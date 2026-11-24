import { QuestError } from "./policy.ts";

export function validateRating(input: unknown) {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  if (typeof body.rating !== "number" || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) throw new QuestError("Choose 1–5 stars.");
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  if (comment.length > 1000) throw new QuestError("Keep the review within 1,000 characters.");
  return { rating: body.rating, comment };
}

export function nextAggregate(user: { ratingCount?: unknown; ratingTotal?: unknown } | undefined, rating: number) {
  const ratingCount = (Number(user?.ratingCount) || 0) + 1;
  const ratingTotal = (Number(user?.ratingTotal) || 0) + rating;
  return { ratingCount, ratingTotal, averageRating: Math.round((ratingTotal / ratingCount) * 10) / 10 };
}

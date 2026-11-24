import { timingSafeEqual } from "node:crypto";
import { apiError, quests } from "@/lib/quests/api";
import { QuestError } from "@/lib/quests/policy";

// Called by a scheduler (e.g. Vercel Cron / Cloud Scheduler) with `Authorization: Bearer $CRON_SECRET`.
async function run(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) throw new QuestError("Scheduled jobs are not configured.", 503);
    const given = Buffer.from(request.headers.get("authorization") ?? "");
    const expected = Buffer.from(`Bearer ${secret}`);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new QuestError("Unauthorized.", 401);
    const expired = await quests.expireStale();
    const abandoned = await quests.abandonStale();
    return Response.json({ expired, abandoned });
  } catch (error) { return apiError(error); }
}
export const GET = run;
export const POST = run;

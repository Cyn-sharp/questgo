import { verifiedAdmin } from "@/lib/quests/admin";
import { apiError, audit } from "@/lib/quests/api";

export async function GET(request: Request) {
  try {
    await verifiedAdmin(request);
    return Response.json({ entries: await audit.recent() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

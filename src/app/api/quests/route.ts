import { apiError, quests, readBody, verifiedActor } from "@/lib/quests/api";
import { randomUUID } from "node:crypto";
import { QuestError, validateQuest } from "@/lib/quests/policy";
import { MAX_PRINT_FILE_BYTES, validatePrintFile } from "@/lib/quests/files";
import { questBucket } from "@/lib/quests/storage";

export async function POST(request: Request) {
  try {
    const actor = await verifiedActor(request);
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
      const id = await quests.create(actor.uid, actor.name, await readBody(request));
      return Response.json({ id }, { status: 201 });
    }
    const reader = request.body?.getReader();
    if (!reader) throw new QuestError("Missing request body.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_PRINT_FILE_BYTES + 32000) { await reader.cancel(); throw new QuestError("File is too large. Maximum 3 MB.", 413); }
      chunks.push(value);
    }
    let form: FormData;
    try { form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData(); }
    catch { throw new QuestError("Invalid upload."); }
    let input: unknown;
    try { input = JSON.parse(String(form.get("quest"))); } catch { throw new QuestError("Invalid quest details."); }
    const file = form.get("file");
    if (!(file instanceof File)) throw new QuestError("Attach a printing file.");
    const data = validateQuest(input, true);
    if (data.category !== "Printing") throw new QuestError("Attachments are currently supported for Printing quests only.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let metadata;
    try { metadata = validatePrintFile(file.name, file.type, bytes); }
    catch (error) { throw new QuestError(error instanceof Error ? error.message : "Invalid printing file."); }
    const path = `questAttachments/${actor.uid}/${randomUUID()}`;
    const object = questBucket().file(path);
    try { await object.save(Buffer.from(bytes), { resumable: false, metadata: { contentType: metadata.contentType, cacheControl: "private, no-store" } }); }
    catch { throw new QuestError("File upload failed. Check that Firebase Storage is enabled and try again.", 503); }
    let id;
    try { id = await quests.create(actor.uid, actor.name, input, { ...metadata, path }); }
    catch (error) {
      await object.delete({ ignoreNotFound: true }).catch(() => console.error("Failed to clean up an unused quest attachment", path));
      throw error;
    }
    return Response.json({ id }, { status: 201 });
  } catch (error) { return apiError(error); }
}

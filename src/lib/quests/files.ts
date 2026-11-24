export const MAX_PRINT_FILE_BYTES = 3 * 1024 * 1024;
export function validatePrintFile(name: string, type: string, bytes: Uint8Array) {
  if (!bytes.length || bytes.length > MAX_PRINT_FILE_BYTES) throw new Error("Printing files must be between 1 byte and 3 MB.");
  const pdf = type === "application/pdf" && /\.pdf$/i.test(name) && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  const png = type === "image/png" && /\.png$/i.test(name) && [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value);
  const jpeg = type === "image/jpeg" && /\.jpe?g$/i.test(name) && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!pdf && !png && !jpeg) throw new Error("Choose a valid PDF, JPG, or PNG file. The file content must match its type.");
  return { name: name.replace(/[\x00-\x1f\x7f/\\]/g, "_").slice(-150), size: bytes.length, contentType: type };
}

export const ATTACHMENT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
type Millis = { toMillis(): number };

// A printing file may be deleted once its quest has been closed for the retention period.
// Settlement quests are excluded: the file may still matter to an administrator's review.
export function attachmentExpired(
  quest: { status?: string; updatedAt?: Millis; cancelledAt?: Millis; completedAt?: Millis; expiredAt?: Millis; createdAt?: Millis },
  now: number,
) {
  if (!["completed", "cancelled", "expired"].includes(String(quest.status))) return false;
  const closedAt = Math.max(...[quest.updatedAt, quest.cancelledAt, quest.completedAt, quest.expiredAt, quest.createdAt].map((value) => value?.toMillis() ?? 0));
  return closedAt > 0 && now - closedAt >= ATTACHMENT_RETENTION_MS;
}

// Pure helpers for Quest Messenger history paging (kept free of Firebase imports so they can be unit tested).
export const LIVE_LIMIT = 100;
export const PAGE_SIZE = 50;

type Item = { id: string; createdAt?: { toMillis(): number } };

const time = (item: Item) => item.createdAt?.toMillis() ?? Number.POSITIVE_INFINITY;

/** Union of messages by id (incoming wins), oldest first. Matches Firestore's createdAt, then document-id order. */
export function mergeMessages<T extends Item>(current: T[], incoming: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of current) byId.set(item.id, item);
  for (const item of incoming) byId.set(item.id, item);
  return [...byId.values()].sort((a, b) => time(a) - time(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** True while an older page may still exist: a full page means there could be more. */
export const mayHaveOlder = (received: number, size: number) => received >= size;

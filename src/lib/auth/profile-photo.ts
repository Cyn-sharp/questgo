// Profile photos are uploaded to Firebase Storage by the client; accept only that origin over HTTPS.
const HOSTS = ["firebasestorage.googleapis.com", "storage.googleapis.com"];

export function isAllowedPhotoUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 600) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (HOSTS.includes(url.hostname) || url.hostname.endsWith(".firebasestorage.app"));
  } catch { return false; }
}

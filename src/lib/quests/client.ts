import { auth } from "@/lib/auth/firebase";

export async function apiRequest(url: string, method: "POST" | "DELETE", body?: unknown) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please log in again.");
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Unable to complete this request.");
  return result as { id?: string };
}

export function questRequest(path: string, body: unknown) {
  return apiRequest(`/api/quests${path}`, "POST", body);
}

export function setUserBlocked(userId: string, blocked: boolean) {
  return apiRequest(`/api/users/${encodeURIComponent(userId)}/block`, blocked ? "POST" : "DELETE");
}

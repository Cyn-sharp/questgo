import { auth } from "@/lib/auth/firebase";

export async function questRequest(path: string, body: unknown) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please log in again.");
  const response = await fetch(`/api/quests${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Unable to complete this request.");
  return result as { id?: string };
}

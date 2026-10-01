/** Clear the server session before changing client auth or navigating away. */
export async function endSession(
  signOutClient: () => Promise<void>,
  request: typeof fetch = fetch,
) {
  const response = await request("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Could not sign out securely. Please try again.");
  }

  await signOutClient();
}

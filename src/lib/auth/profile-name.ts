// Registration writes displayName to Firebase Auth. Use that identity first
// everywhere, with the Firestore name as a fallback for older accounts.
export function getProfileName(displayName?: string | null, fullName?: string | null) {
  return displayName?.trim() || fullName?.trim() || "QuestGo User";
}

// Pure helpers for the post-quest form: which fields apply to a category/funding choice, and the API payload.
export type FundingChoice = "no_purchase" | "prepaid" | "abono";

export type QuestFormValues = {
  title: string; category: string; description: string; reward: string;
  fundingMethod: FundingChoice; purchaseBudget: string; vendorInstructions: string;
  pickupLocation: string; meetupLocation: string;
  setTime: boolean; meetupHour: string; meetupMinute: string; meetupPeriod: "AM" | "PM";
};

/** Printing and Shopping always involve a purchase, so "no purchase" is not offered (the server enforces this too). */
export const fundingMethodsFor = (category: string): FundingChoice[] =>
  ["Printing", "Shopping"].includes(category) ? ["prepaid", "abono"] : ["no_purchase", "prepaid", "abono"];

/** The stored choice is kept untouched; this is what applies to the current category. */
export const effectiveFunding = (category: string, method: FundingChoice): FundingChoice =>
  fundingMethodsFor(category).includes(method) ? method : "prepaid";

/** Shopping reuses its item budget as the purchase limit, so the user only types it once. */
export const purchaseLimitFromItemBudget = (category: string, method: FundingChoice) => category === "Shopping" && method !== "no_purchase";
export const needsPurchaseLimit = (category: string, method: FundingChoice) => method !== "no_purchase" && !purchaseLimitFromItemBudget(category, method);
export const needsVendorInstructions = (method: FundingChoice) => method === "prepaid";
export const needsFile = (category: string) => category === "Printing";

export const formatMeetupTime = (form: Pick<QuestFormValues, "setTime" | "meetupHour" | "meetupMinute" | "meetupPeriod">) =>
  form.setTime ? `${form.meetupHour}:${form.meetupMinute} ${form.meetupPeriod}` : "";

/** Only the selected category's requirements and the applicable funding fields are sent; hidden values stay in the UI only. */
export function buildQuestPayload(form: QuestFormValues, requirementsByCategory: Record<string, Record<string, string>>) {
  const funding = effectiveFunding(form.category, form.fundingMethod);
  const requirements = requirementsByCategory[form.category] ?? {};
  const purchaseBudget = funding === "no_purchase" ? 0 : Number(purchaseLimitFromItemBudget(form.category, funding) ? requirements.budget : form.purchaseBudget);
  return {
    title: form.title.trim(), category: form.category, description: form.description.trim(), reward: Number(form.reward),
    location: form.pickupLocation, meetUpPoint: form.meetupLocation, preferredTime: formatMeetupTime(form), requirements,
    fundingMethod: funding, purchaseBudget, vendorInstructions: needsVendorInstructions(funding) ? form.vendorInstructions : "",
  };
}

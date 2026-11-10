export type FundingMethod = "no_purchase" | "prepaid" | "abono";
export const FUNDING_LABELS = { no_purchase: "No purchase needed", prepaid: "Requester pays vendor directly", abono: "Runner advances payment (abono)" };
export type FundingQuest = { fundingMethod?: FundingMethod; purchaseBudget?: number; actualExpense?: number; reward: number; expenseApproved?: boolean };
export function money(value: number) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value); }
export function fundingSummary(quest: FundingQuest) {
  return { label: quest.fundingMethod ? FUNDING_LABELS[quest.fundingMethod] : "Funding not recorded — agree before starting",
    upfront: quest.fundingMethod === "abono" ? quest.purchaseBudget ?? 0 : quest.fundingMethod ? 0 : null,
    reimbursement: quest.fundingMethod === "abono" ? quest.actualExpense ?? 0 : 0,
    totalDue: quest.reward + (quest.fundingMethod === "abono" ? quest.actualExpense ?? 0 : 0) };
}
export function validateFunding(data: Record<string, unknown>, category: string) {
  const method = data.fundingMethod;
  if (!method) throw new Error("Choose who pays the purchase cost before posting.");
  if (!["no_purchase", "prepaid", "abono"].includes(String(method))) throw new Error("Invalid funding method.");
  if (["Printing", "Shopping"].includes(category) && method === "no_purchase") throw new Error("Printing and Shopping require direct vendor payment or optional abono.");
  const budget = data.purchaseBudget;
  if (method === "no_purchase") return { fundingMethod: method as FundingMethod, purchaseBudget: 0, vendorInstructions: "" };
  if (typeof budget !== "number" || !Number.isFinite(budget) || budget <= 0 || budget > 10000 || Math.abs(budget * 100 - Math.round(budget * 100)) > 0.00001) throw new Error("Purchase cost must be ₱0.01–₱10,000, with up to two decimal places.");
  const instructions = typeof data.vendorInstructions === "string" ? data.vendorInstructions.trim() : "";
  if (method === "prepaid" && (instructions.length < 5 || instructions.length > 500)) throw new Error("Provide vendor payment and collection instructions (5–500 characters). Do not include passwords or payment secrets.");
  if (category === "Shopping" && Number((data.requirements as Record<string, string>)?.budget) !== budget) throw new Error("The shopping item budget must match the purchase cost limit.");
  return { fundingMethod: method as FundingMethod, purchaseBudget: budget, vendorInstructions: method === "prepaid" ? instructions : "" };
}

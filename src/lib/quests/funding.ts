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
type FundingField = "fundingMethod" | "purchaseBudget" | "vendorInstructions";
const validMoney = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 10000 && Math.abs(value * 100 - Math.round(value * 100)) <= 0.00001;

// Per-field problems, in the order the server reports them. Shared by the form and validateFunding.
export function fundingErrors(data: Record<string, unknown>, category: string) {
  const errors: Partial<Record<FundingField, string>> = {};
  const method = data.fundingMethod;
  if (!method) return { fundingMethod: "Choose who pays the purchase cost before posting." } as typeof errors;
  if (!["no_purchase", "prepaid", "abono"].includes(String(method))) return { fundingMethod: "Invalid funding method." } as typeof errors;
  if (["Printing", "Shopping"].includes(category) && method === "no_purchase") return { fundingMethod: "Printing and Shopping require direct vendor payment or optional abono." } as typeof errors;
  if (method === "no_purchase") return errors;
  if (!validMoney(data.purchaseBudget)) errors.purchaseBudget = "Purchase cost must be ₱0.01–₱10,000, with up to two decimal places.";
  const instructions = typeof data.vendorInstructions === "string" ? data.vendorInstructions.trim() : "";
  if (method === "prepaid" && (instructions.length < 5 || instructions.length > 500)) errors.vendorInstructions = "Provide vendor payment and collection instructions (5–500 characters). Do not include passwords or payment secrets.";
  if (!errors.purchaseBudget && category === "Shopping" && Number((data.requirements as Record<string, string>)?.budget) !== data.purchaseBudget) errors.purchaseBudget = "The shopping item budget must match the purchase cost limit.";
  return errors;
}

export function validateFunding(data: Record<string, unknown>, category: string) {
  const problem = Object.values(fundingErrors(data, category))[0];
  if (problem) throw new Error(problem);
  const method = data.fundingMethod as FundingMethod;
  if (method === "no_purchase") return { fundingMethod: method, purchaseBudget: 0, vendorInstructions: "" };
  const instructions = typeof data.vendorInstructions === "string" ? data.vendorInstructions.trim() : "";
  return { fundingMethod: method, purchaseBudget: data.purchaseBudget as number, vendorInstructions: method === "prepaid" ? instructions : "" };
}

export const CATEGORY_FIELDS: Record<string, { key: string; label: string; hint: string }[]> = {
  Printing: [
    { key: "paperSize", label: "Paper size", hint: "A4, Letter, Legal, or exact dimensions" },
    { key: "copies", label: "Number of copies", hint: "1–100" },
    { key: "pages", label: "Pages to print", hint: "All pages, or a range such as 1–5" },
    { key: "color", label: "Print color", hint: "Black and white, or Color" },
    { key: "sides", label: "Print sides", hint: "Single-sided or Double-sided" },
  ],
  Pickup: [
    { key: "items", label: "Items to collect", hint: "What and how many items?" },
    { key: "collection", label: "Collection instructions", hint: "Where and how should the runner collect them?" },
  ],
  Delivery: [
    { key: "items", label: "Items to deliver", hint: "What, how many, and approximate size or weight?" },
    { key: "recipient", label: "Recipient / handover instructions", hint: "Who receives it and where should the runner meet them?" },
  ],
  Shopping: [
    { key: "items", label: "Shopping list and quantities", hint: "List each item and quantity" },
    { key: "store", label: "Store", hint: "Where should the runner buy the items?" },
    { key: "budget", label: "Item budget (₱)", hint: "Separate from the runner reward; maximum ₱10,000" },
    { key: "substitutions", label: "If an item is unavailable", hint: "No substitutions, or describe allowed alternatives" },
  ],
  Other: [
    { key: "outcome", label: "Expected result", hint: "What must the runner finish for this quest to be complete?" },
    { key: "materials", label: "Materials / arrangements", hint: "What is needed and who provides it? Write None needed if appropriate." },
  ],
};

export function meaningfulText(value: unknown, min = 3, max = 500): value is string {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max &&
    /[\p{L}\p{N}]/u.test(value) && !/^(null|undefined|none|n\/?a|test|testing|asdf|tbd|[-.\s]+)$/i.test(value.trim());
}

// Error for a single requirement field, or null when it is acceptable. Shared by the form (per-field messages) and the server.
export function requirementError(category: string, key: string, raw: unknown): string | null {
  const field = (CATEGORY_FIELDS[category] || []).find((item) => item.key === key);
  if (!field) return null;
  if (key === "copies" || key === "budget") {
    const number = typeof raw === "string" && raw.trim() ? Number(raw) : NaN;
    const max = key === "copies" ? 100 : 10000;
    const invalid = !Number.isFinite(number) || number <= 0 || number > max || (key === "copies" ? !Number.isInteger(number) : Math.abs(number * 100 - Math.round(number * 100)) > 0.00001);
    return invalid ? `Enter a valid ${field.label.toLowerCase()}.` : null;
  }
  if (category === "Printing" && key === "color" && !["Black and white", "Color"].includes(String(raw))) return "Select a print color.";
  if (category === "Printing" && key === "sides" && !["Single-sided", "Double-sided"].includes(String(raw))) return "Select single-sided or double-sided printing.";
  return meaningfulText(raw, key === "paperSize" || key === "pages" ? 1 : 3) ? null : `Please provide ${field.label.toLowerCase()}.`;
}

export function validateRequirements(category: string, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Fill in the requirements for this category.");
  const source = value as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const field of CATEGORY_FIELDS[category] || []) {
    const problem = requirementError(category, field.key, source[field.key]);
    if (problem) throw new Error(problem);
    result[field.key] = String(source[field.key]).trim();
  }
  return result;
}

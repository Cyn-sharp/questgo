"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMyQuests, useQuestClock } from "@/hooks/useQuests";
import { getQuestExpirationMillis } from "@/lib/db/quests";
import { useMinimumLoading } from "@/hooks/useMinimumLoading";
import {
  AlertCircle,
  Clock,
  ShieldCheck,
  MapPin,
  Navigation,
  Banknote,
  Tag,
  Type,
  FileText,
  ChevronDown,
} from "lucide-react";
import { CATEGORY_FIELDS, meaningfulText, requirementError } from "@/lib/quests/requirements";
import { fundingErrors } from "@/lib/quests/funding";
import { validateQuest } from "@/lib/quests/policy";
import { MAX_PRINT_FILE_BYTES } from "@/lib/quests/files";
import { createQuest } from "@/lib/db/quests";
import { useAuth } from "@/hooks/useAuth";
import { ReviewQuestDialogBody } from "@/components/quest/ReviewQuestDialogBody";
import { PageHeader } from "@/components/ui/PageHeader";
import { PostQuestSkeleton } from "@/components/skeletons/PageSkeletons";

function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  variant = "fade-up" as "fade-up" | "scale",
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "fade-up" | "scale";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${variant === "scale" ? "reveal-scale" : "reveal"} ${className}`}
      style={{ ["--reveal-delay" as string]: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

const CATEGORIES = ["Printing", "Pickup", "Delivery", "Shopping", "Other"] as const;


const CAMPUS_LOCATIONS = [
  "CIT-U Library",
  "CIT-U Main Entrance",
  "Main Campus",
  "Main Library",
  "Science Building",
  "CPE Lab",
  "N-Building",
  "Main Canteen",
  "Gym Area",
  "Engineering Building",
];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

type FormState = {
  title: string;
  category: string;
  description: string;
  reward: string;
  fundingMethod: "no_purchase" | "prepaid" | "abono";
  purchaseBudget: string;
  vendorInstructions: string;
  pickupLocation: string;
  meetupLocation: string;
  meetupHour: string;
  meetupMinute: string;
  meetupPeriod: "AM" | "PM";
};

function defaultMeetup() {
  // Suggest 30 minutes from now (the quest window), rounded up to the next 5 minutes.
  const at = new Date(Date.now() + 30 * 60 * 1000);
  const minutes = Math.ceil(at.getMinutes() / 5) * 5;
  at.setMinutes(minutes, 0, 0);
  const hours = at.getHours();
  return { meetupHour: String(hours % 12 || 12), meetupMinute: String(at.getMinutes()).padStart(2, "0"), meetupPeriod: (hours >= 12 ? "PM" : "AM") as "AM" | "PM" };
}

const initialForm = (): FormState => ({
  title: "",
  category: "Printing",
  description: "",
  reward: "30",
  fundingMethod: "prepaid",
  purchaseBudget: "",
  vendorInstructions: "",
  pickupLocation: "CIT-U Library",
  meetupLocation: "CIT-U Main Entrance",
  ...defaultMeetup(),
});

// Each step appears once the one before it is filled in, then stays put so
// editing an earlier answer never makes later fields vanish under the user.
function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return <div className="animate-fade-up">{children}</div>;
}

const SECTION_TITLES = ["Quest details", "Reward", "Task details", "Who pays", "Location", "Schedule", "Payment"];

function SectionLabel({ step, children, hint }: { step: number; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-3 font-display text-lg font-bold text-dark">
        <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-maroon text-xs font-bold text-white">{step}</span>
        {children}
      </h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-dark mb-1.5">
      {children}
    </label>
  );
}

const inputClass = `
  w-full rounded-xl border border-field bg-white
  px-4 py-3 text-sm text-dark placeholder:text-muted/80
  outline-none transition-all duration-300
  focus:border-maroon focus:ring-2 focus:ring-maroon/15
`;

// Mirrors the server rules so problems appear next to the field instead of as one late error.
function fieldProblems(form: FormState, requirements: Record<string, string>, file?: File) {
  const problems: Record<string, string> = {};
  for (const field of CATEGORY_FIELDS[form.category] || []) {
    const problem = requirementError(form.category, field.key, requirements[field.key]);
    if (problem) problems[`req:${field.key}`] = problem;
  }
  const funding = fundingErrors({ fundingMethod: form.fundingMethod, purchaseBudget: form.fundingMethod === "no_purchase" ? 0 : Number(form.purchaseBudget), vendorInstructions: form.vendorInstructions, requirements }, form.category);
  if (funding.fundingMethod) problems.funding = funding.fundingMethod;
  if (funding.purchaseBudget) problems.budget = funding.purchaseBudget;
  if (funding.vendorInstructions) problems.vendor = funding.vendorInstructions;
  if (form.category === "Printing") {
    if (!file) problems.file = "Attach a PDF, JPG, or PNG file for printing.";
    else if (!file.size || file.size > MAX_PRINT_FILE_BYTES || !["application/pdf", "image/png", "image/jpeg"].includes(file.type)) problems.file = "Choose a PDF, JPG, or PNG file up to 3 MB.";
  }
  return problems;
}

export default function PostQuestPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [requirements, setRequirements] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | undefined>();
  const [review, setReview] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const posting = useRef(false);
  useEffect(() => { if (review) dialog.current?.showModal(); else dialog.current?.close(); }, [review]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [showProblems, setShowProblems] = useState(false);
  const [reached, setReached] = useState(0);
  const router = useRouter();
  const { posted, loading: requestsLoading, error: requestsError } = useMyQuests();
  const now = useQuestClock();
  const activeQuest = posted.find((quest) => ["accepted", "in_progress"].includes(quest.status) || (quest.status === "available" && (getQuestExpirationMillis(quest) ?? Infinity) > now));

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setReview(false);
    if (key === "category") { setShowProblems(false); setRequirements({}); setFile(undefined); if (["Printing", "Shopping"].includes(String(value))) setForm((current) => ({ ...current, fundingMethod: current.fundingMethod === "no_purchase" ? "prepaid" : current.fundingMethod })); }
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!meaningfulText(form.title, 5, 120)) next.title = "Write a clear title (5–120 characters), not a placeholder.";
    if (!form.category) next.category = "Select a category.";
    if (!meaningfulText(form.description, 20, 3000)) next.description = "Describe the task in 20–3,000 characters, not a placeholder.";
    const reward = Number(form.reward);
    if (!form.reward.trim() || !Number.isFinite(reward) || reward <= 0 || reward > 10000 || Math.abs(Math.round(reward * 100) - reward * 100) > 0.00001) {
      next.reward = "Enter ₱0.01–₱10,000, with up to two decimal places.";
    }
    if (!form.pickupLocation.trim()) next.pickupLocation = "Pickup location is required.";
    if (!form.meetupLocation.trim()) next.meetupLocation = "Meet-up location is required.";
    if (!form.meetupHour || !form.meetupMinute) next.meetupHour = "Please select a valid time.";
    setErrors(next);
    setShowProblems(true);
    const problems = fieldProblems(form, requirements, file);
    const valid = Object.keys(next).length === 0 && Object.keys(problems).length === 0;
    // Move focus to the first invalid field so the message is actually seen.
    if (!valid) setTimeout(() => { const first = document.querySelector<HTMLElement>("[aria-invalid=true]"); first?.focus(); first?.scrollIntoView({ block: "center", behavior: "smooth" }); }, 0);
    return valid;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (shown < 7) return;
    setSuccess(false);
    setSubmissionError("");

    if (!user) {
      setSubmissionError("You must be logged in to post a quest.");
      return;
    }

    if (submitting || requestsLoading || requestsError || activeQuest) return;

    if (!validate()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const payload = {
      title: form.title.trim(), category: form.category, description: form.description.trim(),
      reward: Number(form.reward), location: form.pickupLocation, meetUpPoint: form.meetupLocation,
      preferredTime: `${form.meetupHour}:${form.meetupMinute} ${form.meetupPeriod}`, requirements,
      fundingMethod: form.fundingMethod, purchaseBudget: form.fundingMethod === "no_purchase" ? 0 : Number(form.purchaseBudget), vendorInstructions: form.vendorInstructions,
    };
    try {
      validateQuest(payload, Boolean(file));
      if (file && (!file.size || file.size > MAX_PRINT_FILE_BYTES || !["application/pdf", "image/png", "image/jpeg"].includes(file.type))) throw new Error("Choose a PDF, JPG, or PNG file up to 3 MB.");
    } catch (error) { setSubmissionError(error instanceof Error ? error.message : "Check your quest details."); return; }
    if (!review) { setReview(true); return; }
    if (posting.current) return;
    posting.current = true;
    setSubmitting(true);

    try {
      const questId = await createQuest(payload, file);

      setSuccess(true);
      router.replace(`/quests/active?id=${encodeURIComponent(questId)}`);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Unable to post your quest. Please try again."
      );
    } finally {
      posting.current = false;
      setSubmitting(false);
    }
  }


  const showSkeleton = useMinimumLoading(authLoading || requestsLoading) && !requestsError;
  if (showSkeleton) {
    return <PostQuestSkeleton />;
  }

  if (requestsError) return <div className="page-container py-10 text-white" role="alert">{requestsError} Posting is unavailable until your existing quests can be checked.</div>;
  if (activeQuest) return <div className="page-container py-10"><div className="rounded-2xl bg-white p-6 space-y-4"><h1 className="text-2xl font-bold text-maroon">You already have an active quest</h1><p>{activeQuest.title}</p><p>Complete or cancel your current quest before posting another. Unaccepted quests expire after 30 minutes.</p><Link className="btn-primary" href={`/quests/active?id=${encodeURIComponent(activeQuest.id)}`}>Manage My Quest</Link></div></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white border border-white/40 p-8 max-w-md text-center shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <AlertCircle className="w-12 h-12 text-maroon mx-auto mb-4" />
          <h2 className="text-xl font-bold text-dark mb-2">Access Restricted</h2>
          <p className="text-sm text-muted mb-6">
            You must be logged in with your verified CIT-U account to create a quest.
          </p>
          <Link
            href="/login"
            className="inline-flex justify-center w-full items-center px-6 py-3.5 rounded-xl bg-maroon hover:bg-maroon-dark text-white font-bold text-[15px] transition-all active:scale-[0.98]"
          >
            Log In Now
          </Link>
        </div>
      </div>
    );
  }

  const problems = showProblems ? fieldProblems(form, requirements, file) : {};
  const rewardNumber = Number(form.reward);
  const taskProblems = Object.keys(fieldProblems(form, requirements, file));
  const stepDone = [
    meaningfulText(form.title, 5, 120),
    meaningfulText(form.description, 20, 3000),
    form.reward.trim() !== "" && Number.isFinite(rewardNumber) && rewardNumber > 0 && rewardNumber <= 10000 && Math.abs(Math.round(rewardNumber * 100) - rewardNumber * 100) <= 0.00001,
    !taskProblems.some((key) => key.startsWith("req:") || key === "file"),
    !taskProblems.some((key) => ["funding", "budget", "vendor"].includes(key)),
    Boolean(form.pickupLocation.trim() && form.meetupLocation.trim()),
    Boolean(form.meetupHour && form.meetupMinute),
  ];
  const unlocked = stepDone.findIndex((done) => !done) === -1 ? stepDone.length : stepDone.findIndex((done) => !done);
  if (unlocked > reached) setReached(unlocked);
  const shown = Math.max(reached, unlocked);
  // Section-level progress (title and description are one section): shown in the header bar.
  const sectionDone = [stepDone[0] && stepDone[1], stepDone[2], stepDone[3], stepDone[4], stepDone[5], stepDone[6]];
  const firstOpen = sectionDone.indexOf(false);
  const sectionsComplete = firstOpen === -1 ? 6 : firstOpen;
  const ready = sectionsComplete === 6;
  const previewTime = `${form.meetupHour}:${form.meetupMinute} ${form.meetupPeriod}`;

  return (
    <div className="bg-transparent min-h-full">
      <dialog ref={dialog} onCancel={(event) => { if (submitting) event.preventDefault(); else setReview(false); }} aria-labelledby="review-title" className="m-auto w-[calc(100%-2rem)] max-w-xl max-h-[88vh] overflow-y-auto overscroll-contain rounded-2xl bg-white p-0 text-dark shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop:bg-black/60">
        <ReviewQuestDialogBody
          title={form.title}
          category={form.category}
          description={form.description}
          reward={form.reward}
          pickup={form.pickupLocation}
          meetup={form.meetupLocation}
          time={previewTime}
          details={(CATEGORY_FIELDS[form.category] || []).map((field) => ({ label: field.label, value: requirements[field.key] }))}
          fileLabel={file ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB` : undefined}
          funding={{ method: form.fundingMethod === "abono" ? "Runner advances payment" : form.fundingMethod === "prepaid" ? "Requester pays vendor directly" : "No purchase needed", budget: form.fundingMethod === "no_purchase" ? "0" : form.purchaseBudget }}
          error={submissionError}
          submitting={submitting}
          onBack={() => setReview(false)}
          onConfirm={() => void handleSubmit({ preventDefault() {} } as FormEvent)}
        />
      </dialog>
      <div className="page-container py-6 sm:py-10 lg:py-12">
        <PageHeader
          eyebrow="Post a quest"
          title="Post a New Quest"
          description="Describe your task and reward. Runners on campus can accept it for the next 30 minutes."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
          {/* LEFT: FORM */}
          <ScrollReveal className="lg:col-span-8">
            <form
              onSubmit={handleSubmit}
              noValidate
              className={`rounded-2xl bg-white border border-white/40 p-5 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${
                shake ? "animate-form-shake" : ""
              }`}
            >
              <div className="mb-8">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-dark">{ready ? "Ready to review" : `Step ${sectionsComplete + 1} of 7`}</p>
                  <p className="text-sm text-muted">{ready ? "Every step is complete" : SECTION_TITLES[sectionsComplete]}</p>
                </div>
                <div role="progressbar" aria-label="Quest form progress" aria-valuemin={0} aria-valuemax={7} aria-valuenow={ready ? 7 : sectionsComplete} className="mt-3 flex gap-1.5">
                  {SECTION_TITLES.map((title, index) => (
                    <span key={title} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${index < sectionsComplete || (ready && index === 6) ? "bg-maroon" : index === sectionsComplete && !ready ? "bg-maroon/35" : "bg-border"}`} />
                  ))}
                </div>
              </div>

              {/* QUEST INFO */}
              <section className="mb-6 sm:mb-8">
                <SectionLabel step={1} hint="What do you need done?">Quest details</SectionLabel>
                <div className="space-y-4">
                  <div>
                    <FieldLabel htmlFor="title">Quest Title</FieldLabel>
                    <div className="relative">
                      <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/45" />
                      <input
                        id="title"
                        type="text"
                        maxLength={120}
                        aria-invalid={Boolean(errors.title)}
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                        placeholder="e.g. Print CPE Module"
                        className={`${inputClass} pl-10 ${errors.title ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                      />
                    </div>
                    {errors.title && <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>}
                  </div>

<Reveal show={shown >= 1}>
                  <div>
                    <FieldLabel htmlFor="category">Category</FieldLabel>
                    <div className="relative">
                      <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/45 pointer-events-none" />
                      <select
                        id="category"
                        value={form.category}
                        onChange={(e) => update("category", e.target.value)}
                        className={`${inputClass} pl-10 pr-10 appearance-none cursor-pointer`}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/55 pointer-events-none" />
                    </div>
                  </div>
</Reveal>

<Reveal show={shown >= 1}>
                  <div>
                    <FieldLabel htmlFor="description">Description & Instruction</FieldLabel>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-muted/45" />
                      <textarea
                        id="description"
                        maxLength={3000}
                        aria-invalid={Boolean(errors.description)}
                        rows={4}
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        placeholder="Describe the task clearly so runners know exactly what to do..."
                        className={`${inputClass} pl-10 resize-y min-h-[110px] ${errors.description ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                      />
                    </div>
                    {errors.description && <p className="mt-1.5 text-xs text-red-600">{errors.description}</p>}
                  </div>
</Reveal>
                </div>
              </section>

              {/* REWARD */}
<Reveal show={shown >= 2}>
              <section className="mb-6 sm:mb-8">
                <SectionLabel step={2} hint="What you'll pay the runner for their time.">Reward</SectionLabel>
                <div>
                  <FieldLabel htmlFor="reward">Runner Reward (₱)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gold-ink">₱</span>
                    <input
                      id="reward"
                      aria-invalid={Boolean(errors.reward)}
                      type="number"
                      inputMode="decimal"
                      min={0.01}
                      max={10000}
                      step={0.01}
                      value={form.reward}
                      onChange={(e) => update("reward", e.target.value)}
                      className={`${inputClass} pl-9 ${errors.reward ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                    />
                  </div>
                  {errors.reward && <p className="mt-1.5 text-xs text-red-600">{errors.reward}</p>}
                </div>
              </section>
</Reveal>

<Reveal show={shown >= 3}>
              <section className="mb-6 space-y-4">
                <SectionLabel step={3} hint="Runners see these before they accept.">{form.category} details</SectionLabel>
                {(CATEGORY_FIELDS[form.category] || []).map((field) => <div key={field.key}>
                  <FieldLabel htmlFor={`requirement-${field.key}`}>{field.label} *</FieldLabel>
                  {["color", "sides"].includes(field.key) ? <select id={`requirement-${field.key}`} aria-invalid={Boolean(problems[`req:${field.key}`])} className={inputClass} value={requirements[field.key] || ""} onChange={(event) => setRequirements((current) => ({ ...current, [field.key]: event.target.value }))}>
                    <option value="">Select an option</option>{(field.key === "color" ? ["Black and white", "Color"] : ["Single-sided", "Double-sided"]).map((option) => <option key={option}>{option}</option>)}
                  </select> : <input id={`requirement-${field.key}`} aria-invalid={Boolean(problems[`req:${field.key}`])} className={inputClass} maxLength={500} value={requirements[field.key] || ""} placeholder={field.hint} onChange={(event) => setRequirements((current) => ({ ...current, [field.key]: event.target.value }))} />}
                  {problems[`req:${field.key}`] && <p className="mt-1.5 text-xs text-red-600">{problems[`req:${field.key}`]}</p>}
                </div>)}
                {form.category === "Printing" && <div>
                  <FieldLabel htmlFor="printing-file">Printing file *</FieldLabel>
                  <input key={form.category} id="printing-file" aria-invalid={Boolean(problems.file)} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setFile(event.target.files?.[0])} className={inputClass} />
                  <p className="mt-2 text-sm">PDF, JPG, or PNG, up to 3 MB. Only you and your assigned runner can download it. Export Word documents to PDF first.</p>
                  {problems.file && <p className="mt-1.5 text-xs text-red-600">{problems.file}</p>}
                  {file && <p className="mt-2 text-sm break-all">{file.name} · {(file.size / 1024).toFixed(1)} KB</p>}
                </div>}
                {form.category === "Shopping" && <p className="text-sm">The item budget is separate from the runner reward. The item budget must match the purchase cost limit below.</p>}
              </section>
</Reveal>

<Reveal show={shown >= 4}>
              <section className="mb-6 space-y-4">
                <SectionLabel step={4} hint="Agree up front who covers any purchase cost.">Who pays</SectionLabel>
                <FieldLabel htmlFor="funding">Funding arrangement *</FieldLabel>
                <select id="funding" aria-invalid={Boolean(problems.funding)} className={inputClass} value={form.fundingMethod} onChange={(event) => update("fundingMethod", event.target.value as FormState["fundingMethod"])}>
                  {!["Printing", "Shopping"].includes(form.category) && <option value="no_purchase">No purchase needed — ₱0 runner upfront</option>}
                  <option value="prepaid">Requester pays vendor directly — ₱0 runner upfront</option>
                  <option value="abono">Runner advances payment (optional abono)</option>
                </select>
                {form.fundingMethod !== "no_purchase" && <><FieldLabel htmlFor="purchase-budget">Purchase cost limit (separate from reward)</FieldLabel><input id="purchase-budget" aria-invalid={Boolean(problems.budget)} className={inputClass} type="number" min="0.01" max="10000" step="0.01" value={form.purchaseBudget} onChange={(event) => update("purchaseBudget", event.target.value)} /></>}
                {form.fundingMethod === "prepaid" && <><FieldLabel htmlFor="vendor-instructions">Vendor payment / collection instructions</FieldLabel><textarea id="vendor-instructions" aria-invalid={Boolean(problems.vendor)} className={inputClass} maxLength={500} value={form.vendorInstructions} onChange={(event) => update("vendorInstructions", event.target.value)} placeholder="Name the vendor and how you will pay and arrange collection. Never include payment secrets." /><p className="text-sm">Pay the vendor directly before collection. Refunds and change should go directly to you.</p></>}
                {form.fundingMethod === "abono" && <p className="text-sm">Runners see this advance limit before accepting. Approve the recorded cost before they spend. At handover you owe the actual approved cost plus the runner reward.</p>}
                {["funding", "budget", "vendor"].map((key) => problems[key] && <p key={key} role="alert" className="text-xs text-red-600">{problems[key]}</p>)}
                <p className="text-xs text-gray-600">QuestGo records participant acknowledgements. It does not process payments, verify external transfers, or guarantee reimbursement.</p>
              </section>
</Reveal>
              {/* LOCATION */}
<Reveal show={shown >= 5}>
              <section className="mb-6 sm:mb-8">
                <SectionLabel step={5} hint="Where the runner picks up, and where you'll meet.">Location</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pickup">Pickup / Task Location</FieldLabel>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/45 pointer-events-none" />
                      <select
                        id="pickup"
                        value={form.pickupLocation}
                        onChange={(e) => update("pickupLocation", e.target.value)}
                        className={`${inputClass} pl-10 pr-10 appearance-none cursor-pointer`}
                      >
                        {CAMPUS_LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/55 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="meetup">Meet-up Location</FieldLabel>
                    <div className="relative">
                      <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/45 pointer-events-none" />
                      <select
                        id="meetup"
                        value={form.meetupLocation}
                        onChange={(e) => update("meetupLocation", e.target.value)}
                        className={`${inputClass} pl-10 pr-10 appearance-none cursor-pointer`}
                      >
                        {CAMPUS_LOCATIONS.map((loc) => (
                          <option key={`meet-${loc}`} value={loc}>{loc}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/55 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </section>
</Reveal>

              {/* SCHEDULE */}
<Reveal show={shown >= 6}>
              <section className="mb-6 sm:mb-8">
                <SectionLabel step={6} hint="When you'd like to meet.">Schedule</SectionLabel>
                <FieldLabel>Preferred Meet-up Time</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <select
                      value={form.meetupHour}
                      onChange={(e) => update("meetupHour", e.target.value)}
                      className={`${inputClass} pr-8 appearance-none cursor-pointer ${errors.meetupHour ? "border-red-400" : ""}`}
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/55 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={form.meetupMinute}
                      onChange={(e) => update("meetupMinute", e.target.value)}
                      className={`${inputClass} pr-8 appearance-none cursor-pointer ${errors.meetupHour ? "border-red-400" : ""}`}
                    >
                      {MINUTES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/55 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={form.meetupPeriod}
                      onChange={(e) => update("meetupPeriod", e.target.value as "AM" | "PM")}
                      className={`${inputClass} pr-8 appearance-none cursor-pointer font-bold ${errors.meetupHour ? "border-red-400" : ""}`}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/55 pointer-events-none" />
                  </div>
                </div>
                {errors.meetupHour && <p className="mt-1.5 text-xs text-red-600">{errors.meetupHour}</p>}
                <p className="mt-1.5 text-xs text-muted">Suggested from the current time. Runners can accept for 30 minutes after you post.</p>
              </section>
</Reveal>

              {/* PAYMENT */}
<Reveal show={shown >= 7}>
              <section>
                <SectionLabel step={7} hint="Cash on delivery, paid directly to the runner.">Payment</SectionLabel>
                <div>
                  <FieldLabel>Payment Method</FieldLabel>
                  <div className="w-full rounded-xl border border-field bg-cream px-4 py-3 text-sm text-muted flex items-center gap-2 cursor-not-allowed">
                    <Banknote className="w-4 h-4 text-muted/55 shrink-0" />
                    <span className="font-medium">Cash on Delivery (COD) — Locked</span>
                  </div>
                </div>
              </section>
</Reveal>

              {/* Mobile submit */}
              <div className="mt-8 lg:hidden">
                <button
                  type="submit"
                  disabled={submitting || shown < 7}
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-maroon hover:bg-maroon-dark text-white font-bold text-[15px] shadow-[0_8px_18px_rgba(122,31,50,0.28)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#e6e1d9] disabled:text-muted disabled:opacity-100 disabled:shadow-none"
                >
                  {submitting ? "Posting..." : "Review Quest"}
                </button>
                {success && (
                  <div className="mt-3 rounded-xl bg-[#eefbf3] border border-green-200 px-4 py-3 text-sm text-green-800 font-medium text-center">
                    Quest posted successfully!
                  </div>
                )}
                {submissionError && (
                  <p className="mt-3 text-sm text-red-600 font-medium text-center" role="alert">
                    {submissionError}
                  </p>
                )}
              </div>
            </form>
          </ScrollReveal>

          {/* RIGHT: SIDEBAR */}
          <ScrollReveal delayMs={100} variant="scale" className="lg:col-span-4">
            <aside aria-label="Quest summary" className="rounded-2xl bg-white border border-white/40 p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] lg:sticky lg:top-6">
              <h2 className="font-display text-lg font-bold text-dark">Your quest</h2>
              <p className={`mt-2 line-clamp-2 text-sm ${form.title.trim() ? "font-semibold text-dark" : "text-muted"}`}>
                {form.title.trim() || "Your title will appear here."}
              </p>

              <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Category</dt>
                  <dd className="font-semibold text-dark">{form.category}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Reward</dt>
                  <dd className="font-display text-base font-bold text-maroon">₱{form.reward || "0"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Meet-up</dt>
                  <dd className="text-right font-semibold text-dark">{form.meetupLocation}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Time</dt>
                  <dd className="font-semibold text-dark">{previewTime}</dd>
                </div>
              </dl>

              <ul className="mt-5 space-y-3 border-t border-border pt-4 text-sm text-muted">
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-maroon" aria-hidden="true" />
                  Your quest expires after 30 minutes if no runner accepts it.
                </li>
                <li className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-maroon" aria-hidden="true" />
                  Meet only at verified public campus locations.
                </li>
              </ul>

              {/* Desktop-only submit button */}
              <button
                type="submit"
                disabled={submitting || shown < 7}
                onClick={handleSubmit}
                className="mt-6 hidden lg:inline-flex w-full items-center justify-center px-6 py-3.5 rounded-xl bg-maroon hover:bg-maroon-dark text-white font-bold text-[15px] shadow-[0_8px_18px_rgba(122,31,50,0.28)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#e6e1d9] disabled:text-muted disabled:opacity-100 disabled:shadow-none"
              >
                {submitting ? "Posting..." : "Review Quest"}
              </button>

              <p className="mt-3 hidden text-center text-xs leading-relaxed text-muted lg:block">
                {shown < 7 ? "Finish the steps on the left to review your quest." : "By posting, you agree to fulfill the reward payment in cash upon successful meetup."}
              </p>

              {success && (
                <div className="mt-4 rounded-xl bg-[#eefbf3] border border-green-200 px-4 py-3 text-sm text-green-800 font-medium text-center hidden lg:block">
                  Quest posted successfully!
                </div>
              )}
              {submissionError && (
                <p className="mt-4 text-sm text-red-600 font-medium text-center hidden lg:block" role="alert">
                  {submissionError}
                </p>
              )}
            </aside>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ShieldCheck,
  MapPin,
  Navigation,
  Banknote,
  Paperclip,
  Tag,
  Type,
  FileText,
  ChevronDown,
} from "lucide-react";
import { createQuest } from "@/lib/db/quests";
import { useAuth } from "@/hooks/useAuth";

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
const ATTACHMENT_REQUIRED_CATEGORIES = ["Printing"];

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
  pickupLocation: string;
  meetupLocation: string;
  meetupHour: string;
  meetupMinute: string;
  meetupPeriod: "AM" | "PM";
  attachmentFile: File | null;
  attachmentName: string;
};

const INITIAL_FORM: FormState = {
  title: "",
  category: "Printing",
  description: "",
  reward: "30",
  pickupLocation: "CIT-U Library",
  meetupLocation: "CIT-U Main Entrance",
  meetupHour: "4",
  meetupMinute: "30",
  meetupPeriod: "PM",
  attachmentFile: null,
  attachmentName: "",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#7a1f32] mb-3">
      {children}
    </p>
  );
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-[#161414] mb-1.5">
      {children}
    </label>
  );
}

const inputClass = `
  w-full rounded-xl border border-[#e5e0d8] bg-white
  px-4 py-3 text-sm text-[#161414] placeholder:text-[#4a4340]/50
  outline-none transition-all duration-300
  focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20
`;

export default function PostQuestPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = "Quest title is required.";
    if (!form.category) next.category = "Select a category.";
    if (!form.description.trim()) next.description = "Add a short description.";
    if (!form.reward.trim() || Number(form.reward) <= 0) next.reward = "Enter a valid reward amount.";
    if (!form.pickupLocation.trim()) next.pickupLocation = "Pickup location is required.";
    if (!form.meetupLocation.trim()) next.meetupLocation = "Meet-up location is required.";
    if (!form.meetupHour || !form.meetupMinute) next.meetupHour = "Please select a valid time.";
    if (ATTACHMENT_REQUIRED_CATEGORIES.includes(form.category) && !form.attachmentFile) {
      next.attachmentFile = `An attachment file is required for ${form.category} tasks.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(false);
    setSubmissionError("");

    if (!user) {
      setSubmissionError("You must be logged in to post a quest.");
      return;
    }

    if (!validate()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setSubmitting(true);

    try {
      const formattedTime = `${form.meetupHour}:${form.meetupMinute} ${form.meetupPeriod}`;
      await createQuest(
        {
          title: form.title.trim(),
          category: form.category,
          description: form.description.trim(),
          reward: Number(form.reward),
          location: form.pickupLocation,
          meetUpPoint: form.meetupLocation,
          preferredTime: formattedTime,
        }
      );

      setSuccess(true);
      setForm(INITIAL_FORM);
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : "Unable to post your quest. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({
      ...prev,
      attachmentFile: file,
      attachmentName: file?.name ?? "",
    }));
    setErrors((prev) => ({ ...prev, attachmentFile: undefined }));
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-lg font-semibold text-white">Checking account status...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 p-8 max-w-md text-center shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <AlertCircle className="w-12 h-12 text-[#7a1f32] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#161414] mb-2">Access Restricted</h2>
          <p className="text-sm text-[#4a4340] mb-6">
            You must be logged in with your verified CIT-U account to create a quest.
          </p>
          <Link
            href="/login"
            className="inline-flex justify-center w-full items-center px-6 py-3.5 rounded-xl bg-[#7a1f32] hover:bg-[#5f1727] text-white font-bold text-[15px] transition-all active:scale-[0.98]"
          >
            Log In Now
          </Link>
        </div>
      </div>
    );
  }

  const previewTime = `${form.meetupHour}:${form.meetupMinute} ${form.meetupPeriod}`;

  return (
    <div className="bg-transparent min-h-full">
      <div className="page-container py-6 sm:py-10 lg:py-12">
        {/* Page Title (mobile) */}
        <div className="mb-6 lg:hidden">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
            Post a New Quest
          </h1>
          <p className="text-sm text-[#f6ecc8]/85">
            Broadcast your task to Wildcats near you
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
          {/* LEFT: FORM */}
          <ScrollReveal className="lg:col-span-8">
            <form
              onSubmit={handleSubmit}
              noValidate
              className={`rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 p-5 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${
                shake ? "animate-form-shake" : ""
              }`}
            >
              {/* Header — desktop only */}
              <div className="mb-8 hidden lg:block">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#161414] mb-2">
                  Post a New Quest
                </h1>
                <p className="text-sm sm:text-base text-[#4a4340]">
                  Fill out details to broadcast your task to Wildcats near you
                </p>
              </div>

              {/* QUEST INFO */}
              <section className="mb-6 sm:mb-8">
                <SectionLabel>Quest Information</SectionLabel>
                <div className="space-y-4">
                  <div>
                    <FieldLabel htmlFor="title">Quest Title</FieldLabel>
                    <div className="relative">
                      <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/45" />
                      <input
                        id="title"
                        type="text"
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                        placeholder="e.g. Print CPE Module"
                        className={`${inputClass} pl-10 ${errors.title ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                      />
                    </div>
                    {errors.title && <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>}
                  </div>

                  <div>
                    <FieldLabel htmlFor="category">Category</FieldLabel>
                    <div className="relative">
                      <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/45 pointer-events-none" />
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
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/55 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="description">Description & Instruction</FieldLabel>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-[#4a4340]/45" />
                      <textarea
                        id="description"
                        rows={4}
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        placeholder="Describe the task clearly so runners know exactly what to do..."
                        className={`${inputClass} pl-10 resize-y min-h-[110px] ${errors.description ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                      />
                    </div>
                    {errors.description && <p className="mt-1.5 text-xs text-red-600">{errors.description}</p>}
                  </div>
                </div>
              </section>

              {/* REWARD */}
              <section className="mb-6 sm:mb-8">
                <SectionLabel>Reward</SectionLabel>
                <div>
                  <FieldLabel htmlFor="reward">Reward Amount (₱)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#c9a227]">₱</span>
                    <input
                      id="reward"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      value={form.reward}
                      onChange={(e) => update("reward", e.target.value)}
                      className={`${inputClass} pl-9 ${errors.reward ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                    />
                  </div>
                  {errors.reward && <p className="mt-1.5 text-xs text-red-600">{errors.reward}</p>}
                </div>
              </section>

              {/* ATTACHMENT */}
              <section className="mb-6 sm:mb-8">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <SectionLabel>Attachment File</SectionLabel>
                  {ATTACHMENT_REQUIRED_CATEGORIES.includes(form.category) && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Required for {form.category}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`
                    w-full rounded-xl border border-dashed bg-[#fbf8f0]/60
                    px-4 py-5 text-sm text-[#4a4340]
                    transition-all duration-300 flex items-center justify-center gap-2
                    active:scale-[0.99]
                    ${errors.attachmentFile
                      ? "border-red-400 bg-red-50/50 text-red-600"
                      : "border-[#d8d3cc] hover:border-[#c9a227] hover:bg-[#fbf8f0]"
                    }
                  `}
                >
                  <Paperclip className={`w-4 h-4 shrink-0 ${errors.attachmentFile ? "text-red-500" : "text-[#7a1f32]"}`} />
                  {form.attachmentName ? (
                    <span className="font-medium text-[#161414] truncate max-w-[80%]">
                      {form.attachmentName}
                    </span>
                  ) : (
                    <span className="text-center">Click to attach a file (PDF, image, doc)</span>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileChange}
                />
                {errors.attachmentFile && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.attachmentFile}</p>
                )}
              </section>

              {/* LOCATION */}
              <section className="mb-6 sm:mb-8">
                <SectionLabel>Location</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel htmlFor="pickup">Pickup / Task Location</FieldLabel>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/45 pointer-events-none" />
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
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/55 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="meetup">Meet-up Location</FieldLabel>
                    <div className="relative">
                      <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/45 pointer-events-none" />
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
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/55 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </section>

              {/* SCHEDULE */}
              <section className="mb-6 sm:mb-8">
                <SectionLabel>Schedule</SectionLabel>
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
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/55 pointer-events-none" />
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
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/55 pointer-events-none" />
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
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/55 pointer-events-none" />
                  </div>
                </div>
                {errors.meetupHour && <p className="mt-1.5 text-xs text-red-600">{errors.meetupHour}</p>}
              </section>

              {/* PAYMENT */}
              <section>
                <SectionLabel>Payment</SectionLabel>
                <div>
                  <FieldLabel>Payment Method</FieldLabel>
                  <div className="w-full rounded-xl border border-[#e5e0d8] bg-[#fbf8f0] px-4 py-3 text-sm text-[#4a4340] flex items-center gap-2 cursor-not-allowed">
                    <Banknote className="w-4 h-4 text-[#4a4340]/55 shrink-0" />
                    <span className="font-medium">Cash on Delivery (COD) — Locked</span>
                  </div>
                </div>
              </section>

              {/* Mobile submit */}
              <div className="mt-8 lg:hidden">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-[#7a1f32] hover:bg-[#5f1727] text-white font-bold text-[15px] shadow-[0_8px_18px_rgba(122,31,50,0.28)] transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? "Posting..." : "Post Quest"}
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
            <aside className="rounded-2xl bg-white/95 backdrop-blur-md border border-white/40 p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] lg:sticky lg:top-6">
              <h2 className="text-lg font-bold text-[#161414] mb-5">Quest Broadcast Rules</h2>

              <div className="rounded-xl border border-[#f0e0a8] bg-[#fbf6e4] p-4 mb-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-[#c9a227] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold tracking-wide uppercase text-[#8a6a1f] mb-1">30-Minute Acceptance Window</p>
                    <p className="text-sm text-[#4a4340] leading-relaxed">
                      If no Quest Runner accepts within 30 minutes, your quest will automatically expire.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#e5e0d8] bg-white p-4 mb-6">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#7a1f32] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#4a4340] leading-relaxed">
                    Your safety is our top priority. Meet only at verified public campus locations.
                  </p>
                </div>
              </div>

              {/* Desktop-only submit button */}
              <button
                type="submit"
                disabled={submitting}
                onClick={handleSubmit}
                className="hidden lg:inline-flex w-full items-center justify-center px-6 py-3.5 rounded-xl bg-[#7a1f32] hover:bg-[#5f1727] text-white font-bold text-[15px] shadow-[0_8px_18px_rgba(122,31,50,0.28)] transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? "Posting..." : "Post Quest"}
              </button>

              <p className="mt-3 text-[11px] text-center text-[#4a4340] leading-relaxed hidden lg:block">
                By posting, you agree to fulfill the reward payment in cash upon successful meetup.
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

              {/* Live preview */}
              <div className="mt-6 pt-5 border-t border-[#e5e0d8]">
                <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#4a4340] mb-3">Quick Preview</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#4a4340]">Category</span>
                    <span className="font-semibold text-[#7a1f32]">{form.category}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#4a4340]">Reward</span>
                    <span className="font-bold text-[#c9a227]">₱{form.reward || "0"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#4a4340]">Meet-up</span>
                    <span className="font-semibold text-[#161414] text-right">{form.meetupLocation}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#4a4340]">Time</span>
                    <span className="font-semibold text-[#161414]">{previewTime}</span>
                  </div>
                  {ATTACHMENT_REQUIRED_CATEGORIES.includes(form.category) && (
                    <div className="flex justify-between gap-3 pt-2 border-t border-[#e5e0d8]">
                      <span className="text-[#4a4340]">File</span>
                      <span className={`font-semibold truncate max-w-[120px] ${form.attachmentFile ? "text-green-600" : "text-red-500"}`}>
                        {form.attachmentFile ? "✓ Attached" : "✗ Missing"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
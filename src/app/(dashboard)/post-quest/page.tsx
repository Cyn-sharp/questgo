"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import {
  AlertCircle,
  ShieldCheck,
  MapPin,
  Navigation,
  Clock,
  Banknote,
  Paperclip,
  Tag,
  Type,
  FileText,
  ChevronDown,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const CATEGORIES = [
  "Printing",
  "Pickup",
  "Delivery",
  "Shopping",
  "Other",
] as const;

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

type FormState = {
  title: string;
  category: string;
  description: string;
  reward: string;
  pickupLocation: string;
  meetupLocation: string;
  meetupTime: string;
  attachmentName: string;
};

const INITIAL_FORM: FormState = {
  title: "",
  category: "Printing",
  description: "",
  reward: "30",
  pickupLocation: "CIT-U Library",
  meetupLocation: "CIT-U Main Entrance",
  meetupTime: "16:30",
  attachmentName: "",
};

/* ─────────────────────────────────────────────────────────
   SMALL UI HELPERS
───────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#7a1f32] mb-3">
      {children}
    </p>
  );
}

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-semibold text-[#161414] mb-1.5"
    >
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

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function PostQuestPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
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
    if (!form.reward.trim() || Number(form.reward) <= 0)
      next.reward = "Enter a valid reward amount.";
    if (!form.pickupLocation.trim())
      next.pickupLocation = "Pickup location is required.";
    if (!form.meetupLocation.trim())
      next.meetupLocation = "Meet-up location is required.";
    if (!form.meetupTime) next.meetupTime = "Choose a preferred time.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(false);

    if (!validate()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setSubmitting(true);
    // Mock submit — wire to API later
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSuccess(true);
  }

  function handleFileChange(file?: File | null) {
    update("attachmentName", file?.name ?? "");
  }

  function formatTimeDisplay(value: string) {
    if (!value) return "";
    const [h, m] = value.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  }

  return (
    <div className="bg-[#fbf8f0] min-h-full">
      <div className="page-container py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ───────────── LEFT: FORM ───────────── */}
          <ScrollReveal className="lg:col-span-8">
            <form
              onSubmit={handleSubmit}
              noValidate
              className={`card-surface p-6 sm:p-8 ${shake ? "animate-form-shake" : ""}`}
            >
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#161414] mb-2">
                  Post a New Quest
                </h1>
                <p className="text-sm sm:text-base text-[#4a4340]">
                  Fill out details to broadcast your task to Wildcats near you
                </p>
              </div>

              {/* QUEST INFORMATION */}
              <section className="mb-8">
                <SectionLabel>Quest Information</SectionLabel>

                <div className="space-y-4">
                  {/* Title */}
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
                        className={`${inputClass} pl-10 ${
                          errors.title ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""
                        }`}
                      />
                    </div>
                    {errors.title && (
                      <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>
                    )}
                  </div>

                  {/* Category */}
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

                  {/* Description */}
                  <div>
                    <FieldLabel htmlFor="description">
                      Description &amp; Instruction
                    </FieldLabel>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-[#4a4340]/45" />
                      <textarea
                        id="description"
                        rows={4}
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        placeholder="Describe the task clearly so runners know exactly what to do..."
                        className={`${inputClass} pl-10 resize-y min-h-[110px] ${
                          errors.description
                            ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                            : ""
                        }`}
                      />
                    </div>
                    {errors.description && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* REWARD */}
              <section className="mb-8">
                <SectionLabel>Reward</SectionLabel>
                <div>
                  <FieldLabel htmlFor="reward">Reward Amount (₱)</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#c9a227]">
                      ₱
                    </span>
                    <input
                      id="reward"
                      type="number"
                      min={1}
                      step={1}
                      value={form.reward}
                      onChange={(e) => update("reward", e.target.value)}
                      className={`${inputClass} pl-9 ${
                        errors.reward
                          ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                          : ""
                      }`}
                    />
                  </div>
                  {errors.reward && (
                    <p className="mt-1.5 text-xs text-red-600">{errors.reward}</p>
                  )}
                </div>
              </section>

              {/* ATTACHMENT */}
              <section className="mb-8">
                <SectionLabel>Attachment File (Optional)</SectionLabel>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="
                    w-full rounded-xl border border-dashed border-[#d8d3cc] bg-[#fbf8f0]/60
                    px-4 py-5 text-sm text-[#4a4340]
                    hover:border-[#c9a227] hover:bg-[#fbf8f0] transition-all duration-300
                    flex items-center justify-center gap-2
                  "
                >
                  <Paperclip className="w-4 h-4 text-[#7a1f32]" />
                  {form.attachmentName ? (
                    <span className="font-medium text-[#161414] truncate max-w-[80%]">
                      {form.attachmentName}
                    </span>
                  ) : (
                    <span>Click to attach a file (PDF, image, doc)</span>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
              </section>

              {/* LOCATION */}
              <section className="mb-8">
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
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/55 pointer-events-none" />
                    </div>
                    {errors.pickupLocation && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.pickupLocation}
                      </p>
                    )}
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
                          <option key={`meet-${loc}`} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/55 pointer-events-none" />
                    </div>
                    {errors.meetupLocation && (
                      <p className="mt-1.5 text-xs text-red-600">
                        {errors.meetupLocation}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* SCHEDULE */}
              <section className="mb-8">
                <SectionLabel>Schedule</SectionLabel>
                <div>
                  <FieldLabel htmlFor="time">Preferred Meet-up Time</FieldLabel>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4340]/45 pointer-events-none" />
                    <input
                      id="time"
                      type="time"
                      value={form.meetupTime}
                      onChange={(e) => update("meetupTime", e.target.value)}
                      className={`${inputClass} pl-10 ${
                        errors.meetupTime
                          ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                          : ""
                      }`}
                    />
                  </div>
                  {form.meetupTime && (
                    <p className="mt-1.5 text-xs text-[#4a4340]">
                      Selected:{" "}
                      <span className="font-semibold text-[#161414]">
                        {formatTimeDisplay(form.meetupTime)}
                      </span>
                    </p>
                  )}
                  {errors.meetupTime && (
                    <p className="mt-1.5 text-xs text-red-600">
                      {errors.meetupTime}
                    </p>
                  )}
                </div>
              </section>

              {/* PAYMENT */}
              <section>
                <SectionLabel>Payment</SectionLabel>
                <div>
                  <FieldLabel>Payment Method</FieldLabel>
                  <div
                    className="
                      w-full rounded-xl border border-[#e5e0d8] bg-[#fbf8f0]
                      px-4 py-3 text-sm text-[#4a4340]
                      flex items-center gap-2 cursor-not-allowed
                    "
                    title="Cash on Delivery is the only payment method for campus safety"
                  >
                    <Banknote className="w-4 h-4 text-[#4a4340]/55" />
                    <span className="font-medium">
                      Cash on Delivery (COD) — Locked
                    </span>
                  </div>
                </div>
              </section>

              {/* Mobile-only submit (desktop uses sidebar button) */}
              <div className="mt-8 lg:hidden">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full justify-center"
                >
                  {submitting ? "Posting..." : "Post Quest"}
                </button>
                {success && (
                  <p className="mt-3 text-sm text-green-700 font-medium text-center">
                    Quest posted successfully! Runners can now see it.
                  </p>
                )}
              </div>
            </form>
          </ScrollReveal>

          {/* ───────────── RIGHT: RULES SIDEBAR ───────────── */}
          <ScrollReveal delayMs={100} variant="scale" className="lg:col-span-4">
            <aside className="card-surface p-6 sticky top-6">
              <h2 className="text-lg font-bold text-[#161414] mb-5">
                Quest Broadcast Rules
              </h2>

              {/* 30-min window */}
              <div className="rounded-xl border border-[#f0e0a8] bg-[#fbf6e4] p-4 mb-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-[#c9a227] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold tracking-wide uppercase text-[#8a6a1f] mb-1">
                      30-Minute Acceptance Window
                    </p>
                    <p className="text-sm text-[#4a4340] leading-relaxed">
                      If no Quest Runner accepts within 30 minutes, your quest
                      will automatically expire and be removed from the available
                      marketplace pool.
                    </p>
                  </div>
                </div>
              </div>

              {/* Safety note */}
              <div className="rounded-xl border border-[#e5e0d8] bg-white p-4 mb-6">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#7a1f32] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#4a4340] leading-relaxed">
                    Your safety is our top priority. Meet only at verified public
                    campus locations during daytime.
                  </p>
                </div>
              </div>

              {/* Desktop submit */}
              <button
                type="submit"
                form="n/a"
                disabled={submitting}
                onClick={handleSubmit}
                className="btn-primary w-full justify-center text-[15px] py-3.5"
              >
                {submitting ? "Posting..." : "Post Quest"}
              </button>

              <p className="mt-3 text-[11px] text-center text-[#4a4340] leading-relaxed">
                By posting, you agree to fulfill the reward payment in cash upon
                successful meetup.
              </p>

              {success && (
                <div className="mt-4 rounded-xl bg-[#eefbf3] border border-green-200 px-4 py-3 text-sm text-green-800 font-medium text-center">
                  Quest posted successfully! Runners can now see it on the
                  marketplace.
                </div>
              )}

              {/* Live preview chips */}
              <div className="mt-6 pt-5 border-t border-[#e5e0d8]">
                <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#4a4340] mb-3">
                  Quick Preview
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#4a4340]">Category</span>
                    <span className="font-semibold text-[#7a1f32]">
                      {form.category}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#4a4340]">Reward</span>
                    <span className="font-bold text-[#c9a227]">
                      ₱{form.reward || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#4a4340]">Meet-up</span>
                    <span className="font-semibold text-[#161414] text-right">
                      {form.meetupLocation}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#4a4340]">Time</span>
                    <span className="font-semibold text-[#161414]">
                      {formatTimeDisplay(form.meetupTime) || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
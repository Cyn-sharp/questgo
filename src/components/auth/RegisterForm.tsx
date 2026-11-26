"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon } from "@/components/ui/icons/EyeIcon";
import { auth } from "@/lib/auth/firebase";
import { db } from "@/lib/auth/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile, type User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { EMAIL_PLACEHOLDER, EMAIL_POLICY_MESSAGE, isAllowedEmail } from "@/lib/auth/email-policy";
import { STUDENT_ID_ACCEPT, shrinkStudentIdPhoto, studentIdPickProblem, uploadStudentId } from "@/lib/auth/student-id";
import { COURSES, courseLabel, isCourse } from "@/lib/auth/courses";
import { ChevronDown } from "lucide-react";

type FormValues = {
  fullName: string;
  course: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialFormValues: FormValues = {
  fullName: "",
  course: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const ID_REQUIRED_MESSAGE = "Please add a photo of your CIT-U ID. An admin checks it to confirm you're a CIT-U student.";

function IdCardIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7.5" cy="9" r="1.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.75 13.25c.5-1.25 1.5-2 2.75-2s2.25.75 2.75 2M12 8.5h3M12 11.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [formValues, setFormValues] = useState(initialFormValues);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idUploadFailed, setIdUploadFailed] = useState(false);
  const idInputRef = useRef<HTMLInputElement>(null);
  // Set once the account exists, so a failed ID upload can be retried without signing up again.
  const createdUserRef = useRef<User | null>(null);

  const updateField = (field: keyof FormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormMessage("");
  };

  const handleIdSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const problem = studentIdPickProblem(file);
    if (problem) {
      setFormMessage(problem);
      event.target.value = "";
      return;
    }

    setIdPhoto(file);
    setFormMessage("");
  };

  // Shrinks and uploads the ID photo, then moves on to the "check your email" page.
  const sendIdAndContinue = async (user: User, photo: File) => {
    try {
      await uploadStudentId(await user.getIdToken(), await shrinkStudentIdPhoto(photo));
    } catch (error) {
      const reason = error instanceof Error && error.message ? `${error.message} ` : "";
      setIdUploadFailed(true);
      setFormMessage(`Your account was created, but your ID photo didn't upload. ${reason}Press "Upload ID & Continue" to try again.`);
      return;
    }
    router.replace(`/verify-email?email=${encodeURIComponent(user.email ?? "")}`);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage("");

    // The account already exists (an earlier ID upload failed), so only retry the ID photo.
    const createdUser = createdUserRef.current;
    if (createdUser) {
      if (!idPhoto) {
        setFormMessage(ID_REQUIRED_MESSAGE);
        return;
      }
      setIsSubmitting(true);
      try {
        await sendIdAndContinue(createdUser, idPhoto);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!formValues.fullName.trim() || !formValues.email.trim()) {
      setFormMessage("Please complete your name and CIT-U email.");
      return;
    }
    if (!isCourse(formValues.course)) {
      setFormMessage("Please choose your course.");
      return;
    }
    const normalizedEmail = formValues.email.trim().toLowerCase();
    if (!isAllowedEmail(normalizedEmail)) {
      setFormMessage(EMAIL_POLICY_MESSAGE);
      return;
    }
    if (formValues.password.length < 8) {
      setFormMessage("Your password must contain at least 8 characters.");
      return;
    }
    if (formValues.password !== formValues.confirmPassword) {
      setFormMessage("Your passwords do not match.");
      return;
    }
    if (!idPhoto) {
      setFormMessage(ID_REQUIRED_MESSAGE);
      return;
    }
    if (!hasAgreedToTerms) {
      setFormMessage("Please agree to the Terms & Conditions and Privacy Policy.");
      return;
    }

    try {
      setIsSubmitting(true);
      const credential = await createUserWithEmailAndPassword(
        auth,
        formValues.email.trim().toLowerCase(),
        formValues.password
      );
      const { user } = credential;

      const displayName = formValues.fullName.trim();
      await updateProfile(user, { displayName });
      await setDoc(
        doc(db, "users", user.uid),
        {
          id: user.uid,
          email: normalizedEmail,
          fullName: displayName,
          course: formValues.course,
          isVerified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await sendEmailVerification(user);

      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 8000);
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            idToken: await user.getIdToken(),
            fullName: displayName,
            course: formValues.course,
            email: normalizedEmail,
          }),
        });
        window.clearTimeout(timeoutId);
      } catch (error) {
        console.error("Server profile sync failed during registration:", error);
      }

      createdUserRef.current = user;
      await sendIdAndContinue(user, idPhoto);
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : "";
      const message =
        code === "auth/email-already-in-use"
          ? "An account already exists for this email. Try logging in."
          : code === "auth/weak-password"
            ? "Choose a stronger password with at least 8 characters."
            : code === "auth/operation-not-allowed"
              ? "Email/password registration is not enabled in Firebase Authentication."
              : code === "auth/too-many-requests"
                ? "Firebase temporarily blocked requests. Please wait and try again."
                : code === "auth/network-request-failed"
                  ? "Could not contact Firebase. Check your internet connection and try again."
                  : "Something went wrong. Please try again.";
      setFormMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className="flex w-full min-w-0 justify-center bg-cream p-4 [scrollbar-width:thin] sm:p-8 lg:overflow-y-auto lg:p-10"
      aria-labelledby="registration-heading"
    >
      <div className="my-auto flex w-full max-w-[440px] flex-col gap-4">
        <header className="flex flex-col gap-1.5">
          <h1
            id="registration-heading"
            className="max-w-full font-outfit text-[24px] font-extrabold leading-[1.1] text-maroon sm:text-[32px]"
          >
            Create Your QuestGo Account
          </h1>
          <p className="font-inter text-sm text-muted sm:text-[15px]">
            Join the CIT-U student community.
          </p>
        </header>

        <form
          className="flex flex-col gap-4 rounded-2xl border border-[#e5e0d9] bg-white p-5 shadow-[0_10px_24px_#00000012] sm:p-6"
          onSubmit={handleSubmit}
          noValidate
          aria-describedby={formMessage ? "registration-status" : undefined}
        >
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 font-inter text-sm font-semibold text-dark">
              Full Name
              <input
                id="full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Dave Alinson"
                value={formValues.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                className="h-11 rounded-xl border border-[#e8e7e3] bg-cream px-3.5 font-normal outline-none transition-colors focus:border-maroon focus:bg-white focus:ring-2 focus:ring-[#7a1f3233]"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5 font-inter text-sm font-semibold text-dark">
              Course
              <span className="relative flex">
                <select
                  id="course"
                  name="course"
                  value={formValues.course}
                  onChange={(event) => updateField("course", event.target.value)}
                  className={`h-11 w-full appearance-none rounded-xl border border-[#e8e7e3] bg-cream pl-3.5 pr-10 font-normal outline-none transition-colors focus:border-maroon focus:bg-white focus:ring-2 focus:ring-[#7a1f3233] ${formValues.course ? "text-dark" : "text-gray-500"}`}
                  required
                >
                  <option value="" disabled>
                    Select your course
                  </option>
                  {COURSES.map((course) => (
                    <option key={course} value={course} className="text-dark">
                      {courseLabel(course)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              </span>
            </label>

            <label className="flex flex-col gap-1.5 font-inter text-sm font-semibold text-dark">
              Email
              <input
                id="cit-u-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder={EMAIL_PLACEHOLDER}
                value={formValues.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="h-11 rounded-xl border border-[#e8e7e3] bg-cream px-3.5 font-normal outline-none transition-colors focus:border-maroon focus:bg-white focus:ring-2 focus:ring-[#7a1f3233]"
                required
              />
            </label>

            <PasswordField
              id="register-password"
              label="Password"
              value={formValues.password}
              visible={showPassword}
              onChange={(value) => updateField("password", value)}
              onToggle={() => setShowPassword((value) => !value)}
            />
            <PasswordField
              id="confirm-password"
              label="Confirm Password"
              value={formValues.confirmPassword}
              visible={showConfirmPassword}
              onChange={(value) => updateField("confirmPassword", value)}
              onToggle={() => setShowConfirmPassword((value) => !value)}
            />

            <div className="flex flex-col gap-1.5">
              <span className="font-inter text-sm font-semibold text-dark">
                CIT-U ID Photo <span className="text-maroon">*</span>
              </span>
              <input
                ref={idInputRef}
                id="student-id-photo"
                name="studentIdPhoto"
                type="file"
                accept={STUDENT_ID_ACCEPT}
                className="sr-only"
                onChange={handleIdSelection}
              />
              <button
                type="button"
                onClick={() => idInputRef.current?.click()}
                className={`flex min-h-[52px] items-center gap-3 rounded-xl border-[1.5px] border-dashed p-2.5 text-left text-maroon transition-colors hover:border-maroon hover:bg-[#fdf9eb] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-maroon ${idPhoto ? "border-maroon bg-[#fdf9eb]" : "border-[#d9b8bf] bg-cream"}`}
                aria-label="Upload a photo of your CIT-U ID (required)"
                aria-describedby="student-id-help"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                  <span className="h-5 w-5">
                    <IdCardIcon />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-inter text-[13px] font-semibold">
                    {idPhoto ? idPhoto.name : "Click to upload your CIT-U ID"}
                  </span>
                  <span className="block font-inter text-xs font-normal text-muted">
                    Front side, JPG or PNG. Your name and photo must be clear.
                  </span>
                </span>
              </button>
              <p id="student-id-help" className="font-inter text-xs leading-4 text-muted">
                An admin checks your ID to confirm you&apos;re a CIT-U student. Only QuestGo admins can see it.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-2 font-inter text-[13px] text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={hasAgreedToTerms}
              onChange={(event) => {
                setHasAgreedToTerms(event.target.checked);
                setFormMessage("");
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-maroon cursor-pointer"
            />
            <span>
              I agree to the{" "}
              <a
                href="/terms"
                className="font-semibold text-maroon underline-offset-2 hover:underline"
              >
                Terms &amp; Conditions
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="font-semibold text-maroon underline-offset-2 hover:underline"
              >
                Privacy Policy
              </a>
            </span>
          </label>

          {formMessage ? (
            <p
              id="registration-status"
              className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 font-inter text-[13px] text-maroon"
              role="alert"
            >
              {formMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-xl bg-maroon px-6 py-2.5 font-inter text-[15px] font-semibold text-white shadow-[0_8px_18px_#7a1f3226] transition-all hover:opacity-95 hover:shadow-[0_12px_24px_#7a1f3240] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-maroon focus:ring-offset-2 disabled:opacity-60 disabled:active:scale-100"
          >
            {isSubmitting
              ? idUploadFailed ? "UPLOADING ID..." : "CREATING ACCOUNT..."
              : idUploadFailed ? "UPLOAD ID & CONTINUE" : "CREATE ACCOUNT"}
          </button>
          <p className="text-center font-inter text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-maroon hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
};

function PasswordField({ id, label, value, visible, onChange, onToggle }: PasswordFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 font-inter text-sm font-semibold text-dark">
      {label}
      <span className="flex h-11 items-center rounded-xl border border-[#e8e7e3] bg-cream px-3.5 transition-colors focus-within:border-maroon focus-within:bg-white focus-within:ring-2 focus-within:ring-[#7a1f3233]">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Enter at least 8 characters"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent font-normal outline-none"
          required
          minLength={8}
        />
        <button
          type="button"
          onClick={onToggle}
          className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#e8e7e3] bg-white text-muted transition-all hover:text-dark active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#7a1f3233]"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          <span className="h-[18px] w-[18px]">
            <EyeIcon open={visible} />
          </span>
        </button>
      </span>
    </label>
  );
}
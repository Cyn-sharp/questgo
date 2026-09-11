"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon } from "@/components/ui/icons/EyeIcon";
import { auth, storage } from "@/lib/auth/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

type FormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialFormValues: FormValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function UploadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-full w-full" aria-hidden="true">
      <path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 13v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [formValues, setFormValues] = useState(initialFormValues);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof FormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormMessage("");
  };

  const handlePhotoSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setFormMessage("Please select a PNG or JPG image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormMessage("Your profile photo must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedPhoto(file);
    setFormMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage("");

    if (!formValues.fullName.trim() || !formValues.email.trim()) {
      setFormMessage("Please complete your name and CIT-U email.");
      return;
    }
    const normalizedEmail = formValues.email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@cit.edu") && !normalizedEmail.endsWith("@gmail.com")) {
      setFormMessage("Please use a CIT-U or Gmail address for testing.");
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
      await sendEmailVerification(user);

      let profilePhotoUrl: string | undefined;

      if (selectedPhoto) {
        const photoRef = ref(storage, `profilePhotos/${user.uid}/profile`);
        await uploadBytes(photoRef, selectedPhoto, { contentType: selectedPhoto.type });
        profilePhotoUrl = await getDownloadURL(photoRef);
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: await user.getIdToken(),
          fullName: formValues.fullName.trim(),
          email: formValues.email.trim().toLowerCase(),
          profilePhotoUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setFormMessage(
          data?.message ??
            (response.status === 404
              ? "Registration service is not configured yet."
              : "Something went wrong creating your account.")
        );
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(formValues.email.trim().toLowerCase())}`);
    } catch (error: any) {
      const message =
        error?.code === "auth/email-already-in-use"
          ? "An account already exists for this email. Try logging in."
          : error?.code === "auth/weak-password"
            ? "Choose a stronger password with at least 8 characters."
            : error?.code === "auth/operation-not-allowed"
              ? "Email/password registration is not enabled in Firebase Authentication."
              : error?.code === "auth/too-many-requests"
                ? "Firebase temporarily blocked requests. Please wait and try again."
                : error?.code === "auth/network-request-failed"
                  ? "Could not contact Firebase. Check your internet connection and try again."
                  : error?.code === "storage/unauthorized"
                    ? "Your account was created, but the profile photo could not be uploaded. Try registering without a photo."
                    : "Something went wrong. Please try again.";
      setFormMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex w-full min-w-0 items-center justify-center bg-cream p-4 sm:p-8 lg:p-10" aria-labelledby="registration-heading">
      <div className="flex w-full max-w-[440px] flex-col gap-4">
        <header className="flex flex-col gap-1.5">
          <h1 id="registration-heading" className="max-w-full font-outfit text-[26px] font-extrabold leading-[1.1] text-maroon sm:text-[32px]">Create Your QuestGo Account</h1>
          <p className="font-inter text-[15px] text-muted">Join the CIT-U student community.</p>
        </header>

        <form className="flex flex-col gap-4 rounded-2xl border border-[#e5e0d9] bg-white p-5 shadow-[0_10px_24px_#00000012] sm:p-6" onSubmit={handleSubmit} noValidate aria-describedby={formMessage ? "registration-status" : undefined}>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 font-inter text-sm font-semibold text-dark">
              Full Name
              <input id="full-name" name="fullName" type="text" autoComplete="name" placeholder="Dave Alinson" value={formValues.fullName} onChange={(event) => updateField("fullName", event.target.value)} className="h-11 rounded-xl border border-[#e8e7e3] bg-cream px-3.5 font-normal outline-none focus:border-maroon focus:ring-2 focus:ring-[#7a1f3233]" required />
            </label>

            <label className="flex flex-col gap-1.5 font-inter text-sm font-semibold text-dark">
              Email
              <input id="cit-u-email" name="email" type="email" autoComplete="email" placeholder="studentname@cit.edu or Gmail" value={formValues.email} onChange={(event) => updateField("email", event.target.value)} className="h-11 rounded-xl border border-[#e8e7e3] bg-cream px-3.5 font-normal outline-none focus:border-maroon focus:ring-2 focus:ring-[#7a1f3233]" required />
            </label>

            <PasswordField id="register-password" label="Password" value={formValues.password} visible={showPassword} onChange={(value) => updateField("password", value)} onToggle={() => setShowPassword((value) => !value)} />
            <PasswordField id="confirm-password" label="Confirm Password" value={formValues.confirmPassword} visible={showConfirmPassword} onChange={(value) => updateField("confirmPassword", value)} onToggle={() => setShowConfirmPassword((value) => !value)} />

            <div className="flex flex-col gap-1.5">
              <span className="font-inter text-sm font-semibold text-dark">Optional Profile Photo</span>
              <input ref={photoInputRef} id="profile-photo" name="profilePhoto" type="file" accept="image/png,image/jpeg" className="sr-only" onChange={handlePhotoSelection} />
              <button type="button" onClick={() => photoInputRef.current?.click()} className="flex h-12 items-center gap-3 rounded-xl border-[1.5px] border-dashed border-[#e8e7e3] bg-cream p-2.5 text-left text-maroon focus:outline-none focus:ring-2 focus:ring-maroon" aria-label="Upload your optional profile photo">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white"><span className="h-5 w-5"><UploadIcon /></span></span>
                <span className="min-w-0">
                  <span className="block truncate font-inter text-[13px] font-semibold">{selectedPhoto ? selectedPhoto.name : "Click to upload your photo"}</span>
                  <span className="block font-inter text-[11px] font-normal text-muted">PNG, JPG up to 5MB</span>
                </span>
              </button>
            </div>
          </div>

          <aside className="rounded-lg border border-[#f6ecc8] bg-[#fdf9eb] p-3 font-inter text-xs leading-[16.8px] text-[#8a6a1f]">Testing mode: CIT-U and Gmail addresses are currently accepted. Verification is sent to the address you enter.</aside>

          <label className="flex items-start gap-2 font-inter text-[13px] text-muted">
            <input type="checkbox" checked={hasAgreedToTerms} onChange={(event) => { setHasAgreedToTerms(event.target.checked); setFormMessage(""); }} className="mt-0.5 h-4 w-4 shrink-0 accent-maroon" />
            <span>I agree to the <a href="/terms-and-conditions" className="font-semibold text-maroon underline-offset-2 hover:underline">Terms &amp; Conditions</a> and <a href="/privacy-policy" className="font-semibold text-maroon underline-offset-2 hover:underline">Privacy Policy</a></span>
          </label>

          {formMessage ? <p id="registration-status" className="font-inter text-[13px] text-maroon" role="alert">{formMessage}</p> : null}

          <button type="submit" disabled={isSubmitting} className="h-11 rounded-xl bg-maroon px-6 py-2.5 font-inter text-[15px] font-semibold text-white shadow-[0_8px_18px_#7a1f3226] transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-maroon focus:ring-offset-2 disabled:opacity-60">{isSubmitting ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}</button>
          <p className="text-center font-inter text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-maroon hover:underline">Log In</Link></p>
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
      <span className="flex h-11 items-center rounded-xl border border-[#e8e7e3] bg-cream px-3.5 focus-within:border-maroon focus-within:ring-2 focus-within:ring-[#7a1f3233]">
        <input id={id} name={id} type={visible ? "text" : "password"} autoComplete="new-password" placeholder="Enter at least 8 characters" value={value} onChange={(event) => onChange(event.target.value)} className="h-full min-w-0 flex-1 bg-transparent font-normal outline-none" required minLength={8} />
        <button type="button" onClick={onToggle} className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-[#e8e7e3] bg-white text-muted focus:outline-none focus:ring-2 focus:ring-[#7a1f3233]" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={visible}>
          <span className="h-[18px] w-[18px]"><EyeIcon open={visible} /></span>
        </button>
      </span>
    </label>
  );
}

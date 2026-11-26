"use client";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id: string;
};

// A labelled on/off control. Screen readers announce it as a switch with its state.
export function Switch({ checked, onChange, label, description, disabled, id }: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p id={`${id}-label`} className="font-semibold text-gray-900">{label}</p>
        {description && <p id={`${id}-description`} className="mt-0.5 text-sm text-gray-600">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-description` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-[#7a1f32]" : "bg-gray-300"}`}
      >
        <span aria-hidden="true" className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

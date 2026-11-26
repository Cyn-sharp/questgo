"use client";

import type { LucideIcon } from "lucide-react";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
};

// A labelled on/off row. Screen readers announce it as a switch with its state,
// and the whole row is clickable, not only the small control.
export function Switch({ checked, onChange, label, description, disabled, id, icon: Icon, iconBg = "bg-[#f4f2ef]", iconColor = "text-[#4a4340]" }: SwitchProps) {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`group flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 transition-colors duration-300 ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-[#fbf8f0]"}`}
    >
      {Icon && (
        <div className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${iconBg}`}>
          <Icon aria-hidden="true" className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p id={`${id}-label`} className="text-sm sm:text-base font-bold text-[#161414]">{label}</p>
        {description && <p id={`${id}-description`} className="text-[12px] sm:text-sm text-[#4a4340]">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-description` : undefined}
        disabled={disabled}
        onClick={(event) => { event.stopPropagation(); onChange(!checked); }}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] focus-visible:ring-offset-2 disabled:opacity-50 ${checked ? "bg-[#7a1f32] shadow-[0_4px_12px_rgba(122,31,50,0.35)]" : "bg-[#d8d3cc]"}`}
      >
        <span aria-hidden="true" className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

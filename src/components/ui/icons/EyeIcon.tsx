type EyeIconProps = {
  open: boolean;
};

export function EyeIcon({ open }: EyeIconProps) {
  return (
    <svg viewBox="0 0 18 18" fill="none" className="h-full w-full" aria-hidden="true">
      {open ? (
        <>
          <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="9" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.4" />
        </>
      ) : (
        <path d="M2 2l14 14M6.5 6.7C4.9 7.7 3.6 9 3.6 9s3 6 8 6c1.1 0 2.1-.24 3-.63M9.6 4.06C9.4 4.03 9.2 4 9 4c-.8 0-1.6.14-2.3.4M11.9 5.4c2.1 1.1 3.5 3.6 3.5 3.6s-.6 1.2-1.7 2.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

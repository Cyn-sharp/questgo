import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  updatedAt?: string;
};

export function LegalPageShell({
  title,
  subtitle,
  children,
  updatedAt = "March 14, 2026",
}: Props) {
  return (
    <section className="bg-[#fbf8f0] min-h-screen">
      <div className="mx-auto max-w-3xl px-6 md:px-16 py-14 md:py-20">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#7a1f32] hover:text-[#5f1727] transition"
          >
            ← Back to Home
          </Link>
        </div>

        <header className="mb-10">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] uppercase text-[#c9a227]">
            QuestGo Legal
          </p>
          <h1 className="font-extrabold text-3xl md:text-4xl tracking-tight text-[#161414]">
            {title}
          </h1>
          <p className="mt-3 text-base text-[#4a4340]">{subtitle}</p>
          <p className="mt-2 text-sm text-[#4a4340]/80">
            Last updated: {updatedAt}
          </p>
        </header>

        <article className="card-surface p-6 md:p-10 space-y-8 text-[#4a4340] leading-relaxed">
          {children}
        </article>

        <div className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="font-medium text-[#7a1f32] hover:underline">
            Terms & Conditions
          </Link>
          <span className="text-[#d8d3cc]">•</span>
          <Link href="/privacy" className="font-medium text-[#7a1f32] hover:underline">
            Privacy Policy
          </Link>
          <span className="text-[#d8d3cc]">•</span>
          <Link href="/" className="font-medium text-[#7a1f32] hover:underline">
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-[#161414] tracking-tight">{title}</h2>
      <div className="space-y-3 text-[15px]">{children}</div>
    </section>
  );
}
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
    <section className="bg-cream min-h-screen">
      <div className="mx-auto max-w-3xl px-6 md:px-16 py-14 md:py-20">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-maroon hover:text-maroon-dark transition"
          >
            ← Back to Home
          </Link>
        </div>

        <header className="mb-10">
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] uppercase text-gold-ink">
            QuestGo Legal
          </p>
          <h1 className="font-extrabold text-3xl md:text-4xl tracking-tight text-dark">
            {title}
          </h1>
          <p className="mt-3 text-base text-muted">{subtitle}</p>
          <p className="mt-2 text-sm text-muted/80">
            Last updated: {updatedAt}
          </p>
        </header>

        <article className="card-surface p-6 md:p-10 space-y-8 text-muted leading-relaxed">
          {children}
        </article>

        <div className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="font-medium text-maroon hover:underline">
            Terms & Conditions
          </Link>
          <span className="text-subtle">•</span>
          <Link href="/runner-terms" className="font-medium text-maroon hover:underline">
            Runner Terms
          </Link>
          <span className="text-subtle">•</span>
          <Link href="/privacy" className="font-medium text-maroon hover:underline">
            Privacy Policy
          </Link>
          <span className="text-subtle">•</span>
          <Link href="/" className="font-medium text-maroon hover:underline">
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
      <h2 className="text-xl font-bold text-dark tracking-tight">{title}</h2>
      <div className="space-y-3 text-[15px]">{children}</div>
    </section>
  );
}
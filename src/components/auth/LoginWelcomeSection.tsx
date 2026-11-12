import Image from "next/image";

export function LoginWelcomeSection() {
  return (
    <aside
      className="flex w-full flex-col justify-between gap-12 bg-[#4e0f1e] p-8 lg:w-1/2 lg:p-16"
      aria-labelledby="welcome-heading"
    >
      <header className="inline-flex items-center gap-4">
        <div
          className="relative h-[60px] w-[60px] overflow-hidden rounded-xl bg-[#7a1f32]"
          role="img"
          aria-label="QuestGo logo"
        >
          <Image src="/logo.png" alt="" fill sizes="60px" className="object-contain" />
        </div>
        <div className="inline-flex flex-col gap-0.5">
          <span className="font-outfit text-2xl font-extrabold text-white">QuestGo</span>
          <span className="font-inter text-xs font-semibold tracking-[0.18px] text-[#8a6a1f]">
            CIT-U WILDCAT GIGS
          </span>
        </div>
      </header>

      <section className="flex max-w-2xl flex-col gap-4">
        <h1 id="welcome-heading" className="font-outfit text-4xl font-extrabold leading-tight">
          <span className="text-white">Welcome Back to </span>
          <span className="text-[#d9aa28]">QuestGo.</span>
        </h1>
        <p className="font-inter text-lg leading-relaxed text-[#fbf8f0]">
          Your next Quest is waiting. Hop on to resolve pending tasks, deliver favors, or post something you need completed today.
        </p>
      </section>

      <footer className="inline-flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#f6ecc8] bg-[#fdf9eb] px-2 py-1 font-inter text-[11px] font-semibold tracking-[0.06px] text-[#7a1f32]">
          <span aria-hidden="true">&#10003;</span> CIT-U VERIFIED
        </span>
        <p className="font-inter text-[13px] text-[#f6ecc8]">Safer peer-to-peer campus platform</p>
      </footer>
    </aside>
  );
}

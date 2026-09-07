export const FinalCta = (): JSX.Element => {
  return (
    <section
      className="flex flex-col items-center gap-6 px-6 md:px-16 py-16 md:py-20 bg-[#fbf8f0] border-b border-solid border-[#e5e0d9] text-center"
      aria-labelledby="final-cta-heading"
    >
      <h2
        id="final-cta-heading"
        className="font-extrabold text-[#7a1f32] text-3xl md:text-4xl leading-tight [text-shadow:0px_6px_16px_#7a1f3214] max-w-2xl"
      >
        Ready to Start Your First Quest?
      </h2>

      <p className="font-normal text-[#4a4340] text-base max-w-lg">
        Join the CIT-U student community today and turn everyday tasks into
        opportunities.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href="/register"
          className="inline-flex items-center justify-center px-6 py-3 bg-[#7a1f32] hover:bg-[#661a2a] rounded-xl shadow-[0px_8px_18px_#7a1f3226] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a1f32]"
        >
          <span className="font-semibold text-white text-[15px]">
            Create an Account
          </span>
        </a>

        <a
          href="/login"
          className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-[#fff0f0] rounded-xl border-[1.5px] border-solid border-[#7a1f32] shadow-[0px_6px_16px_#00000012] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a1f32]"
        >
          <span className="font-semibold text-[#7a1f32] text-[15px]">
            Log In
          </span>
        </a>
      </div>
    </section>
  );
};
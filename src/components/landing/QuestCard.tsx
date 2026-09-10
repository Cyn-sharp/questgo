export const QuestCard = () => {
  return (
    <div className="relative animate-float animate-fade-up delay-300">
      {/* Soft gold glow behind card */}
      <div className="absolute -inset-4 rounded-[40px] bg-[#c9a227]/10 blur-2xl animate-glow pointer-events-none" />

      <div className="relative bg-[#faf6ec] border border-solid border-[#f0ebe1] p-8 md:p-12 rounded-[32px] w-full max-w-[480px] shine-wrap card-lift">
        <div className="bg-white rounded-2xl p-6 shadow-[0px_8px_30px_rgba(0,0,0,0.08)]">
          <div className="flex justify-between items-center mb-4">
            <span className="bg-[#fff0f0] text-[#7a1f32] text-[10px] font-semibold tracking-[0.1em] uppercase px-3 py-1 rounded-full">
              Printing
            </span>
            <div className="flex items-center gap-1 text-[#7a1f32] text-sm font-semibold animate-soft-pulse">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              27:42
            </div>
          </div>

          <h3 className="font-bold text-xl tracking-tight text-[#161414] mb-2">
            Print CPE Module
          </h3>

          <div className="flex items-center gap-2 mb-5">
            <span className="font-bold text-2xl text-[#c9a227]">₱30</span>
            <span className="font-medium text-sm text-gray-500">
              Cash on Delivery
            </span>
          </div>

          <hr className="border-gray-100 mb-5" />

          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-6">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            CIT-U Library
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 bg-[#fff9ea] border border-solid border-[#f3e5c8] text-[#7a1f32] text-[10px] font-semibold tracking-wide px-3 py-1.5 rounded-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#c9a227">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              CIT-U VERIFIED
            </div>
            <button className="btn-glow bg-[#7a1f32] hover:bg-[#661a2a] text-white text-sm font-semibold px-5 py-2.5 rounded-lg">
              View Quest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
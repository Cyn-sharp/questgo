import { QuestCard } from "./QuestCard";

export const HeroSection = () => {
  return (
    <section className="w-full bg-white px-6 md:px-16 py-16 md:py-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center">
        
        {/* Left Content Area */}
        <div className="flex flex-col items-start gap-6 max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#faf4e6] px-4 py-1.5 rounded-full">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7a1f32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span className="text-[#7a1f32] text-xs font-bold tracking-wide">
              EXCLUSIVE TO VERIFIED CIT-U STUDENTS
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight text-[#161414]">
            <span className="text-[#7a1f32]">Turn Tasks Into </span>
            <br className="hidden md:block" />
            <span className="text-[#c9a227]">Opportunities</span>
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            Need a quick favor? Post a Quest. Want to earn extra cash? Complete one.
            QuestGo connects CIT-U students who need help with everyday tasks with
            verified students who are ready to help.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <a href="#find-quest" className="inline-flex items-center gap-2 bg-[#7a1f32] hover:bg-[#661a2a] text-white px-6 py-3 rounded-xl transition shadow-[0px_8px_18px_#7a1f3226] font-semibold text-[15px]">
              Find a Quest
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </a>
            <a href="#post-quest" className="inline-flex items-center border-[1.5px] border-solid border-[#7a1f32] text-[#7a1f32] px-6 py-3 rounded-xl hover:bg-[#fff0f0] transition font-semibold text-[15px]">
              Post a Quest
            </a>
          </div>
        </div>

        {/* Right Content Area (Card) */}
        <div className="flex justify-center md:justify-end">
          <QuestCard />
        </div>

      </div>
    </section>
  );
};
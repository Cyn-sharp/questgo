import React from "react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  badge: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Charity T. Ricabo",
    role: "BSCPE - 3",
    quote: "Forgot my scientific calculator before my major exam at the ST Building. Posted a quest and someone delivered one to my classroom door in 10 minutes flat! Saved my grade.",
    badge: "Saved My Grade",
    rating: 5,
  },
  {
    id: 2,
    name: "Clark Jaca",
    role: "BSCPE - 4",
    quote: "I earn extra cash between my vacant periods by buying lunches for classmates at the main canteen. It's easily the best and safest side hustle on campus.",
    badge: "Top Runner",
    rating: 5,
  },
  {
    id: 3,
    name: "Shaun Andrew Lastimosa",
    role: "BSCPE - 2",
    quote: "The student-only verification is what sold me. I feel incredibly safe knowing only fellow verified Technologians are accepting my tasks or helping me out.",
    badge: "Verified Safe",
    rating: 5,
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden">
      {/* Decorative ambient background glows to layer over body background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7a1f32]/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#c9a227]/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-16 relative z-10">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 bg-[#f6ecc8] border border-[#c9a227]/30 px-4.5 py-1.5 rounded-full mb-5 animate-soft-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7a1f32]" />
            <span className="font-outfit font-extrabold text-[11px] tracking-[0.12em] uppercase text-[#7a1f32]">
              Wildcat Wall of Fame
            </span>
          </div>
          
          <h2 className="font-outfit font-extrabold text-4xl sm:text-5xl text-[#fbf8f0] leading-tight tracking-tight">
            Loved by CIT-U <span className="text-[#c9a227]">Students</span>
          </h2>
          <p className="mt-4 font-sans font-normal text-base md:text-lg text-[#d8d3cc] leading-relaxed">
            See how fellow Technologians are reclaiming their schedules, helping peers, and earning extra income right on campus.
          </p>
        </div>

        {/* 3-Column Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {testimonials.map((test) => (
            <div 
              key={test.id} 
              className="card-interactive card-surface shine-wrap flex flex-col justify-between p-7 sm:p-8 relative overflow-hidden group rounded-2xl bg-white/95 backdrop-blur-md"
            >
              {/* Semi-transparent absolute blockquote background icon */}
              <span className="absolute right-6 top-4 font-outfit text-8xl text-[#c9a227]/10 pointer-events-none select-none font-black leading-none">
                “
              </span>

              <div className="relative z-10">
                {/* Header Rating and Tag */}
                <div className="flex items-center justify-between gap-3 mb-6">
                  <span className="badge-gold">
                    ✨ {test.badge}
                  </span>
                  
                  {/* Rating Stars */}
                  <div className="flex gap-0.5">
                    {[...Array(test.rating)].map((_, i) => (
                      <svg
                        key={i}
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="var(--color-gold)"
                        stroke="var(--color-gold)"
                        strokeWidth="1"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>

                {/* Testimonial Quote */}
                <p className="font-sans font-normal text-[14px] sm:text-[15px] leading-relaxed text-[#4a4340] italic relative z-10">
                  "{test.quote}"
                </p>
              </div>

              {/* Profile Footer with Default Avatar */}
              <div className="flex items-center gap-4 mt-8 pt-5 border-t border-[#e5e0d8] relative z-10">
                {/* Custom Default Avatar Element */}
                <div className="relative shrink-0">
                  {/* Dynamic border highlighting on hover */}
                  <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#c9a227] to-[#7a1f32] rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-11 h-11 rounded-full bg-[#f6ecc8] border-2 border-white flex items-center justify-center relative z-10 overflow-hidden shadow-sm">
                    {/* Minimalist modern profile icon */}
                    <svg
                      className="w-6 h-6 text-[#7a1f32]/85"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  </div>
                </div>
                
                <div className="text-left">
                  <h4 className="font-outfit font-extrabold text-[15px] text-[#161414] tracking-tight group-hover:text-[#7a1f32] transition-colors duration-300">
                    {test.name}
                  </h4>
                  <p className="font-sans font-semibold text-[11px] text-[#8a6a1f] tracking-wide mt-0.5 uppercase">
                    {test.role}
                  </p>
                </div>
              </div>

              {/* Sub-pixel glass highlighting boundary */}
              <div className="absolute inset-0 border border-white/40 rounded-2xl pointer-events-none" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
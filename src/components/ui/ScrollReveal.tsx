"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "fade-up" | "scale";
};

export function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  variant = "fade-up",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el); // animate once
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${variant === "scale" ? "reveal-scale" : "reveal"} ${className}`}
      style={{ ["--reveal-delay" as string]: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
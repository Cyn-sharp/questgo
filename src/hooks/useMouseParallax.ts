"use client";

import { useRef, useState } from "react";

/**
 * Tracks the pointer's position relative to a section, normalized to
 * (-intensity..intensity) on each axis, throttled to one state update per animation
 * frame.
 *
 * Usage:
 *   // Default magnitude (intensity = 1)
 *   const { ref, x, y, onMouseMove, onMouseLeave } = useMouseParallax<HTMLElement>();
 *
 *   // 2x or 3x stronger magnitude:
 *   const { ref, x, y, onMouseMove, onMouseLeave } = useMouseParallax<HTMLElement>(2.5);
 */
export function useMouseParallax<T extends HTMLElement = HTMLElement>(
  intensity: number = 1.5 // Change this default or pass any number when calling the hook
) {
  const ref = useRef<T>(null);
  const target = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const flush = () => {
    setPos({ ...target.current });
    rafId.current = null;
  };

  const onMouseMove = (e: React.MouseEvent<T>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Normalized to -1..1 then multiplied by intensity
    const rawX = (((e.clientX - rect.left) / rect.width) * 2 - 1) * intensity;
    const rawY = (((e.clientY - rect.top) / rect.height) * 2 - 1) * intensity;

    target.current = {
      x: Math.max(-intensity, Math.min(intensity, rawX)),
      y: Math.max(-intensity, Math.min(intensity, rawY)),
    };
    if (rafId.current == null) rafId.current = requestAnimationFrame(flush);
  };

  const onMouseLeave = () => {
    target.current = { x: 0, y: 0 };
    if (rafId.current == null) rafId.current = requestAnimationFrame(flush);
  };

  return { ref, x: pos.x, y: pos.y, onMouseMove, onMouseLeave };
}
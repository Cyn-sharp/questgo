"use client";

import { useEffect, useState } from "react";

// How long every skeleton stays on screen, at minimum, in milliseconds.
// 2500 = 2.5 seconds. Change this one number to make it shorter or longer.
export const SKELETON_MIN_MS = 2500;

// Keeps a loading state "on" for at least SKELETON_MIN_MS after the page opens,
// so the skeleton is always visible, even when the data arrives sooner.
// If the data takes longer, the skeleton simply stays until the data is ready.
export function useMinimumLoading(isLoading: boolean, minMs: number = SKELETON_MIN_MS): boolean {
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinTimePassed(true), minMs);
    return () => window.clearTimeout(timer);
  }, [minMs]);

  return isLoading || !minTimePassed;
}
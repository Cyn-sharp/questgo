"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { DEFAULT_DOCK, DOCK_SIZE, clampWhileDragging, dockFromRelease, parseDock, pointFromDock, type Dock } from "@/lib/onboarding/dock";

const STORAGE_KEY = "questgo:guide-dock";
const MOVE_THRESHOLD = 6; // px of movement before a press counts as a drag, not a tap
const SAMPLE_WINDOW_MS = 100;

type Drag = { id: number; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean; samples: { x: number; t: number }[] };

// Makes a fixed button draggable like a Messenger chat head: it follows the pointer,
// then glides to the nearest screen edge and remembers where it was left.
export function useDockDrag() {
  const [dock, setDock] = useState<Dock>(DEFAULT_DOCK);
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
  const [live, setLive] = useState<{ left: number; top: number } | null>(null);
  const drag = useRef<Drag | null>(null);
  const ignoreClick = useRef(false);

  useEffect(() => {
    const read = () => setViewport({ width: document.documentElement.clientWidth || window.innerWidth, height: window.innerHeight });
    const frame = window.requestAnimationFrame(() => {
      read();
      try {
        const saved = parseDock(window.localStorage.getItem(STORAGE_KEY));
        if (saved) setDock(saved);
      } catch {
        /* storage blocked: start from the default spot */
      }
    });
    window.addEventListener("resize", read);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", read);
    };
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, moved: false, samples: [{ x: event.clientX, t: performance.now() }] };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId || !viewport) return;
    if (!current.moved && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < MOVE_THRESHOLD) return;
    current.moved = true;
    const now = performance.now();
    current.samples = [...current.samples.filter((sample) => now - sample.t < SAMPLE_WINDOW_MS), { x: event.clientX, t: now }];
    setLive(clampWhileDragging(event.clientX - current.offsetX, event.clientY - current.offsetY, viewport));
  }, [viewport]);

  const finish = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!current.moved || !viewport || !live) return;
    // The click that follows a drag must not open the tour.
    ignoreClick.current = true;
    window.setTimeout(() => { ignoreClick.current = false; }, 80);
    const first = current.samples[0];
    const last = current.samples[current.samples.length - 1];
    const velocityX = last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0;
    const next = dockFromRelease(live.left + DOCK_SIZE / 2, live.top, velocityX, viewport);
    setDock(next);
    setLive(null);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked: it just won't be remembered */
    }
  }, [viewport, live]);

  const onClickCapture = useCallback((event: React.MouseEvent) => {
    if (!ignoreClick.current) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const position = live ?? (viewport ? pointFromDock(dock, viewport) : null);
  const dragging = live !== null;
  const style: CSSProperties = {
    ...(position ? { left: position.left, top: position.top } : {}),
    touchAction: "none",
    userSelect: "none",
    cursor: dragging ? "grabbing" : "grab",
    transition: dragging ? "none" : "left 320ms cubic-bezier(0.22, 1.25, 0.36, 1), top 320ms cubic-bezier(0.22, 1.25, 0.36, 1), transform 150ms ease",
    ...(dragging ? { transform: "scale(1.1)" } : {}),
  };

  return { style, placed: position !== null, dragging, handlers: { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish, onClickCapture } };
}

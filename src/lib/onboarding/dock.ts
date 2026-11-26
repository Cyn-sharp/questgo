// Kit's round button works like a chat head: drag it anywhere, let go, and it
// glides to the nearest screen edge. Plain math (no React, no browser) so the
// unit tests can check the snapping on phone and computer screen sizes.

export type Side = "left" | "right";
/** Where Kit rests: which edge, and how far down the allowed range (0 = top, 1 = bottom). */
export type Dock = { side: Side; ratio: number };

export const DOCK_SIZE = 56;
export const DOCK_EDGE = 16; // gap between the button and the screen edge
const TOP_SAFE = 76; // stay below the top bar
const BOTTOM_SAFE_PHONE = 112; // stay above the bottom navigation
const BOTTOM_SAFE_WIDE = 24; // wide screens have no bottom navigation
const WIDE = 768;
const FLICK_MS = 160; // how far ahead a flick carries the button

export const DEFAULT_DOCK: Dock = { side: "left", ratio: 1 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Highest and lowest `top` Kit may rest at on this screen. */
export function restRange(viewport: { width: number; height: number }) {
  const min = TOP_SAFE;
  const bottom = viewport.width >= WIDE ? BOTTOM_SAFE_WIDE : BOTTOM_SAFE_PHONE;
  return { min, max: Math.max(min, viewport.height - bottom - DOCK_SIZE) };
}

/**
 * Where to rest after a drag ends. `centerX`/`top` are where the button was let go;
 * `velocityX` (px per ms) lets a quick flick carry it to the far side.
 */
export function dockFromRelease(centerX: number, top: number, velocityX: number, viewport: { width: number; height: number }): Dock {
  const projected = centerX + (Number.isFinite(velocityX) ? velocityX : 0) * FLICK_MS;
  const { min, max } = restRange(viewport);
  const ratio = max === min ? 1 : clamp((top - min) / (max - min), 0, 1);
  return { side: projected < viewport.width / 2 ? "left" : "right", ratio };
}

/** The button's `left`/`top` for a resting position on this screen. */
export function pointFromDock(dock: Dock, viewport: { width: number; height: number }) {
  const { min, max } = restRange(viewport);
  return {
    left: dock.side === "left" ? DOCK_EDGE : Math.max(DOCK_EDGE, viewport.width - DOCK_SIZE - DOCK_EDGE),
    top: Math.round(min + clamp(dock.ratio, 0, 1) * (max - min)),
  };
}

/** Keeps the button on screen while it is being dragged. */
export function clampWhileDragging(left: number, top: number, viewport: { width: number; height: number }) {
  return {
    left: clamp(left, 0, Math.max(0, viewport.width - DOCK_SIZE)),
    top: clamp(top, 0, Math.max(0, viewport.height - DOCK_SIZE)),
  };
}

/** Reads a saved position back, ignoring anything that isn't a valid one. */
export function parseDock(raw: string | null): Dock | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Dock>;
    if ((value.side !== "left" && value.side !== "right") || typeof value.ratio !== "number" || !Number.isFinite(value.ratio)) return null;
    return { side: value.side, ratio: clamp(value.ratio, 0, 1) };
  } catch {
    return null;
  }
}

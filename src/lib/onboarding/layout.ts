// S3-11: where the tour puts the gold ring, the arrow, Kit and his speech
// bubble for one step. Plain math (no React, no browser), so the unit tests
// can check it on phone and computer screen sizes.

export type Box = { top: number; left: number; width: number; height: number };

export type TourLayout = {
  /** Gold ring around the highlighted button. null = no button (whole screen dimmed). */
  ring: Box | null;
  /** Bouncing arrow right next to the ring, pointing at the button. */
  arrow: { left: number; top: number; points: "up" | "down" } | null;
  /** Where Kit stands, beside the arrow. null = screen too short, so the bubble points by itself. */
  kit: (Box & { flip: boolean }) | null;
  /**
   * Kit's speech bubble. `y` is the edge closest to Kit: the bubble's bottom
   * when it grows up (above Kit), or its top when it grows down (below Kit).
   * `tailX` is where its little tail sits, measured from the bubble's left edge.
   */
  bubble: { left: number; y: number; width: number; grows: "up" | "down"; tailX: number };
};

/** Width ÷ height of the pose pictures in public/mascot (364 × 510). */
export const KIT_RATIO = 364 / 510;
export const ARROW_SIZE = { width: 34, height: 38 };
const RING_PAD = 6; // space between the button and the ring
const GAP = 4; // space between the ring and the arrow / Kit
const EDGE = 12; // keep the bubble this far from the screen edges
const BUBBLE_MAX_WIDTH = 340;
const BUBBLE_ROOM = 200; // about how tall the bubble gets

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));
const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));

/**
 * `avoid` = other buttons Kit shouldn't stand in front of (Messages, his own
 * replay button, ...). He picks the side of the arrow that covers them least.
 */
export function tourLayout(target: Box | null, screen: { width: number; height: number }, avoid: Box[] = []): TourLayout {
  const kitHeight = screen.width >= 768 ? 128 : 112;
  const kitWidth = Math.round(kitHeight * KIT_RATIO);
  const bubbleWidth = Math.min(BUBBLE_MAX_WIDTH, screen.width - EDGE * 2);
  const bubbleAt = (centerX: number) => Math.round(clamp(centerX - bubbleWidth / 2, EDGE, screen.width - EDGE - bubbleWidth));
  const tailAt = (x: number, bubbleLeft: number) => Math.round(clamp(x - bubbleLeft, 24, bubbleWidth - 24));

  // No button to show (first and last step): Kit in the middle, his bubble above him.
  if (!target) {
    const centerX = screen.width / 2;
    const top = Math.round(clamp(screen.height / 2, BUBBLE_ROOM, screen.height - kitHeight - 16));
    const left = bubbleAt(centerX);
    return {
      ring: null,
      arrow: null,
      kit: { left: Math.round(centerX - kitWidth / 2), top, width: kitWidth, height: kitHeight, flip: false },
      bubble: { left, y: top - 8, width: bubbleWidth, grows: "up", tailX: tailAt(centerX, left) },
    };
  }

  const ring = {
    top: target.top - RING_PAD,
    left: target.left - RING_PAD,
    width: target.width + RING_PAD * 2,
    height: target.height + RING_PAD * 2,
  };
  const ringBottom = ring.top + ring.height;
  const centerX = ring.left + ring.width / 2;
  // Button in the top half (the computer header): everything goes under it.
  // Otherwise (the phone bottom bar, Messages): everything goes above it.
  const below = ring.top + ring.height / 2 < screen.height / 2;
  const arrowTop = Math.round(below ? ringBottom + GAP : ring.top - GAP - ARROW_SIZE.height);
  const arrow = { left: Math.round(centerX - ARROW_SIZE.width / 2), top: arrowTop, points: below ? "up" : "down" } as const;

  // Kit stands right beside the arrow. He tries the side toward the middle of
  // the screen first, and switches sides if that covers another button.
  const kitTop = Math.round(below ? ringBottom + GAP : ring.top - GAP - kitHeight);
  const preferLeft = centerX > screen.width / 2;
  const sides = [preferLeft, !preferLeft].map((onLeft) => {
    const left = Math.round(
      clamp(onLeft ? arrow.left - 6 - kitWidth : arrow.left + ARROW_SIZE.width + 6, 8, screen.width - 8 - kitWidth),
    );
    const box = { top: kitTop, left, width: kitWidth, height: kitHeight };
    const besideArrow = left + kitWidth <= arrow.left || left >= arrow.left + ARROW_SIZE.width;
    return { onLeft, left, besideArrow, covered: avoid.reduce((sum, other) => sum + overlap(box, other), 0) };
  });
  const usable = sides.filter((side) => side.besideArrow);
  const chosen = (usable.length ? usable : sides).reduce((best, side) => (side.covered < best.covered ? side : best));
  const kitOnLeft = chosen.onLeft;
  const kitLeft = chosen.left;
  const fits = below ? screen.height - (kitTop + kitHeight) >= BUBBLE_ROOM : kitTop >= BUBBLE_ROOM;

  if (!fits) {
    // Short screen (like a phone turned sideways): leave Kit out, the bubble sits on the arrow.
    const left = bubbleAt(centerX);
    const y = below ? arrowTop + ARROW_SIZE.height + 6 : arrowTop - 6;
    return { ring, arrow, kit: null, bubble: { left, y, width: bubbleWidth, grows: below ? "down" : "up", tailX: tailAt(centerX, left) } };
  }

  const kitCenter = kitLeft + kitWidth / 2;
  const left = bubbleAt(kitCenter);
  return {
    ring,
    arrow,
    // The pointing pose points to the right, so Kit is mirrored when he stands
    // on the right of the arrow. That way he always faces the button.
    kit: { left: kitLeft, top: kitTop, width: kitWidth, height: kitHeight, flip: !kitOnLeft },
    bubble: {
      left,
      y: below ? kitTop + kitHeight + 8 : kitTop - 8,
      width: bubbleWidth,
      grows: below ? "down" : "up",
      tailX: tailAt(kitCenter, left),
    },
  };
}
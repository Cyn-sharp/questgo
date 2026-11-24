// S3-11: the steps of the onboarding tour. Kept free of React and Firebase so
// the unit tests can import this file directly.

export type TourStep = {
  id: string;
  title: string;
  text: string;
  /** Kit's pose for this step (a file in public/mascot). */
  pose: string;
  /** The button to highlight. Leave it out for no highlight. */
  target?: string;
};

export const GUIDE_NAME = "Kit";
export const GUIDE_FACE = "/mascot/guide-face.png";
/** The tour starts by itself on this page only. */
export const TOUR_HOME = "/dashboard";
/** Raise this number when the steps change a lot, so everyone sees the new tour once. */
export const TOUR_VERSION = 1;

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: `Hi, I'm ${GUIDE_NAME}!`,
    text: "I'm your QuestGo guide. Let me show you around. It only takes a minute.",
    pose: "/mascot/pose-wave.png",
  },
  {
    id: "post",
    title: "Post a Quest",
    text: "Need something done on campus? Tap Post. Say what you need, where to meet, and your reward.",
    pose: "/mascot/pose-point.png",
    target: 'nav a[href="/post-quest"]',
  },
  {
    id: "find",
    title: "Find a Quest",
    text: "Want to help and earn? Tap Find to see open quests, then accept one.",
    pose: "/mascot/pose-think.png",
    target: 'nav a[href="/quests"]',
  },
  {
    id: "my-quests",
    title: "My Quests",
    text: "Track everything here: the quests you posted and the quests you're running.",
    pose: "/mascot/pose-thumbs-up.png",
    target: 'nav a[href="/requests"]',
  },
  {
    id: "messages",
    title: "Messages",
    text: "Chat with your runner or requester here. A red badge means you have unread messages.",
    pose: "/mascot/pose-tip.png",
    target: 'button[aria-label^="Messages"]',
  },
  {
    id: "profile",
    title: "Profile",
    text: "Update your details, and open the Message Archive to see your past quests.",
    pose: "/mascot/pose-excited.png",
    target: 'nav a[href="/profile"]',
  },
  {
    id: "safety",
    title: "Stay safe, and you're set!",
    text: "Meet in busy campus spots. If something feels wrong, report or block the user. Tap me anytime to replay this tour.",
    pose: "/mascot/pose-cheer.png",
  },
];

export const LAST_STEP = TOUR_STEPS.length - 1;

/** Keeps a step number inside the tour. */
export function clampStep(step: number): number {
  return Math.min(Math.max(step, 0), LAST_STEP);
}

/** Browser storage key: one "seen" flag per account. */
export function tourStorageKey(uid: string): string {
  return `questgo:tour:v${TOUR_VERSION}:${uid}`;
}

/** Start by itself only on Home, and only if this account hasn't finished or skipped it. */
export function shouldAutoStart(pathname: string | null, seen: boolean): boolean {
  return pathname === TOUR_HOME && !seen;
}
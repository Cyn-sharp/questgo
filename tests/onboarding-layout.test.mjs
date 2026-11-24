import assert from "node:assert/strict";
import test from "node:test";
import { ARROW_SIZE, tourLayout } from "../src/lib/onboarding/layout.ts";

const PHONE = { width: 390, height: 844 };
const SMALL_PHONE = { width: 320, height: 568 };
const COMPUTER = { width: 1280, height: 800 };
const SIDEWAYS_PHONE = { width: 667, height: 375 };

// Where the tour's buttons roughly are on each screen.
const PHONE_BUTTONS = {
  home: { top: 780, left: 8, width: 72, height: 56 },
  find: { top: 780, left: 80, width: 72, height: 56 },
  post: { top: 744, left: 167, width: 56, height: 72 }, // the raised middle button
  myQuests: { top: 780, left: 238, width: 72, height: 56 },
  profile: { top: 780, left: 310, width: 72, height: 56 },
  messages: { top: 684, left: 236, width: 138, height: 48 },
};
const SMALL_PHONE_BUTTONS = {
  find: { top: 504, left: 66, width: 58, height: 56 },
  post: { top: 470, left: 137, width: 46, height: 72 },
  profile: { top: 504, left: 255, width: 58, height: 56 },
  messages: { top: 408, left: 176, width: 128, height: 48 },
};
const COMPUTER_BUTTONS = {
  find: { top: 18, left: 470, width: 110, height: 36 },
  post: { top: 18, left: 590, width: 120, height: 36 },
  myQuests: { top: 18, left: 720, width: 110, height: 36 },
  profile: { top: 18, left: 840, width: 90, height: 36 },
  messages: { top: 728, left: 1124, width: 140, height: 48 },
};
const CASES = [
  ...Object.entries(PHONE_BUTTONS).map(([name, button]) => ["phone", PHONE, name, button]),
  ...Object.entries(SMALL_PHONE_BUTTONS).map(([name, button]) => ["small phone", SMALL_PHONE, name, button]),
  ...Object.entries(COMPUTER_BUTTONS).map(([name, button]) => ["computer", COMPUTER, name, button]),
];

const right = (box) => box.left + box.width;
const bottom = (box) => box.top + box.height;
const middle = (box) => box.left + box.width / 2;

test("the arrow sits right on the highlighted button and points at it", () => {
  for (const [screenName, screen, name, button] of CASES) {
    const { ring, arrow } = tourLayout(button, screen);
    const label = `${screenName} / ${name}`;
    assert.ok(Math.abs(arrow.left + ARROW_SIZE.width / 2 - middle(ring)) <= 1, `${label}: arrow is centred on the button`);
    if (arrow.points === "down") assert.ok(arrow.top + ARROW_SIZE.height <= ring.top && ring.top - (arrow.top + ARROW_SIZE.height) <= 6, `${label}: arrow just above the button`);
    else assert.ok(arrow.top >= bottom(ring) && arrow.top - bottom(ring) <= 6, `${label}: arrow just below the button`);
    assert.equal(arrow.points, screenName === "computer" && name !== "messages" ? "up" : "down", `${label}: arrow points the right way`);
  }
});

test("Kit stands next to the arrow, facing it, and stays on the screen", () => {
  for (const [screenName, screen, name, button] of CASES) {
    const { ring, arrow, kit } = tourLayout(button, screen);
    const label = `${screenName} / ${name}`;
    assert.ok(kit, `${label}: Kit is shown`);
    const arrowBox = { ...arrow, ...ARROW_SIZE };
    assert.ok(right(kit) <= arrowBox.left || kit.left >= right(arrowBox), `${label}: Kit is beside the arrow, not on it`);
    assert.ok(kit.left >= 0 && right(kit) <= screen.width && kit.top >= 0 && bottom(kit) <= screen.height, `${label}: Kit is fully on screen`);
    assert.ok(bottom(kit) <= ring.top || kit.top >= bottom(ring), `${label}: Kit doesn't cover the button`);
    assert.equal(kit.flip, middle(kit) > middle(arrowBox), `${label}: Kit faces the arrow`);
  }
});

test("Kit's speech bubble stays on screen, never covers the button, and its tail points at Kit", () => {
  for (const [screenName, screen, name, button] of CASES) {
    const { ring, kit, bubble } = tourLayout(button, screen);
    const label = `${screenName} / ${name}`;
    assert.ok(bubble.left >= 12 && bubble.left + bubble.width <= screen.width - 12, `${label}: bubble inside the screen`);
    if (bubble.grows === "up") assert.ok(bubble.y <= kit.top && bubble.y >= 200, `${label}: bubble above Kit with room to grow`);
    else assert.ok(bubble.y >= bottom(kit) && bubble.y > bottom(ring), `${label}: bubble below Kit`);
    const tail = bubble.left + bubble.tailX;
    assert.ok(tail >= kit.left && tail <= right(kit), `${label}: bubble tail points at Kit`);
  }
});

test("steps without a button: Kit and his bubble in the middle, no arrow", () => {
  for (const screen of [PHONE, SMALL_PHONE, COMPUTER]) {
    const { ring, arrow, kit, bubble } = tourLayout(null, screen);
    assert.equal(ring, null);
    assert.equal(arrow, null);
    assert.ok(Math.abs(middle(kit) - screen.width / 2) <= 1, "Kit is centred");
    assert.equal(bubble.grows, "up");
    assert.ok(bubble.y <= kit.top && bubble.left >= 12 && bubble.left + bubble.width <= screen.width - 12);
  }
});

test("short screens: Kit steps aside and the bubble sits right on the arrow", () => {
  const button = { top: 311, left: 300, width: 66, height: 56 }; // bottom bar on a phone turned sideways
  const { ring, arrow, kit, bubble } = tourLayout(button, SIDEWAYS_PHONE);
  assert.equal(kit, null);
  assert.equal(bubble.grows, "up");
  assert.equal(bubble.y, arrow.top - 6);
  assert.ok(Math.abs(bubble.left + bubble.tailX - middle(ring)) <= 1, "bubble tail points at the button");
});

test("Kit switches sides of the arrow to keep other buttons clear", () => {
  const replay = { top: 676, left: 16, width: 56, height: 56 }; // Kit's round replay button
  const others = (except) => [PHONE_BUTTONS.messages, PHONE_BUTTONS.post, replay].filter((box) => box !== except);
  const covered = (kit, box) =>
    Math.max(0, Math.min(right(kit), right(box)) - Math.max(kit.left, box.left)) *
    Math.max(0, Math.min(bottom(kit), bottom(box)) - Math.max(kit.top, box.top));
  // Post: Kit stands on the left (not on Messages) and points right, at the arrow.
  const atPost = tourLayout(PHONE_BUTTONS.post, PHONE, others(PHONE_BUTTONS.post)).kit;
  assert.equal(covered(atPost, PHONE_BUTTONS.messages) + covered(atPost, replay), 0, "Post: no other button covered");
  assert.equal(atPost.flip, false, "Post: Kit on the left of the arrow, facing it");
  // Find: standing on the left would cover the replay button, so Kit stands on the right.
  const atFind = tourLayout(PHONE_BUTTONS.find, PHONE, others()).kit;
  assert.equal(covered(atFind, replay), 0, "Find: replay button not covered");
  // My Quests: the right side would cover Messages, so Kit stands on the left.
  const atMyQuests = tourLayout(PHONE_BUTTONS.myQuests, PHONE, others()).kit;
  const arrow = tourLayout(PHONE_BUTTONS.myQuests, PHONE, others()).arrow;
  assert.ok(right(atMyQuests) <= arrow.left, "My Quests: Kit on the left of the arrow");
});
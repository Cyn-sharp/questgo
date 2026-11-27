import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_DOCK, DOCK_EDGE, DOCK_SIZE, clampWhileDragging, dockFromRelease, parseDock, pointFromDock, restRange } from "../src/lib/onboarding/dock.ts";

const PHONE = { width: 390, height: 844 };
const COMPUTER = { width: 1280, height: 800 };
const TINY = { width: 320, height: 120 };

test("letting go on the left half snaps to the left edge, right half to the right edge", () => {
  assert.equal(dockFromRelease(100, 400, 0, PHONE).side, "left");
  assert.equal(dockFromRelease(300, 400, 0, PHONE).side, "right");
  assert.equal(dockFromRelease(100, 400, 0, COMPUTER).side, "left");
  assert.equal(dockFromRelease(900, 400, 0, COMPUTER).side, "right");
});

test("a quick flick carries the button to the far side", () => {
  assert.equal(dockFromRelease(150, 400, 2, PHONE).side, "right"); // flicked right from the left half
  assert.equal(dockFromRelease(250, 400, -2, PHONE).side, "left");
  assert.equal(dockFromRelease(150, 400, 0.1, PHONE).side, "left"); // a slow drift does not
  assert.equal(dockFromRelease(150, 400, Number.NaN, PHONE).side, "left");
});

test("the resting height stays between the top bar and the bottom navigation", () => {
  const { min, max } = restRange(PHONE);
  assert.equal(dockFromRelease(100, -500, 0, PHONE).ratio, 0);
  assert.equal(dockFromRelease(100, 5000, 0, PHONE).ratio, 1);
  assert.equal(pointFromDock({ side: "left", ratio: 0 }, PHONE).top, min);
  assert.equal(pointFromDock({ side: "left", ratio: 1 }, PHONE).top, max);
  assert.ok(max + DOCK_SIZE <= PHONE.height - 112 + 0.001, "clears the bottom navigation on a phone");
  assert.ok(restRange(COMPUTER).max > restRange({ width: 1280, height: 800 }).min);
});

test("it sits at the edge it docked to", () => {
  assert.equal(pointFromDock({ side: "left", ratio: 0.5 }, PHONE).left, DOCK_EDGE);
  assert.equal(pointFromDock({ side: "right", ratio: 0.5 }, PHONE).left, PHONE.width - DOCK_SIZE - DOCK_EDGE);
});

test("a saved position survives a different screen size", () => {
  const dock = dockFromRelease(300, 400, 0, PHONE);
  const onComputer = pointFromDock(dock, COMPUTER);
  assert.equal(onComputer.left, COMPUTER.width - DOCK_SIZE - DOCK_EDGE);
  assert.ok(onComputer.top >= restRange(COMPUTER).min && onComputer.top <= restRange(COMPUTER).max);
});

test("a screen too short to move in never produces NaN", () => {
  const dock = dockFromRelease(100, 50, 0, TINY);
  assert.ok(Number.isFinite(dock.ratio));
  const point = pointFromDock(dock, TINY);
  assert.ok(Number.isFinite(point.top) && point.top >= 0);
});

test("dragging keeps the button on screen", () => {
  assert.deepEqual(clampWhileDragging(-40, -40, PHONE), { left: 0, top: 0 });
  assert.deepEqual(clampWhileDragging(9999, 9999, PHONE), { left: PHONE.width - DOCK_SIZE, top: PHONE.height - DOCK_SIZE });
});

test("only a valid saved position is accepted", () => {
  assert.deepEqual(parseDock(JSON.stringify({ side: "right", ratio: 0.25 })), { side: "right", ratio: 0.25 });
  assert.deepEqual(parseDock(JSON.stringify({ side: "left", ratio: 7 })), { side: "left", ratio: 1 });
  for (const bad of [null, "", "nope", "{}", JSON.stringify({ side: "top", ratio: 0.5 }), JSON.stringify({ side: "left", ratio: "x" }), JSON.stringify({ side: "left" })]) assert.equal(parseDock(bad), null);
  assert.deepEqual(DEFAULT_DOCK, { side: "left", ratio: 1 });
});

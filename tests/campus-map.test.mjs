import assert from "node:assert/strict";
import test from "node:test";
import { BUILDINGS, OUTLINE, centroid, distanceFromCampus, insidePolygon, isOnCampus, matchBuildings, nearestBuilding, toMapPoint } from "../src/lib/campus/map.ts";
import { canShareLocation, validateLocation } from "../src/lib/quests/tracking.ts";

test("GPS points project onto the campus outline", () => {
  // OpenStreetMap's campus centre and the Wikipedia coordinates are both on campus.
  assert.equal(isOnCampus(10.2957503, 123.8803769), true);
  assert.equal(isOnCampus(10.29568, 123.88022), true);
  // A nearby school on the same avenue (~1.1 km east) is not.
  assert.equal(isOnCampus(10.29788, 123.89057), false);
  assert.ok(distanceFromCampus(10.29788, 123.89057) > 900);
  const [x, y] = toMapPoint(10.2978, 123.879);
  assert.ok(Math.abs(x) < 1e-6 && Math.abs(y) < 1e-6);
});

test("every sketched building sits inside the campus outline", () => {
  for (const building of BUILDINGS) {
    if (building.kind === "gate") continue;
    assert.ok(insidePolygon(centroid(building.points), OUTLINE), building.id);
  }
});

test("quest location text highlights the right buildings", () => {
  assert.deepEqual(matchBuildings("RTL lobby", "near the library"), ["lrac", "rtl"]);
  assert.deepEqual(matchBuildings("Main gate, Bacalso side"), ["main-gate"]);
  assert.deepEqual(matchBuildings("Canteen"), []);
  assert.deepEqual(matchBuildings("G-Smart room 2"), ["gsmart"]);
  assert.deepEqual(matchBuildings("NGE lobby"), ["nge"]);
  // Short aliases must not match inside other words ("legal" contains "gle").
  assert.deepEqual(matchBuildings("legal office"), []);
});

test("the nearest building is reported for on-campus points", () => {
  const [cx, cy] = centroid(BUILDINGS.find((b) => b.id === "lrac").points);
  const lat = 10.2978 - cy / 110574, lng = 123.879 + cx / (111320 * Math.cos((10.2978 * Math.PI) / 180));
  assert.equal(nearestBuilding(lat, lng).building.id, "lrac");
});

test("only the runner shares location, and only while the quest is underway", () => {
  assert.equal(canShareLocation({ status: "in_progress", questRunnerId: "runner" }, "runner"), true);
  assert.equal(canShareLocation({ status: "accepted", questRunnerId: "runner" }, "requester"), false);
  assert.equal(canShareLocation({ status: "completed", questRunnerId: "runner" }, "runner"), false);
  assert.deepEqual(validateLocation({ lat: 10.2957503, lng: 123.8803769, accuracy: 12.4 }), { lat: 10.29575, lng: 123.88038, accuracy: 12 });
  assert.throws(() => validateLocation({ lat: 91, lng: 0 }));
  assert.throws(() => validateLocation({ lat: "10", lng: 123 }));
  assert.throws(() => validateLocation({ lat: Number.NaN, lng: 123 }));
});

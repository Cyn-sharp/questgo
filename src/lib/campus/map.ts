// A rough, hand-drawn sketch of the CIT-U main campus (N. Bacalso Ave, Cebu City).
//
// Map units are meters on a local flat grid: x grows east, y grows south, and
// (0, 0) is ORIGIN below. At campus scale (~400 m) the flat-earth error is
// negligible, so GPS positions land correctly relative to the OUTLINE.
//
// OUTLINE is the real campus boundary from OpenStreetMap (way 155643436,
// © OpenStreetMap contributors, ODbL). BUILDINGS are approximate, placed from
// the official vicinity map and building locator; adjust their points here if
// a marker looks off when standing at a known building. Shapes and names follow
// the official CIT-U "Building Locator" poster.

export const ORIGIN = { lat: 10.2978, lng: 123.879 };
const METERS_PER_DEG_LAT = 110574;
const METERS_PER_DEG_LNG = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180);

export const VIEWBOX = { width: 320, height: 460 };

export type Point = [number, number];

export function toMapPoint(lat: number, lng: number): Point {
  return [(lng - ORIGIN.lng) * METERS_PER_DEG_LNG, (ORIGIN.lat - lat) * METERS_PER_DEG_LAT];
}

export const OUTLINE: Point[] = [
  [30, 155], [32, 166], [38, 206], [39, 219], [54, 256], [64, 280], [74, 308], [75, 313], [82, 337], [103, 401],
  [117, 398], [138, 394], [150, 392], [188, 385], [208, 380], [210, 380], [219, 411], [220, 414], [223, 420],
  [247, 403], [265, 391], [268, 389], [276, 383], [275, 382], [235, 314], [245, 307], [239, 242], [285, 252],
  [290, 252], [290, 234], [211, 215], [211, 197], [208, 143], [199, 142], [153, 136], [134, 134], [130, 134],
  [129, 29], [121, 29], [119, 28], [114, 26], [114, 34], [114, 94], [115, 135], [98, 135], [79, 135], [67, 137], [33, 140],
];

export type Building = {
  id: string;
  label: string;
  name: string;
  points: Point[];
  // Lowercase words that identify this place in a quest's location text.
  aliases: string[];
  kind?: "building" | "open" | "gate";
  // Rotates the label to run along a slanted building.
  labelAngle?: number;
  // An open inner courtyard (drawn as ground); the building still covers `points` for lookups.
  courtyard?: Point[];
};

const rect = (x: number, y: number, w: number, h: number): Point[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

export const BUILDINGS: Building[] = [
  { id: "gym", label: "GYM", name: "Gymnasium", points: rect(42, 145, 44, 28), aliases: ["gym", "gymnasium"] },
  { id: "elem", label: "ELEM", name: "Elementary Building", points: [[132, 140], [205, 145], [205, 156], [132, 151]], aliases: ["elem", "elementary"] },
  { id: "allied", label: "ALLIED", name: "Allied Engineering Building", points: [[40, 178], [53, 176], [110, 380], [97, 384]], aliases: ["allied", "mechanical", "citmechanical"], labelAngle: 74 },
  { id: "sal", label: "SAL", name: "Don Simplicio A. Lizares Building", points: rect(66, 182, 11, 46), aliases: ["sal", "simplicio"] },
  { id: "link", label: "LINK", name: "Link Building", points: [[80, 234], [91, 234], [105, 292], [94, 292]], aliases: ["link"], labelAngle: 76 },
  { id: "pe", label: "P.E. AREA", name: "P.E. Area", points: rect(120, 172, 52, 50), aliases: ["p.e", "pe area", "p.e. area", "field", "court"], kind: "open" },
  { id: "glec", label: "G-LECROOM", name: "G-Lecture Rooms", points: rect(112, 228, 28, 17), aliases: ["g-lecroom", "lecroom", "lecture room"] },
  { id: "gsmart", label: "G-SMART", name: "G-Smart Classrooms", points: rect(141, 228, 28, 17), aliases: ["g-smart"] },
  { id: "physlab", label: "G-PHYSLAB", name: "G-Physics Lab", points: rect(170, 228, 28, 17), aliases: ["physlab", "physics lab", "g-physlab"] },
  { id: "lrac", label: "LRAC", name: "Learning Resource & Activity Center (Library)", points: rect(112, 250, 86, 30), aliases: ["lrac", "library", "auditorium"] },
  { id: "rtl", label: "RTL", name: "Don Rodolfo T. Lizares Building (OAS, FAO, Guidance)", points: rect(112, 288, 92, 52), courtyard: rect(128, 300, 60, 28), aliases: ["rtl", "rodolfo", "oas", "fao", "eto", "guidance", "gdnc", "cashier"] },
  { id: "rtl-smart", label: "RTL 101–108", name: "RTL 101–108 Smart Classrooms", points: rect(140, 308, 36, 12), aliases: ["rtl 101", "smart classroom"] },
  { id: "gle", label: "GLE", name: "Gregorio L. Escario Building", points: rect(220, 262, 20, 76), aliases: ["gle", "gregorio", "cit tower"] },
  { id: "acad", label: "ACAD", name: "Academic Building", points: [[214, 222], [286, 239], [286, 250], [214, 236]], aliases: ["acad", "academic"] },
  // NGE stands west of the main entrance road, in front of RTL; GLE's plaza is east of the road.
  { id: "nge", label: "NGE", name: "Nicolas G. Escario Building", points: [[138, 350], [186, 350], [186, 346], [200, 346], [200, 376], [178, 380], [178, 386], [140, 390]], aliases: ["nge", "nicolas"] },
  { id: "plaza", label: "PLAZA", name: "GLE Front Plaza", points: [[218, 352], [238, 340], [262, 374], [248, 394], [230, 404], [221, 384]], aliases: ["plaza", "quadrangle"], kind: "open" },
  { id: "main-gate", label: "MAIN GATE", name: "Main Gate (N. Bacalso Ave)", points: rect(214, 404, 14, 8), aliases: ["main gate", "front gate", "bacalso"], kind: "gate" },
  { id: "back-gate", label: "BACK GATE", name: "Back Gate (Tres de Abril St)", points: rect(115, 28, 14, 8), aliases: ["back gate", "tres de abril"], kind: "gate" },
];

// Internal driveway from the back gate, past the buildings, to the main gate.
export const DRIVEWAY: Point[] = [[122, 32], [122, 163], [206, 166], [207, 300], [210, 380], [220, 408]];
export const RIVER: Point[] = [[8, 30], [18, 140], [46, 262], [80, 392], [92, 460]];
export const STREETS: { name: string; points: Point[]; label: { x: number; y: number; angle: number } }[] = [
  { name: "Tres de Abril St", points: [[0, 16], [320, 16]], label: { x: 236, y: 19, angle: 0 } },
  { name: "N. Bacalso Ave", points: [[95, 518], [335, 350]], label: { x: 262, y: 404, angle: -35 } },
];

export function centroid(points: Point[]): Point {
  const [x, y] = points.reduce(([sx, sy], [px, py]) => [sx + px, sy + py], [0, 0]);
  return [x / points.length, y / points.length];
}

export function insidePolygon([x, y]: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function isOnCampus(lat: number, lng: number) {
  return insidePolygon(toMapPoint(lat, lng), OUTLINE);
}

// Distance in meters from the campus to an off-campus point, measured to the
// nearest outline vertex (good enough for "about 300 m away").
export function distanceFromCampus(lat: number, lng: number) {
  const [x, y] = toMapPoint(lat, lng);
  return Math.round(Math.min(...OUTLINE.map(([ox, oy]) => Math.hypot(ox - x, oy - y))));
}

export function nearestBuilding(lat: number, lng: number) {
  const [x, y] = toMapPoint(lat, lng);
  // Later entries are more specific (e.g. RTL 101–108 sits inside RTL), so check them first.
  const inside = [...BUILDINGS].reverse().find((b) => insidePolygon([x, y], b.points));
  if (inside) return { building: inside, meters: 0 };
  return BUILDINGS
    .map((building) => {
      const [cx, cy] = centroid(building.points);
      return { building, meters: Math.round(Math.hypot(cx - x, cy - y)) };
    })
    .sort((a, b) => a.meters - b.meters)[0];
}

// Finds buildings mentioned in free text such as "RTL lobby" or "near the library".
export function matchBuildings(...texts: (string | undefined)[]) {
  const text = ` ${texts.filter(Boolean).join(" ").toLowerCase()} `;
  return BUILDINGS.filter((building) =>
    building.aliases.some((alias) => new RegExp(`(^|[^a-z])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(text)),
  ).map((building) => building.id);
}

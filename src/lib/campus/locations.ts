export type MeetupLocationGroup = "Buildings" | "Canteens" | "Gates";

export type MeetupSpot = {
  id: string;
  label: string;
  group: MeetupLocationGroup;
  stories?: number;
};

export const MEETUP_SPOTS: MeetupSpot[] = [
  // Buildings (4 stories, except GLE with 8 stories)
  { id: "nge", label: "NGE", group: "Buildings", stories: 4 },
  { id: "gle", label: "GLE", group: "Buildings", stories: 8 },
  { id: "allied", label: "ALLIED", group: "Buildings", stories: 4 },
  { id: "acad", label: "ACAD", group: "Buildings", stories: 4 },
  { id: "rtle", label: "RTLE", group: "Buildings", stories: 4 },
  { id: "sal", label: "SAL", group: "Buildings", stories: 4 },

  // Canteens
  { id: "main-canteen", label: "Main Canteen", group: "Canteens" },
  { id: "elem-canteen", label: "Elementary Canteen", group: "Canteens" },
  { id: "shs-canteen", label: "SHS Canteen", group: "Canteens" },

  // Gates
  { id: "front-gate", label: "Front Gate", group: "Gates" },
  { id: "back-gate", label: "Back Gate", group: "Gates" },
];

export const MEETUP_GROUPS: MeetupLocationGroup[] = ["Buildings", "Canteens", "Gates"];

export const PICKUP_LOCATIONS = [
  "CIT-U Library (LRAC)",
  "Campus Print Shop",
  "NGE",
  "GLE",
  "ALLIED",
  "ACAD",
  "RTLE",
  "SAL",
  "Main Canteen",
  "Elementary Canteen",
  "SHS Canteen",
  "Front Gate",
  "Back Gate",
];

function ordinalFloor(floor: number): string {
  if (floor === 1) return "1st Floor";
  if (floor === 2) return "2nd Floor";
  if (floor === 3) return "3rd Floor";
  return `${floor}th Floor`;
}

export function floorOptionsFor(stories?: number): string[] {
  if (!stories || stories < 1) return [];
  return Array.from({ length: stories }, (_, i) => ordinalFloor(i + 1));
}

export function formatMeetupLocation(spot: MeetupSpot, floor?: string): string {
  const floors = floorOptionsFor(spot.stories);
  if (floors.length === 0) return spot.label;
  const validFloor = floor && floors.includes(floor) ? floor : floors[0];
  return `${spot.label} - ${validFloor}`;
}

export function parseMeetupLocation(value: string): { spot: MeetupSpot; floor: string } {
  const [rawSpot, rawFloor] = value.split(" - ");
  const spot = MEETUP_SPOTS.find((item) => item.label === rawSpot) ?? MEETUP_SPOTS[9]; // Default: Front Gate
  const floors = floorOptionsFor(spot.stories);
  const floor = rawFloor && floors.includes(rawFloor) ? rawFloor : floors[0] ?? "";
  return { spot, floor };
}
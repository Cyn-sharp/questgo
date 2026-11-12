"use client";

import { BUILDINGS, centroid, DRIVEWAY, OUTLINE, RIVER, STREETS, toMapPoint, VIEWBOX, type Point } from "@/lib/campus/map";

export type MapMarker = { lat: number; lng: number; accuracy?: number; label: string; stale?: boolean };

const path = (points: Point[]) => points.map(([x, y]) => `${x},${y}`).join(" ");
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// Rough sketch of the CIT-U campus with an optional live marker. Buildings in
// `highlight` (e.g. the quest's meet-up point) are drawn in gold.
export function CampusMap({ marker, highlight = [] }: { marker?: MapMarker | null; highlight?: string[] }) {
  const position = marker ? toMapPoint(marker.lat, marker.lng) : null;
  // Off-map positions are pinned to the edge so the requester sees a direction.
  const pinned = position && [clamp(position[0], 8, VIEWBOX.width - 8), clamp(position[1], 8, VIEWBOX.height - 8)] as Point;
  const offMap = Boolean(position && pinned && (pinned[0] !== position[0] || pinned[1] !== position[1]));

  return (
    <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} role="img" aria-label={marker ? `Campus map showing ${marker.label}` : "Campus map"} className="h-auto w-full rounded-xl bg-[#f3efe6]">
      <defs>
        <pattern id="grass" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#e3ead6" />
          <circle cx="3" cy="3" r="0.6" fill="#c9d6b6" />
        </pattern>
      </defs>

      {STREETS.map((street) => (
        <g key={street.name}>
          <polyline points={path(street.points)} fill="none" stroke="#d8d2c4" strokeWidth="16" strokeLinecap="round" />
          <text x={street.label.x} y={street.label.y} fontSize="8" fill="#6b625e" transform={`rotate(${street.label.angle} ${street.label.x} ${street.label.y})`}>{street.name}</text>
        </g>
      ))}
      <polyline points={path(RIVER)} fill="none" stroke="#9cc7de" strokeWidth="5" strokeLinecap="round" />
      <text x="4" y="300" fontSize="7" fill="#5a8eaa" transform="rotate(75 4 300)">Arrabal River</text>

      <polygon points={path(OUTLINE)} fill="url(#grass)" stroke="#7a1f32" strokeWidth="1.5" strokeDasharray="4 2" />
      <polyline points={path(DRIVEWAY)} fill="none" stroke="#bdb5a6" strokeWidth="5" strokeLinejoin="round" />

      {BUILDINGS.map((building) => {
        const [cx, cy] = centroid(building.points);
        const active = highlight.includes(building.id);
        const fill = active ? "#c9a227" : building.kind === "open" ? "#d4e2c4" : building.kind === "gate" ? "#7a1f32" : "#ffffff";
        return (
          <g key={building.id}>
            <title>{building.name}</title>
            <polygon points={path(building.points)} fill={fill} stroke={active ? "#8a6a1f" : "#9b9286"} strokeWidth={active ? 1.5 : 0.8} strokeDasharray={building.kind === "open" ? "3 2" : undefined} />
            {building.courtyard && <polygon points={path(building.courtyard)} fill="url(#grass)" stroke="#9b9286" strokeWidth={0.6} />}
            {building.kind !== "gate" && (
              <text x={cx} y={cy + 2.5} textAnchor="middle" fontSize={building.label.length > 5 ? 6 : 7.5} fontWeight="700" fill={active ? "#161414" : "#4a4340"} transform={building.labelAngle ? `rotate(${building.labelAngle} ${cx} ${cy})` : undefined}>{building.label}</text>
            )}
            {building.kind === "gate" && (
              <text x={cx} y={building.id === "main-gate" ? cy + 13 : cy + 15} textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#7a1f32">{building.label}</text>
            )}
          </g>
        );
      })}

      {/* Compass */}
      <g transform="translate(296 44)">
        <circle r="11" fill="#ffffff" stroke="#9b9286" strokeWidth="0.8" />
        <path d="M0 -8 L3 0 L0 -2 L-3 0 Z" fill="#7a1f32" />
        <text y="-13" textAnchor="middle" fontSize="7" fontWeight="700" fill="#7a1f32">N</text>
      </g>

      {marker && pinned && (
        <g transform={`translate(${pinned[0]} ${pinned[1]})`} opacity={marker.stale ? 0.55 : 1}>
          {!offMap && marker.accuracy ? <circle r={Math.min(marker.accuracy, 80)} fill="#7a1f32" fillOpacity="0.12" stroke="#7a1f32" strokeOpacity="0.35" strokeWidth="0.6" /> : null}
          {!marker.stale && <circle r="7" fill="#7a1f32" opacity="0.35"><animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" /></circle>}
          <circle r="6" fill="#7a1f32" stroke="#ffffff" strokeWidth="2" />
          <text y="-10" textAnchor="middle" fontSize="8" fontWeight="700" fill="#161414" stroke="#f3efe6" strokeWidth="2.5" paintOrder="stroke">{offMap ? `${marker.label} (off map)` : marker.label}</text>
        </g>
      )}
    </svg>
  );
}

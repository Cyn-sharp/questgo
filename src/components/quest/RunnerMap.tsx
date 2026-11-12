"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { useRunnerLocation } from "@/hooks/useQuests";
import { apiRequest } from "@/lib/quests/client";
import { STALE_LOCATION_MS, TRACKING_STATUSES } from "@/lib/quests/tracking";
import { distanceFromCampus, isOnCampus, matchBuildings, nearestBuilding, toMapPoint } from "@/lib/campus/map";
import { Button } from "@/components/ui/Button";
import { CampusMap } from "./CampusMap";
import type { Quest } from "@/types/quest";

const SEND_EVERY_MS = 10000;
const SEND_IF_MOVED_M = 15;

function ago(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return seconds < 60 ? `${seconds}s ago` : `${Math.round(seconds / 60)} min ago`;
}

// Campus map for a quest. While the quest is underway the runner can share
// their live location, and both participants see it on the map.
export function RunnerMap({ quest, uid, now }: { quest: Quest; uid: string; now: number }) {
  const runner = uid === quest.questRunnerId;
  const participant = runner || uid === quest.requesterId;
  const underway = TRACKING_STATUSES.includes(quest.status);
  const location = useRunnerLocation(quest.id, participant && underway);
  const highlight = matchBuildings(quest.location, quest.meetUpPoint);
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.location.hash === "#runner-map") section.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const stale = Boolean(location && now - location.updatedAt > STALE_LOCATION_MS);
  const onCampus = location ? isOnCampus(location.lat, location.lng) : false;
  const nearest = location && onCampus ? nearestBuilding(location.lat, location.lng) : null;
  const who = runner ? "You" : quest.runnerName || "Runner";

  return (
    <section ref={section} id="runner-map" aria-label="Campus map" className="scroll-mt-24 space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-maroon" /> Campus map</h2>
        {highlight.length > 0 && <span className="text-xs text-gray-600"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#c9a227] align-middle" /> Pickup / meet-up</span>}
      </div>

      <CampusMap highlight={highlight} marker={location && { ...location, label: who, stale }} />

      {underway && participant && (
        <div className="space-y-2 text-sm" aria-live="polite">
          {location ? (
            <p>
              <strong>{who}</strong>{" "}
              {onCampus
                ? nearest && (nearest.meters === 0 ? `${runner ? "are" : "is"} at ${nearest.building.name}` : `${runner ? "are" : "is"} near ${nearest.building.name} (~${nearest.meters} m)`)
                : `${runner ? "are" : "is"} off campus, about ${distanceFromCampus(location.lat, location.lng).toLocaleString()} m away`}
              {" · "}<span className={stale ? "font-semibold text-amber-700" : "text-gray-600"}>updated {ago(now - location.updatedAt)}{stale && " — may be out of date"}</span>
              {" · "}<a className="text-maroon underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}>Open in Google Maps</a>
            </p>
          ) : (
            <p className="text-gray-600">{runner ? "Share your location so the requester can see you're on the way." : "The runner hasn't shared their location yet. You can ask in chat."}</p>
          )}
          {runner && <ShareLocation questId={quest.id} sharing={Boolean(location)} />}
        </div>
      )}
      <p className="text-xs text-gray-500">
        Rough sketch, not to scale. Building positions are approximate{location && !onCampus ? "; positions off the map are shown at the nearest edge" : ""}.
        {debugPoint(location)}
      </p>
    </section>
  );
}

function metersBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const [ax, ay] = toMapPoint(a.lat, a.lng), [bx, by] = toMapPoint(b.lat, b.lng);
  return Math.hypot(ax - bx, ay - by);
}

// In development, shows the map coordinates of the live position, which makes
// it easy to correct building positions in src/lib/campus/map.ts on site.
function debugPoint(location: { lat: number; lng: number } | null) {
  if (!location || process.env.NODE_ENV === "production") return null;
  const [x, y] = toMapPoint(location.lat, location.lng);
  return ` Map point: ${x.toFixed(0)}, ${y.toFixed(0)}.`;
}

function ShareLocation({ questId, sharing }: { questId: string; sharing: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  const last = useRef<{ at: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const url = `/api/quests/${encodeURIComponent(questId)}/location`;
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        const previous = last.current;
        // Send at most every 10 s unless the runner has moved noticeably.
        if (previous && Date.now() - previous.at < SEND_EVERY_MS && metersBetween(previous, { lat, lng }) < SEND_IF_MOVED_M) return;
        last.current = { at: Date.now(), lat, lng };
        apiRequest(url, "POST", { lat, lng, accuracy })
          .then(() => setError(""))
          .catch((e) => { if (!(e instanceof Error && e.message.includes("5 seconds"))) setError(e instanceof Error ? e.message : "Unable to share location."); });
      },
      (failure) => {
        setError(failure.code === failure.PERMISSION_DENIED
          ? "Location permission was denied. Allow location for this site in your browser settings."
          : "Your location is unavailable right now. Move to an open area and try again.");
        setEnabled(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => {
      navigator.geolocation.clearWatch(watch);
      last.current = null;
      apiRequest(url, "DELETE").catch(() => undefined);
    };
  }, [enabled, questId]);

  function start() {
    if (!("geolocation" in navigator)) return setError("This browser cannot share location.");
    if (!window.isSecureContext) return setError("Location sharing needs a secure (https) connection.");
    setError("");
    setEnabled(true);
  }

  return (
    <div className="space-y-2">
      {enabled ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 font-semibold text-green-700"><span className="h-2 w-2 animate-pulse rounded-full bg-green-600" /> Sharing live location</span>
          <Button size="sm" variant="outline" onClick={() => setEnabled(false)}>Stop sharing</Button>
        </div>
      ) : (
        <Button size="sm" onClick={start}><Navigation className="h-4 w-4" /> {sharing ? "Resume sharing on this device" : "Share my live location"}</Button>
      )}
      <p className="text-xs text-gray-500">Only the requester can see it, and only until the quest ends. Keep this page open while you&apos;re on the way; sharing stops when you leave it.</p>
      {error && <p role="alert" className="text-red-700">{error}</p>}
    </div>
  );
}

# QuestGo campus map and live runner location — October 30, 2026

Implemented locally. Deploy the application and `firestore.rules` together.

## Behavior

Every open or underway quest page shows a sketch of the CIT-U main campus. Buildings named in the quest's pickup location or meet-up point (for example "RTL lobby" or "library") are highlighted in gold.

Once a quest is accepted, the runner can tap **Share my live location**. The browser asks for location permission, then sends the position at most every 10 seconds (sooner if the runner moves more than 15 m). Both participants see a pulsing marker, the nearest building ("near the LRAC, ~20 m"), how long ago it updated, and an **Open in Google Maps** link. Off-campus positions (such as a print shop outside) are pinned to the map edge with the distance from campus.

Sharing stops when the runner taps **Stop sharing**, leaves the page, or the quest leaves Accepted/In progress; the server then deletes the stored position. Positions older than two minutes are shown faded with an "may be out of date" warning.

The dashboard's **Your current quest** card offers **Track runner**, which opens the quest scrolled to the map.

## Privacy and security

- Only the assigned runner can write a position, only through `POST /api/quests/[id]/location`, and only while the quest is Accepted or In progress. Updates are limited to one per 5 seconds.
- `quests/{id}/tracking/runner` is readable only by the two participants while the quest is underway. Clients cannot write it.
- Only the latest position is kept (rounded to ~1 m). There is no location history.
- Location sharing needs HTTPS (or localhost) and the page must stay open; browsers do not allow background tracking from a web page.

## The map

`src/lib/campus/map.ts` holds the map data in meters on a local grid. The campus outline is the real OpenStreetMap boundary (way 155643436, © OpenStreetMap contributors, ODbL), so GPS positions land accurately relative to it. Building shapes are a rough sketch from the official vicinity map and building locator.

To correct a building: in development, share location while standing at it; the map caption shows the current map point (x, y). Edit that building's `points` in `map.ts` and run `npm test` (a test checks every building stays inside the outline).

## Verification

- Unit tests (`tests/campus-map.test.mjs`): projection, on/off campus, buildings inside the outline, text matching, location validation.
- Emulator suite: only the runner can share, outsiders cannot read, forged client writes are rejected, rate limit, stop sharing, and deletion when the runner withdraws.
- Not yet tested on real phones on campus.

# S2-10 — Sprint 2 Emulator Tests, 2-User QA & Sprint Review Demo

Sprint 2 gate for the CPEPE361 Prefinal Review. It has three parts: (1) the automated Firebase Emulator suite, (2) a live walkthrough with two accounts, and (3) a 3-minute review and retrospective video.

## 1. Automated gate

Prerequisites: Node 20+, and **Java 11+ on `PATH`**, because the Firestore emulator needs a JVM. Check with `java -version`.

```bash
npm ci
npm test              # unit tests (policy, validation, safety, map, etc.)
npm run lint
npm run build         # the emulator suite runs `next start`, so build first
npm run test:workflow # Firestore + Auth + Storage emulators, tests/quest-flow.emulator.mjs
```

`test:workflow` refuses to run unless the emulator hosts are set, so it can never touch the live project (`demo-questgo-test` only).

### Sprint 2 definition-of-done coverage

| Sprint 2 DoD item | Covered by (in `tests/quest-flow.emulator.mjs`) |
| --- | --- |
| Cannot accept own Quest | lifecycle test (`requester` accept → 403) |
| Expired / missing / already-accepted Quest cannot be accepted | lifecycle test (expired → 409); S2-10 test (missing → 404, re-accept → 409) |
| Concurrent acceptance → exactly one runner | lifecycle test (parallel `runner1`/`runner2` → `[200, 409]`) |
| Acceptance persisted with auditable timestamp | S2-10 test (`acceptedAt` server `Timestamp`, `questRunnerId`) |
| Available query no longer returns accepted Quest | S2-10 test (client `status == available` query) |
| Role-specific views / My Requests | S2-10 test (`requesterId` and `questRunnerId` queries) |
| Messenger blocked before acceptance and for non-participants | lifecycle test + S2-10 test (API 403 and Firestore `permission-denied`) |
| Messages persist with sender identity and server timestamp | lifecycle test (spoofed `senderId` ignored; realtime delivery to both) |
| Accepted → In Progress only by the assigned runner, once | S2-10 test (requester/outsider → 403, second start → 403) |
| Clients cannot write Quest status/runner directly | lifecycle test + S2-10 test (Firestore rules) |
| Unverified accounts are blocked | lifecycle test (create → 403, read → denied); S2-10 test (accept → 403) |

Record the final lines of each command (`pass N / fail 0`) as review evidence.

## 2. Live two-account QA walkthrough

Use two **verified `@cit.edu` test accounts** in two separate browser profiles (or one normal window and one incognito window). Call them **A (Requester)** and **B (Runner)**. Never write passwords in this document or in the recording.

| # | Account | Step | Expected result | Pass |
| --- | --- | --- | --- | --- |
| 1 | A | Log in and open **Post a Quest**. Submit with the reward blank. | Validation error; nothing is posted. | ☐ |
| 2 | A | Post a valid Quest (title, category, reward, location, meet-up point, time). | Quest appears in **My Requests** as Available, with a 30-minute countdown. | ☐ |
| 3 | A | Open your own Quest from the marketplace. | No **Accept** action; the Quest is marked as yours. | ☐ |
| 4 | A | Try to post a second Quest while the first is active. | Blocked with the "one active quest" message. | ☐ |
| 5 | B | Log in and browse **Quests**. | A's Quest is listed; expired Quests are not. | ☐ |
| 6 | B | Open the Quest and try **Messenger**. | Messaging is unavailable before acceptance. | ☐ |
| 7 | B | **Accept** the Quest. | B is redirected to Active Quest; the status is Accepted. | ☐ |
| 8 | A | Refresh the marketplace and **My Requests**. | The Quest is gone from the marketplace; My Requests shows Accepted with B as the runner. | ☐ |
| 9 | A ↔ B | Exchange messages in Messenger. | Messages arrive in real time with the correct sender, and are still there after a refresh. | ☐ |
| 10 | A | Look for a **Start** action. | None. Only the runner can start the Quest. | ☐ |
| 11 | B | Tap **Start** (Accepted → In Progress). | Both views show In Progress. | ☐ |
| 12 | B | Share your location (mock GPS is fine). | A sees the runner on the map; it stops when the Quest ends. | ☐ |
| 13 | B → A | Commit, request completion, and acknowledge payment. Then A confirms completion. | The status is Completed and Messenger becomes read-only. | ☐ |
| 14 | A | Rate B. | Rating saved; a second rating attempt is rejected. | ☐ |
| 15 | Either | Log out and open `/dashboard`. | Redirected to login. | ☐ |

Defects found: log each one as a GitHub issue that includes the step number and a screenshot, and link it from PR #30.

## 3. Sprint Review demo (3 minutes)

| Time | Segment | Show |
| --- | --- | --- |
| 0:00–0:20 | Sprint goal | "Two verified students can safely accept, coordinate, and progress one Quest." |
| 0:20–0:50 | Automated gate | Terminal: `npm run test:workflow` passing, plus a quick scroll through the DoD table above. |
| 0:50–2:10 | Live flow | Steps 2, 5, 7, 8, 9, 11, and 13 side by side (A on the left, B on the right). |
| 2:10–2:30 | Security | Step 3 (no self-accept) and step 6 (no Messenger before acceptance). |
| 2:30–3:00 | Retrospective | What went well, what didn't, and one action item for Sprint 3 (one line each per member). |

### Retrospective prompts

- **Went well:** server-side transactions made race conditions testable; the emulator suite caught regressions before merge.
- **To improve:** a test setup that needs Java should be documented on day one; merge smaller PRs.
- **Action item:** run `npm run test:workflow` in CI on every PR to `main`.

## Sign-off

| Member | Role in QA | Signed off |
| --- | --- | --- |
| Cyndrick C. Abejo | Requester account / recording | ☐ |
| Sean Jansenn Lorico | Runner account | ☐ |
| Mark Anthony Blanco | Automated gate evidence | ☐ |
| Ace Grant Kyamko | Defect log / retrospective | ☐ |

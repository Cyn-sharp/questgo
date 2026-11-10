# Authentication and quest security QA

## Message priority, archive and query improvements

- Messages puts In Progress ahead of Accepted, followed by up to three recent
  closed conversations with gray styling and explicit status. Ongoing quests
  are listed even before either participant sends a message. Toasts prioritize
  ongoing quests too.
- Profile links to `/profile/archive`, with requester/runner views and cursor
  pagination of 10 transactions, ordered by posting date. Messages are retained;
  this feature does not delete or move records.
- Dashboard notifications fetch active work plus at most three recent closures
  per role instead of subscribing to the entire quest history. Recent closures
  require `updatedAt` (written by the current quest API). Legacy records without
  it remain available through the archive, which orders by `createdAt`.
- Profile stats use two aggregate queries rather than three full-record reads.
  Other My Quests lists and inbox summary reads still grow with account history;
  further pagination there remains a scaling task.
- Deploy `firestore.indexes.json` and wait for indexes to build before releasing
  these queries. Emulator tests do not verify production index availability.
- Browser/mobile QA and live latency measurements are still pending. No claim
  of a measured production speedup or live deployment is made.

## October 1 in-app alerts update

- Dashboard-wide Messages button lists incoming conversations with a red unread
  indicator. Read markers are stored per account in this browser and shared
  between its tabs, not across devices. Opening a visible, focused chat clears
  its marker. New alerts begin with messages sent after this update.
- Accepted, started, ready, completed, and cancellation changes show queued
  three-second notices while the dashboard is open. Initial quest snapshots do
  not replay old status notices. This is not background phone push delivery.
- Message sends atomically update a private recipient inbox. Deploy the matching
  Firestore rules with the app. The archive update also requires the indexes
  described above.
- Production build, 13 unit tests, changed-file lint and the emulator integration
  suite passed, including recipient inbox access and forged-write rejection.
- Manual QA: use two accounts to send/reply, navigate between dashboard pages,
  check the red dot clears in the open chat, reload, switch accounts, and exercise
  each status change. Check the floating button on mobile and scroll older chat
  messages while new ones arrive. Rendered browser/mobile QA remains pending.

## October 1 cancellation and completion update

- Added a browser confirmation before receipt/payment completion and before
  requesting or approving cancellation.
- Either participant may request cancellation after acceptance. Only the other
  participant may approve or decline; the initiator may withdraw. Server
  transactions pause progress until the request is resolved.
- Cancelled chat history stays private and read-only. Pending cancellation keeps
  chat open and still counts as an active quest.
- Production build, 11 unit tests, changed-file ESLint, and the expanded isolated
  emulator suite passed. Integration checks cover approval permissions,
  decline/withdrawal, blocked completion, posting again, and cancelled chat access.
- Browser/mobile confirmation checks remain manual. No deployment performed.
- Admin review for unresponsive participants is not implemented.

## Local implementation

Quest creation, acceptance, status changes and message sends use authenticated
Next.js API routes. Each request verifies a Firebase ID token with revocation
checking and the current account's enabled/verified state. Callers cannot choose
requester, runner, sender, status, or canonical timestamps.

Firestore rules deny direct client mutations to quests/messages and all access
to requester locks and message rate limits. Verified accounts may browse quests.
Only the requester and assigned runner may read messages after acceptance,
including read-only history after completion. User profiles remain owner-only,
with identity, verification and rating fields protected.

Gmail testing remains enabled. This is not yet a CIT-U-only production policy.

## Checks run on September 30, 2026

- Production build passed.
- Ten unit/regression tests passed (logout, profile name, input/workflow policy).
- Firebase Auth + Firestore emulator integration suite passed against the actual
  Next.js APIs using isolated demo-questgo-test accounts and data.
- Changed workflow files passed ESLint. Whole-project lint still reports seven
  existing errors and one warning in authentication, testimonials, and ratings.

The integration suite checks missing authentication, unverified users, concurrent
posts, competing runners, self-acceptance, expired acceptance, unauthorized or
skipped transitions, persisted realtime message delivery to both participants,
outsider chat access, forged direct writes, requester-confirmed completion,
posting after completion/cancellation/expiry, and active legacy records.

## Reproduce automated checks

Use Node.js 22.18+ or Node.js 24 and Java 21+ on PATH:

    npm.cmd test
    npm.cmd run build
    npm.cmd run test:workflow

The workflow script runs Firebase CLI 15.32.0 and local Firestore (8085) and Auth
(9095) emulators. The suite starts a test app on port 3105. It refuses to run
without those emulator addresses, uses a demo project, and never deploys rules
or changes the real database. Ports must be free.

A portable Java runtime was downloaded into ignored .tools/java for this machine;
it was not installed globally. Add its bin directory to the current shell's PATH
if Java is not otherwise available.

## Two-browser staging walkthrough

After the matching app and rules are deployed to a staging project:

1. Sign in as verified requester A and runner B in separate browsers/sessions.
2. A posts a quest and lands on its real active workspace with waiting status.
3. A opens Post a Quest again: Manage My Quest replaces the form. A second API
   create returns HTTP 409.
4. B finds and accepts the quest. A's workspace/My Requests updates without
   refresh. The quest disappears from the available marketplace for everyone.
5. Both open Messenger from the quest, exchange messages, and reload. Messages
   arrive without refreshing and persist after reloading.
6. A third account cannot read/send the messages, even with their URLs.
7. B starts work and marks it ready. A confirms receipt and cash payment. Both
   see Completed, chat becomes read-only, and A can post again.
8. Check cancellation before acceptance and 30-minute unclaimed expiry; neither
   allows subsequent acceptance.
9. Sign out and revisit /dashboard directly and with browser Back. Block the
   logout request to verify a retryable error instead of a false success.

The automated suite verifies API/database behavior, not a rendered browser
walkthrough. A visual/mobile pass and live email delivery still need staging QA.

## Deployment boundary

These changes have not been deployed to the live Firebase project. Deploy the
matching application and firestore.rules together. Old permissive rules allow
direct-write bypasses; old rules without message reads block chat. Review the
exact project before publishing. No database reset or user deletion is needed.
Existing duplicate active quests are preserved; resolve them before posting
another. See system-status.md for remaining improvements and limitations.

# Authentication and quest security QA

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

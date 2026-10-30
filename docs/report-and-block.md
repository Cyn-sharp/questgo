# QuestGo report and block — October 30, 2026

Implemented locally. Deploy the application and `firestore.rules` together.

## Behavior

**Report.** From a quest page, a participant can report the other participant. Anyone who can see a quest can report its poster (for prohibited listings). A report needs a reason (harassment, scam/payment, no-show, unsafe, inappropriate, other) and 10–1,000 characters of detail. Each person can file one report per quest; the report ID is `{questId}_{reporterId}`, so a duplicate is rejected inside the transaction. The reporter can also block the person in the same step.

**Block.** Blocking hides the blocked user's quests from your marketplace and dashboard, and the server rejects acceptance if either user has blocked the other. The error is deliberately generic ("You can't accept this quest.") so users cannot discover who blocked them. A block does not end a quest already underway: obligations (money, items) still need completing or settling. Unblock is available from the same button.

**Admin review.** `/admin/reports` lists up to 100 open reports, flags users with several open reports, and links to the quest's activity and chat (`/admin/review`). Each decision needs an outcome (dismiss, warning recorded, suspend) and a 10–2,000 character note. Suspension disables the Firebase Auth account and revokes refresh tokens, which ends existing sessions and API access. Admins cannot suspend themselves. Access requires the `admin: true` custom claim, as for the settlement queue.

## Data and rules

| Path | Written by | Readable by |
| --- | --- | --- |
| `reports/{questId}_{reporterId}` | Server only | Nobody via client; admins via API |
| `users/{uid}/blocks/{blockedId}` | Server only | That user only |

Code: policy in `src/lib/quests/safety.ts`, Firestore operations in `src/lib/quests/safety-service.ts`, routes `POST /api/quests/[id]/report`, `POST|DELETE /api/users/[id]/block`, `GET|POST /api/admin/reports`, UI in `src/components/quest/SafetyActions.tsx`.

## Verification

- Unit tests (`tests/safety.test.mjs`): validation, report targets, self-block, admin decisions.
- Emulator suite: duplicate-report race, block privacy and forged writes, acceptance blocked in both directions, admin-only listing/resolution, suspension cutting off API access.

## Known limits

- No blocked-users list in Profile yet (unblock works from a quest page).
- Suspension does not automatically cancel or settle that user's active quests; admins should check them.
- Reports are not sent as notifications; admins must check the queue.

# QuestGo funding and recovery — October 11, 2026

Implemented locally. Deploy the application and Firestore rules together before using settlement chat in production.

## Funding policy

Every newly posted quest specifies one of three arrangements:
- No purchase needed: runner upfront cost is zero.
- Requester pays the vendor directly: runner upfront cost is zero; requester acknowledges paying before collection. Vendor refunds go to the requester.
- Optional abono: the runner explicitly accepts a maximum advance. The runner records a quote, the requester approves it, and the runner records the commitment before purchasing. Final receipt details and actual cost cannot exceed the approved amount. Reward and reimbursement are separate; only reward counts toward earnings.

Printing and Shopping require vendor payment or abono. Shopping item budget must equal the advance/purchase limit. Direct requester-to-runner purchase funding is not offered in this release.

Payments and receipt references are participant statements. QuestGo does not transfer money, independently verify receipts, guarantee payment, or recover missing cash. Do not put payment credentials or secrets in quest instructions. The UI states these limits.

## Recovery policy

New quests have workflowVersion 2. Either participant can leave with a reason before commitment; the assignment closes without permission from the other person. After commitment, stopping opens settlement and preserves expenses and belongings obligations. Existing quests without the new checkpoint use settlement conservatively.

A participant can request a response with a ten-minute server-enforced deadline. Further progress pauses. The initiator can acknowledge that the issue is resolved and resume work. After the deadline, either participant can close uncommitted new work or send committed/legacy work to settlement. The deadline does not automatically settle money. Users trigger the recovery action; there is no scheduled background timeout worker or push delivery.

Settlement does not occupy the one-active-posted-quest slot. Chat remains writable. Both participants can acknowledge settlement, or an administrator can record a reviewed decision. No promise of administrator response time is made.

Find Another Runner / Post Again creates a new quest document with the original details. It is offered only for new, uncommitted cancelled/expired quests, is protected by the same requester transaction lock, and cannot run twice. Previous conversations stay with the previous assignment; the new runner cannot read them. Vendor-payment acknowledgement is reset and must be supplied again for the new assignment.

## Completion and ratings

The runner marks work ready after commitment (and final receipt details for abono). The runner separately acknowledges receiving reward and reimbursement. The requester checks two confirmations: item/service received, and payment made. Completion requires all acknowledgements and is not independent payment verification.

Ratings are submitted through a trusted API. Identity is server-derived, the quest must be completed, and each participant has one rating document per quest. Aggregation is updated transactionally. Settlement and cancelled quests cannot be rated as completed work.

## Administrator operation

The resolution queue is /admin and case records are /admin/review?id=QUEST_ID. Every API requires a verified user whose Firebase Auth account has the server-managed custom claim admin: true. A profile field or client request cannot grant access.

A trusted project administrator must provision that claim using Firebase Admin SDK and preserve existing claims. No real account was granted privileges by this implementation. Select the person responsible for review before release; the queue itself is not a staffed support service.

Cases show participant names, reason, expense details, activity, and the latest 100 messages. Decisions require a written explanation and an explicit acknowledgement that obligations were reviewed and resolved. Events are server-written and exposed only through participant/admin APIs. Direct client event writes and reads remain denied by rules. Activity and case lists currently show bounded batches, not full pagination.

## Demonstration checklist

1. Post a vendor-paid quest; show separate cost and reward. Filter marketplace to ₱0 upfront.
2. Accept as runner; acknowledge vendor payment as requester; start and record collection commitment.
3. Mark ready; runner acknowledges payment; requester checks receipt and payment; complete.
4. Post abono; show rejection without explicit advance acceptance, requester expense approval, final receipt limit, and reward-only earnings.
5. Withdraw before commitment; requester selects another runner; verify old chat remains private.
6. Stop after commitment; verify settlement chat works and requester can post again.
7. Request a response; verify recovery is unavailable before the deadline and no money is declared settled at timeout.
8. Attempt admin access as a normal user; verify denial. Review a case as a claim-authorized admin and record a decision.
9. Submit a rating twice; verify only one rating persists.

## Remaining operational limits

External payment fraud still requires human review. Receipts are text references rather than verified vendor integrations or receipt-image uploads. No escrow, payment processor, background push, sanctions automation, or staffed review SLA is included. Settlements do not permit automatic replacement after commitment. This release does not change the existing account-domain policy.

## Verification completed

- Production build: passed.
- ESLint across all modified TypeScript files: passed with no warnings.
- Unit tests: 25 passed.
- Isolated Firebase emulator suites: 3 passed, including assignment races, private messaging, printing files, replacement privacy, advance limits, settlement, response deadlines, duplicate ratings, and administrator authorization.
- No deployment or real administrator provisioning was performed. No manual browser/mobile acceptance walkthrough has been completed for these changes.

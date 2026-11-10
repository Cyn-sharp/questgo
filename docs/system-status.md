# Latest update — October 30, 2026

Campus map and live runner location are implemented locally; see [runner-map.md](runner-map.md). The dashboard now opens with a compact welcome strip and a "Your current quest" card, and its stat cards link to the relevant pages.

Report and block are implemented locally with an admin report queue; see [report-and-block.md](report-and-block.md). Registration, login, password reset, session creation and quest APIs now accept only `@cit.edu` unless `NEXT_PUBLIC_ALLOW_TEST_GMAIL=true` is set. Whole-project lint passes with no errors or warnings.

# Update — October 11, 2026

Funding, withdrawal, replacement, settlement review, payment acknowledgements, and trusted ratings are now implemented locally. See [funding-and-recovery.md](funding-and-recovery.md) for the current behavior, verification, and release limits. The September review below is historical.

# QuestGo system review — September 30, 2026

## Implemented locally in this pass

| Area | Behavior |
| --- | --- |
| Posting | Validated server API; requester identity and 30-minute expiry set by server; redirect to the created quest |
| One active request | A shared per-requester transaction lock plus an existing-record query prevents parallel creates and covers legacy quests |
| Active definition | Unexpired Available, Accepted, or In Progress; only unclaimed quests expire after 30 minutes |
| Post screen | Shows Manage My Quest instead of a second form while a posted quest is active |
| Discovery | Marketplace and dashboard previews subscribe to Firestore; acceptance removes a quest and countdowns remove expired entries |
| Details | Selected real quest record; correct requester/runner roles; no fixed demo quest |
| Acceptance | Transaction assigns one runner; rejects self-acceptance, expiry and already claimed quests |
| My Requests | Live posted and running lists; persisted status/history instead of local fixtures |
| Messenger | Private quest-scoped persisted text, live listeners, server sender identity, maximum 2,000 characters, one message per second per sender per quest |
| Completion | Runner starts work and marks ready; requester confirms receipt and COD acknowledgement; chat then becomes read-only |
| Data security | Direct client quest/message mutations denied; verified identity and role/status checks on server; protected internal lock documents |

These are code changes validated by an isolated emulator integration test, not a
claim that the live deployment has been updated. See `auth-security-qa.md` for
test results, reproduction and the two-browser walkthrough.

## Improvements still needed, in priority order

1. **Deploy and perform staging acceptance.** Publish the app and reviewed rules
   to the intended project, then execute the two-browser/mobile walkthrough.
   Rule deployment is essential for both the posting restriction and chat.
2. **CIT-U production policy.** Remove or explicitly isolate the Gmail testing
   allowance in registration, session issuance, protected access and database
   rules. Verification alone is not proof of an official CIT-U address.
3. **Disputes and abandoned quests.** Accepted and ongoing quests now support
   cancellation by mutual agreement, with decline and withdrawal options. Progress
   pauses while a request is pending; chat stays open and becomes read-only after
   cancellation. Completion also asks for confirmation before submitting. An
   admin review workflow for unresponsive participants is still needed; mutual
   cancellation alone does not resolve abandonment or prevent dishonest users.
4. **Attachments.** The old file selector accepted files but did not upload them.
   It is now replaced with clear availability text. Add validated private uploads
   and participant-authorized downloads before claiming printing-file support.
5. **Ratings, reporting, blocking and push notifications.** In-app message badges
   and quest status notices are implemented. Background push delivery is not.
   Ratings still need trusted server aggregation, uniqueness and
   authorization; report/block controls need persistence and admin handling.
6. **Scale and abuse controls.** Add chat pagination beyond the latest 100
   messages, paginated quest/history queries, broader API quotas/App Check,
   audit logs and operational monitoring. Current creation checks scan that
   requester's records to include legacy data; a migration could later allow
   the lock alone to identify the active quest.
7. **UI and build hygiene.** Resolve the seven existing lint errors and one
   warning, fix remaining placeholder profile menu destinations/footer links,
   consolidate duplicate components, and test keyboard/mobile behavior.
8. **Align the sprint board.** The older sprint-plan snapshots still describe
   several now-replaced mocks. Update story status after staging acceptance,
   using separate labels for implementation, automated verification and release.

Existing registration, session-cookie authentication, password-reset screens,
profile-name handling and logout fixes remain in place. Dashboard aggregate
statistics are not yet fully live. Completion records a user's acknowledgement
of cash exchange; the application does not verify or process actual payments.

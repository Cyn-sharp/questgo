# QuestGo 3-Sprint Execution Master Plan

## CPEPE361 Delivery Brief

QuestGo is a web-based CIT-U student-to-student task marketplace. This execution plan converts the QuestGo SRS into a three-sprint delivery plan for CPEPE361 Software Development 1.

### Academic phase deliverables

| Phase | Required output | QuestGo evidence |
| --- | --- | --- |
| Prelim | Team formation, problem scoping, validation survey with at least 5 target users, and MoSCoW Product Backlog | SRS basis, user-validation record, and Product Backlog below |
| Midterm: Sprint 1 complete | Sprint Review for the walking skeleton and a 3-minute Retrospective video | Database connection, authentication, primary Quest CRUD flow, Sprint 1 review checklist, and retrospective recording |
| Prefinal: Sprint 2 complete | Sprint Review for expanded business logic and a 3-minute Retrospective video | Atomic Quest acceptance, status workflow, My Requests, Messenger, and integration evidence |
| Final: Sprint 3 complete | Sprint Review, 100% implementation deployment build, live oral defense, and code authorship verification | Full Quest lifecycle, deployed build, final test evidence, contribution history, and defense materials |

### Strict project-board columns

Use these columns exactly in GitHub Projects or Trello:

1. **Product Backlog**: approved SRS work not selected for the current sprint.
2. **Sprint 1 Backlog**: Sprint 1 commitment waiting to be started.
3. **In Progress**: actively being implemented by an assigned member.
4. **Code Review**: implementation is complete and waiting for a Pull Request review.
5. **Done**: merged, tested, and accepted against its acceptance criteria.

The planning labels used in the analysis sections below map to the board as follows: `Ready` maps to the appropriate sprint backlog, `In Review` maps to `Code Review`, and `Done` maps to `Done`. Work marked `In Progress` belongs in the active implementation column.

### Task and branch standards

- Every user story must include an owner, acceptance criteria, story points or time estimate, and a linked SRS requirement.
- Use the Fibonacci scale from 1 to 10 for story points. A 1-point task should be less than half a day; an 8- or 10-point item should be split before implementation when possible.
- Create branches using `feature/[story-id]-[short-desc]`, for example `feature/S2-02-atomic-quest-acceptance`.
- Open a Pull Request for every completed story. A second team member must review the PR before merge.
- A story enters `Done` only after the PR is approved and merged, acceptance criteria are demonstrated, and the relevant validation command or manual test passes.

### Board screenshot submission

For the course submission, open the GitHub Projects or Trello board after populating the columns above and capture one screenshot showing the project title, all five columns, and the visible Sprint 1 cards. The board snapshot should match the status and IDs in this file.

## Prelim: Product Discovery and Backlog

### Required discovery tasks

| ID | Task | Estimate | Evidence |
| --- | --- | ---: | --- |
| PRE-01 | Form the development team and assign roles | 0.5 day | Team member and role list |
| PRE-02 | Confirm problem scope from the QuestGo SRS | 0.5 day | Approved scope statement |
| PRE-03 | Prepare and conduct a survey with at least 5 CIT-U target users | 2 days | Survey questions, responses, and summary |
| PRE-04 | Convert validated needs into SRS-linked user stories | 1 day | Product Backlog |
| PRE-05 | Prioritize the Product Backlog using MoSCoW | 0.5 day | Prioritized board and rationale |
| PRE-06 | Set up GitHub repository, project board, branch rules, and PR workflow | 0.5 day | Repository, board, and first PR |

### MoSCoW Product Backlog

| Priority | SRS-aligned capabilities |
| --- | --- |
| Must have | CIT-U registration and verification, login, post Quest, browse/view Quest, 30-minute expiry, one-runner acceptance, status tracking, Messenger after acceptance, meet-up coordination, completion confirmation, COD acknowledgement, ratings, and core security rules |
| Should have | My Requests, Quest history, notifications, report user/Quest, block user, responsive/accessibility states, and administrator review of reports |
| Could have | Attachment upload polish, richer search/filtering, profile reputation details, and dashboard analytics |
| Won't have for MVP | Online payments, phone OTP, SIM verification, student-ID upload verification, and third-party delivery integration |

### Product Backlog rule

All unselected SRS stories remain in **Product Backlog**. Do not move a story directly to `In Progress`; select it during sprint planning, add it to the sprint backlog, assign an owner, and define its acceptance test first.

## Board-Ready Sprint 1 Snapshot

Create these cards in the project board. Add the assigned team member to each card before work begins.

| Board column | Cards |
| --- | --- |
| Product Backlog | S2-01 through S2-10, Sprint 3 stories, deployment, final defense evidence |
| Sprint 1 Backlog | S1-07 Finish Quest details; S1-09 Focused tests and QA; S1-10 Usability states |
| In Progress | S1-01 CIT-U registration policy; S1-02 Protected access; S1-05 Post a Quest; S1-06 Real Quest marketplace |
| Code Review | S1-04 Firestore data security; S1-08 Expiration contract |
| Done | S1-03 User profile persistence |

Move cards only when the board rule is satisfied. In particular, a mock page is not `Done`; it remains `In Progress` until it reads and writes the intended Firebase data.

## Review and Retrospective Evidence

### Sprint 1 Review: Walking skeleton

Demonstrate this flow in the review:

1. A new student registers with an official `@cit.edu` email.
2. The student verifies the email and logs in.
3. The authenticated application connects to Firebase and persists the user profile.
4. The student posts a Quest with the required SRS fields.
5. A second verified student browses and opens the Quest.
6. The Quest displays its 30-minute availability window and excludes expired records.
7. Firestore rules reject unauthorized ownership or status changes.

Submit the review checklist, screenshots or recording, test account procedure without passwords, and the lint/build result.

### Sprint 1 Retrospective video

Keep the video to approximately three minutes:

- Minute 1: What the team completed and what was demonstrated.
- Minute 2: What slowed the team down, including mock-to-Firebase integration or security-rule issues.
- Minute 3: One or two concrete process changes for Sprint 2, such as earlier PR reviews or smaller stories.

### Sprint 2 Review

Demonstrate one two-user flow: a requester posts a Quest, two runners attempt acceptance, one runner succeeds, the Quest becomes unavailable, the requester and runner see their role-specific views, the Quest moves to `In Progress`, and both participants exchange persistent Messenger messages.

### Sprint 3 final evidence

Prepare the deployed build, full lifecycle demonstration, test report, Git history, merged PR list, contribution summary, and a short explanation of the code each member authored for the live oral defense.

## Planning Basis

This plan is derived from the QuestGo Software Requirements Specification (SRS) v1.0 and the current repository state.

QuestGo is a CIT-U-only student task marketplace. The MVP must support verified student accounts, Quest posting and discovery, one-runner acceptance, 30-minute availability, Messenger after acceptance, COD coordination, completion, ratings, and safety/reporting controls.

### Current repository signals

- Next.js 16 App Router application with Firebase Authentication, Firestore, and Storage.
- Public landing page and marketing content are present.
- Registration, login, email verification, and password reset screens are present.
- Quest creation and available-Quest browsing are partially implemented.
- Quest records already include status, requester, optional runner, timestamps, and expiration.
- The registration UI currently allows Gmail for testing; production acceptance criteria must require `@cit.edu` only.
- Quest browsing hides expired records, but a server-side expiration/acceptance policy is still needed.

## Current SRS Delivery Board

This board describes the repository as it exists now. `Done` means the slice is implemented at the UI or foundation level; it does not mean the whole SRS requirement is production-complete. `In Review` means code exists and needs validation against the SRS, security rules, or the real Firebase environment.

### Done

- Landing page, QuestGo branding, CIT-U messaging, and public navigation.
- Login, registration, password reset, and email-verification screens.
- Firebase client and Firebase Admin initialization.
- Session-cookie creation and logout API routes.
- Quest and user TypeScript models.
- Quest creation helper with `available` status and a 30-minute `expiresAt`.
- Firestore available-Quest query with client-side expired-Quest filtering.

### In Progress

- CIT-U-only registration: the current UI and API still allow Gmail testing accounts.
- Protected dashboard access: the login flow creates a session, but dashboard route enforcement needs verification.
- Post a Quest: the form and persistence path exist, but end-to-end validation and attachment behavior are incomplete.
- Find a Quest: the Firestore marketplace component exists, while dashboard sections still display mock Quest cards.
- Quest details: links exist, but a complete data-backed detail flow must be confirmed.
- Expiration: countdown/filtering exists, but server-side status enforcement is not complete.

### In Review

- Firestore rules: ownership checks exist, but verified-user checks and immutable field validation need review.
- Storage rules: profile-photo restrictions exist; Quest attachment support is currently disabled.
- Current Quest data-layer changes in `src/lib/db/quests.ts`, `src/types/quest.ts`, and the marketplace component.
- Current Sprint 1 code changes in the working tree, including the post-Quest page and Firestore rules.

### Ready

- Remove the Gmail testing path from production registration and login.
- Enforce verified email access at every protected route and data boundary.
- Replace dashboard mock Quests with the Firestore marketplace data source.
- Finish and verify the data-backed Quest details page.
- Add shared form/data validation for Quest fields and reward amounts.
- Add tests for email policy, Quest validation, expiry filtering, and ownership rules.
- Add loading, empty, error, expired, and unauthorized states.
- Run lint/build and complete a two-account manual SRS acceptance test.

### Not Sprint 1

Quest acceptance, atomic runner assignment, status progression, Messenger, notifications, completion, COD confirmation, ratings, reports, blocks, history, and admin tools remain Sprint 2 or Sprint 3 work as defined below.

## Three-Sprint Roadmap

Each sprint is three weeks. The roadmap is intentionally ordered around a usable, testable vertical slice.

| Sprint | Outcome | Main scope | Sprint exit |
| --- | --- | --- | --- |
| Sprint 1 | Verified account and Quest marketplace foundation | CIT-U registration and verification, authenticated app access, user profile record, post Quest, browse Quest, Quest details, expiration display, security rules, and baseline testing | A verified CIT-U student can post a Quest and another verified student can find and view it without violating ownership or access rules. |
| Sprint 2 | Complete accepted Quest workflow | Atomic Quest acceptance, requester/runner role views, status transitions, My Requests, Messenger after acceptance, meet-up coordination, and expiration handling | Two verified students can safely accept, coordinate, and progress one Quest from Available to In Progress. |
| Sprint 3 | Closeout, trust, and release readiness | Completion confirmation, COD acknowledgement, ratings/feedback, report/block, notifications, Quest history, admin reports, responsive polish, performance, and end-to-end release testing | A Quest can complete its full lifecycle with safety controls, auditability, and a production-ready MVP checklist. |

## Sprint 1: Verified Marketplace Foundation

### Sprint goal

Deliver the smallest trustworthy marketplace slice: a CIT-U student can create and verify an account, sign in, post a complete Quest, and browse/view currently available Quests. The system must protect private data and prevent a user from treating their own Quest as an eligible marketplace opportunity.

### Sprint boundaries

**In scope**

- Official `@cit.edu` email validation and email verification gate.
- Firebase Auth session handling and protected dashboard routes.
- Firestore user profile document with verified-account state.
- Quest creation with required SRS fields: title, category, description, reward, location, meet-up point, preferred time, and optional attachment path.
- Available Quest list and Quest detail view.
- Visible 30-minute countdown and expired-Quest exclusion.
- Firestore security rules and validation for users and Quests.
- Loading, empty, error, and unauthorized states.
- Unit/component checks plus a manual acceptance test.

**Out of scope for Sprint 1**

- Accepting a Quest and atomic runner assignment.
- Messenger and notifications.
- Quest completion, COD confirmation, ratings, reports, blocks, and admin tools.
- Online payments, phone OTP, SIM verification, student-ID upload, or delivery integration.
- Full profile/history experience beyond the minimum user record needed by the marketplace.

## Sprint 1 Backlog

Sprint 1 is based on the SRS and starts from the repository status above. The team should commit only to the `P0` items. `P1` items are pulled in only after the core acceptance flow works.

| ID | Status | Priority | Backlog item | Acceptance criteria | Estimate |
| --- | --- | --- | --- | ---: |
| S1-01 | In Progress | P0 | Enforce CIT-U registration policy | Registration and login accept only normalized `@cit.edu` addresses; Gmail testing copy and bypass are removed from production behavior. | 3 pts |
| S1-02 | In Progress | P0 | Verify protected access | Verification email, session creation, dashboard protection, and unverified-user redirects work in a real Firebase environment. | 5 pts |
| S1-03 | Done | P0 | Persist the user profile | Registration creates/updates the user document with UID, name, email, verification state, and timestamps without storing passwords. | 3 pts |
| S1-04 | In Review | P0 | Secure user and Quest data | Firestore rules require the right user identity and verified account, prevent client-controlled ownership/status fields, and preserve requester ownership. | 5 pts |
| S1-05 | In Progress | P0 | Finish Post a Quest | Required SRS fields validate; reward is positive; successful posts use `available`, server timestamps, and a 30-minute expiry; errors are visible. | 5 pts |
| S1-06 | In Progress | P0 | Finish the real Quest marketplace | Available Quests come from Firestore, exclude expired records, show required SRS information, and no longer depend on dashboard mock data. | 5 pts |
| S1-07 | Ready | P0 | Finish Quest details | A data-backed detail page shows task, reward, location, meet-up, preferred time, COD, expiry, and missing/expired states. | 3 pts |
| S1-08 | In Review | P0 | Confirm the expiration contract | List, detail, and future acceptance logic use the same 30-minute rule; an expired Quest is never treated as available. | 2 pts |
| S1-09 | Ready | P1 | Add focused tests and QA | Test CIT-U validation, Quest validation, expiry filtering, ownership rules, and the two-account manual acceptance flow. | 5 pts |
| S1-10 | Ready | P1 | Complete usability states | Add loading, empty, error, unauthorized, expired, keyboard-focus, and responsive states to the Sprint 1 screens. | 3 pts |

**Suggested Sprint 1 capacity:** 33 points total, with approximately 28 points of active implementation/review work remaining. Commit to S1-01 through S1-08; pull S1-09 and S1-10 only after the core two-user flow works.

## Suggested Three-Week Breakdown for Sprint 1

### Week 1: Identity and access foundation

- S1-01 CIT-U-only registration policy.
- S1-02 email verification gate.
- S1-03 user profile persistence.
- S1-04 protected routes and session states.
- Start S1-05 Firebase rules.
- Define test fixtures and acceptance-test data.

**Week 1 checkpoint:** A new `@cit.edu` user can register, verify, sign in, and reach the protected dashboard; an unverified or logged-out user cannot.

### Week 2: Quest marketplace vertical slice

- Complete S1-05 security rules.
- S1-06 Post a Quest validation and persistence.
- S1-07 available Quest query/list.
- S1-08 Quest details.
- S1-09 expiry contract and countdown.
- Start S1-10 shared validation at the data boundary.

**Week 2 checkpoint:** A verified user can post a Quest and a second verified user can see and inspect it while it is still available.

### Week 3: Hardening and release gate

- Finish S1-10 shared validation.
- S1-11 automated baseline tests.
- S1-12 responsive/accessibility pass.
- Fix security-rule and unauthorized-access findings.
- Optional S1-13 attachment polish and S1-14 QA fixtures.
- Run build, lint, and the manual acceptance test.

**Week 3 checkpoint:** The core slice passes functional, security, responsive, and regression checks with no known blocker.

## Sprint 1 Definition of Done

- A verified `@cit.edu` user can register, log in, and access protected pages.
- An unverified user cannot post or browse protected Quest data.
- A verified user can create a Quest with every required SRS field.
- Another verified user can browse and view that Quest.
- The requester cannot be presented as an eligible Quest Runner for their own Quest.
- Quests older than 30 minutes are not treated as available.
- Firestore and Storage rules reject unauthorized reads/writes and client-controlled ownership/status changes.
- Loading, empty, error, expired, and unauthorized states are usable on mobile and desktop.
- Automated checks and the manual acceptance flow pass; `npm run lint` and `npm run build` complete successfully.

## Sprint 1 Risks and Decisions

- **Email policy:** The SRS says `@cit.edu` only. The current UI allows Gmail for testing, so testing support must be explicitly isolated and must not ship as the production default.
- **Expiration:** Filtering expired records in the client is not sufficient for trust. The canonical rule must be shared with future acceptance logic, and server-side enforcement belongs in the next slice that introduces acceptance.
- **Acceptance race condition:** Sprint 1 does not implement acceptance, but Sprint 2 must use a server-side transaction or equivalent atomic operation so two runners cannot claim one Quest.
- **Sensitive data:** Passwords remain in Firebase Authentication only; Firestore stores profile and marketplace data required for the workflow.
- **Payment:** Sprint 1 displays COD as the payment method but does not process or confirm money.

## Sprint 2: Accepted Quest Workflow

### Sprint goal

Deliver the first complete collaboration slice after marketplace discovery: one verified Quest Runner can safely accept an available Quest, the Quest becomes unavailable to everyone else, both users can see the correct role-specific status, and they can communicate and coordinate the meet-up.

Sprint 2 starts from the current repository reality: the acceptance, active Quest, My Requests, and Messenger screens are present as prototypes, but their data is mocked and acceptance is simulated in the browser. The sprint is complete only when these flows are backed by Firebase and protected by server-side rules.

### Sprint 2 delivery board

#### Done

- Acceptance/detail UI concept and redirect to an active Quest route.
- Active Quest UI concept with requester information, status, location, COD, and Messenger entry points.
- My Requests UI concept with active, completed, expired, and cancelled tabs.
- Messenger UI concept with message composer, attachment control, and report entry point.
- Quest model already contains `questRunnerId`, `acceptedAt`, and status values needed for this workflow.

#### In Progress

- Quest detail acceptance is simulated with a local delay and does not update Firestore.
- Active Quest uses hard-coded Quest and requester data.
- My Requests uses hard-coded request records rather than the signed-in user's Quests.
- Messenger stores messages only in component state and is not restricted by Quest participation.
- Firestore update rules currently allow broad requester/runner updates and do not enforce valid status transitions.

#### In Review

- Sprint 1 expiration and verified-user rules, because Sprint 2 acceptance depends on them.
- Quest status model and naming, especially the transition from `available` to `accepted` and `in_progress`.
- Whether Messenger attachments are included in Sprint 2 or deferred until the attachment policy is finalized.

#### Ready

- Add a server-side or callable acceptance operation using a Firestore transaction.
- Reject self-acceptance, unverified users, expired Quests, and already-accepted Quests.
- Replace active Quest and My Requests mock data with user-scoped Firestore queries.
- Add requester and runner actions for valid status transitions.
- Add Quest-scoped messages with participant-only read/write access.
- Add meet-up coordination fields and display them consistently in Quest details and Messenger.
- Add race-condition, authorization, and status-transition tests.

### Sprint 2 boundaries

**In scope**

- Atomic Quest acceptance and one-runner assignment.
- Available -> Accepted -> In Progress transitions.
- Requester and Quest Runner role views.
- My Requests backed by real Quest records.
- Messenger available only after acceptance and only to the two Quest participants.
- Meet-up location/time coordination through Quest details and Messenger.
- Expired Quest rejection at acceptance time.
- Firestore rules, error handling, and focused integration/manual testing.

**Out of scope for Sprint 2**

- Completion confirmation and COD acknowledgement.
- Ratings and feedback.
- Reports, blocking, notifications, Quest history, and administrator tools.
- Online payments or third-party delivery integration.
- Production-grade Messenger attachment uploads unless the team finishes the storage policy early.

## Sprint 2 Backlog

Commit to the `P0` items in order. The UI prototypes are not counted as completed workflow items until they read and write the real data source.

| ID | Status | Priority | Backlog item | Acceptance criteria | Estimate |
| --- | --- | --- | --- | --- | ---: |
| S2-01 | Ready | P0 | Define the accepted Quest contract | Quest status values, participant fields, timestamps, and allowed transitions are documented and represented consistently in shared types and Firestore data. | 2 pts |
| S2-02 | Ready | P0 | Implement atomic Quest acceptance | A verified non-requester can accept only an available, unexpired Quest; a transaction assigns exactly one runner, records `acceptedAt`, and makes the Quest unavailable to other runners. | 8 pts |
| S2-03 | In Review | P0 | Lock acceptance with Firestore rules | Client writes cannot assign themselves, overwrite the runner, skip status transitions, alter requester/reward/expiry fields, or update another user's Quest. | 5 pts |
| S2-04 | Ready | P0 | Handle acceptance conflicts and expiry | Two simultaneous acceptance attempts produce one success and one clear conflict; expired or missing Quests show a recoverable error and remain unavailable. | 3 pts |
| S2-05 | In Progress | P0 | Replace active Quest mock data | The active Quest page loads the accepted Quest and participant profiles from Firestore, displays the correct role, and handles loading, missing, unauthorized, and stale states. | 5 pts |
| S2-06 | In Progress | P0 | Replace My Requests mock data | Requesters can view their posted Quests and runners can view accepted Quests, with tabs/statuses derived from real records rather than local fixtures. | 5 pts |
| S2-07 | Ready | P0 | Add status transition actions | Authorized participants can move Accepted -> In Progress according to the agreed workflow; unauthorized users and invalid transitions are rejected and explained. | 3 pts |
| S2-08 | Ready | P0 | Build Quest-scoped Messenger | After acceptance, only the requester and assigned runner can read or send messages for that Quest; messages persist with sender and server timestamp. | 8 pts |
| S2-09 | Ready | P1 | Add meet-up coordination | Participants can view and update the agreed meet-up point/time through the Quest workflow, with ownership and participant checks. | 3 pts |
| S2-10 | Ready | P1 | Add Sprint 2 tests and acceptance QA | Cover transaction races, self-acceptance, expiry, authorization, valid status changes, participant-only messaging, and a two-account manual flow. | 5 pts |

**Suggested Sprint 2 capacity:** 47 points listed, with approximately 42 points of implementation work. Commit to S2-01 through S2-08; treat S2-09 and S2-10 as pull-in work or reduce scope by deferring meet-up editing to Sprint 3 and keeping it read-only.

### Suggested three-week breakdown for Sprint 2

#### Week 1: Acceptance foundation

- S2-01 accepted Quest contract.
- S2-02 atomic acceptance operation.
- S2-03 Firestore rule hardening.
- S2-04 conflict and expiration handling.
- Transaction and authorization tests.

**Week 1 checkpoint:** Two verified accounts can attempt to accept the same Quest; exactly one becomes the runner, and the Quest is no longer available.

#### Week 2: Real role views

- S2-05 real active Quest data.
- S2-06 real My Requests data.
- S2-07 status transition actions.
- Loading, stale, missing, and unauthorized states.

**Week 2 checkpoint:** The requester and runner see the same Quest with different authorized actions, and the Quest can move from Accepted to In Progress.

#### Week 3: Collaboration and release gate

- S2-08 Quest-scoped Messenger.
- S2-09 meet-up coordination if capacity allows.
- S2-10 integration tests and two-account QA.
- Responsive/accessibility pass for accepted Quest and Messenger screens.
- Lint and build validation.

**Week 3 checkpoint:** The assigned requester and runner can open the accepted Quest, exchange persistent messages, coordinate the meet-up, and remain blocked from each other's unrelated Quest data.

### Sprint 2 definition of done

- A verified student cannot accept their own Quest.
- An expired, missing, or already-accepted Quest cannot be accepted.
- Concurrent acceptance attempts result in one assigned runner only.
- Acceptance is persisted in Firestore with an auditable timestamp.
- Available Quest queries no longer return an accepted Quest.
- The requester and runner see the correct role-specific Quest view.
- Accepted Quest records appear in the correct My Requests views.
- Messenger is inaccessible before acceptance and inaccessible to non-participants.
- Messages persist with sender identity and server timestamps.
- Accepted -> In Progress is enforced for authorized participants only.
- Focused tests, manual two-account QA, lint, and build pass.

### Sprint 2 risks and decisions

- **Atomicity:** Acceptance must use a transaction or an equivalent server-side operation. A client-side read followed by update is not sufficient.
- **Trust boundary:** Firestore rules must validate immutable Quest fields and allowed transitions; hiding buttons is not authorization.
- **Message privacy:** Quest messages should be stored under a Quest-scoped collection and restricted to the requester and assigned runner.
- **Expiration:** Acceptance must check `expiresAt` at write time, not only rely on the marketplace countdown.
- **Scope control:** Existing screens contain completion/reporting affordances, but those actions belong to Sprint 3 until their persistence and authorization are implemented.

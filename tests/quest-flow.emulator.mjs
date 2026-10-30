import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { spawn } from "node:child_process";
import { initializeApp as adminApp, deleteApp as deleteAdminApp } from "firebase-admin/app";
import { getAuth as adminAuth } from "firebase-admin/auth";
import { getFirestore as adminFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { count, sum, getAggregateFromServer, getDocs, where, orderBy, limit, startAfter, collection, connectFirestoreEmulator, doc, getDoc, getFirestore, onSnapshot, query, setDoc, terminate } from "firebase/firestore";

// Never allow this suite to touch the live project.
const projectId = "demo-questgo-test";
if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8085" || process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9095" || process.env.FIREBASE_STORAGE_EMULATOR_HOST !== "127.0.0.1:9195") {
  throw new Error("Run through firebase emulators:exec with firebase.emulator.json. Live Firebase is forbidden.");
}
const admin = adminApp({ projectId }, "workflow-test");
const db = adminFirestore(admin);
const auth = adminAuth(admin);
const clients = [];
const tokens = {};
let server;
let serverOutput = "";
const endpoint = "http://127.0.0.1:3105";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function client(uid, verified = true) {
  const app = initializeApp({ projectId, apiKey: "emulator-key" }, `${uid}-${clients.length}`);
  const store = getFirestore(app);
  connectFirestoreEmulator(store, "127.0.0.1", 8085, { mockUserToken: { sub: uid, email: `${uid}@cit.edu`, email_verified: verified } });
  clients.push({ app, store });
  return store;
}

async function request(uid, path, body) {
  const response = await fetch(`${endpoint}/api/quests${path}`, { method: "POST",
    headers: { "Content-Type": "application/json", ...(tokens[uid] ? { Authorization: `Bearer ${tokens[uid]}` } : {}) }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

const input = { fundingMethod: "no_purchase", purchaseBudget: 0, title: "Pick up my notes", description: "Meet at the main entrance.", category: "Pickup", reward: 30,
  requirements: { items: "Class notes", collection: "Collect from the library desk" }, location: "Library", meetUpPoint: "Main Entrance", preferredTime: "4:30 PM" };

before(async () => {
  for (const uid of ["requester", "runner1", "runner2", "outsider", "unverified"]) {
    await auth.createUser({ uid, email: `${uid}@cit.edu`, displayName: uid, emailVerified: uid !== "unverified", password: "Emulator-only-123!" });
    const response = await fetch("http://127.0.0.1:9095/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-key", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: `${uid}@cit.edu`, password: "Emulator-only-123!", returnSecureToken: true }),
    });
    const body = await response.json();
    assert.ok(body.idToken); tokens[uid] = body.idToken;
  }
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3105"], {
    env: { ...process.env, FIREBASE_PROJECT_ID: projectId, GCLOUD_PROJECT: projectId, FIREBASE_STORAGE_BUCKET: "demo-questgo-test.appspot.com" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  server.stdout.on("data", (data) => { serverOutput += data; });
  server.stderr.on("data", (data) => { serverOutput += data; });
  for (let i = 0; i < 80; i++) {
    try { await fetch(`${endpoint}/api/quests`); return; } catch { await pause(250); }
  }
  throw new Error(`Test app did not start: ${serverOutput}`);
});

after(async () => {
  server?.kill();
  await Promise.all(clients.map(async ({ app, store }) => { await terminate(store); await deleteApp(app); }));
  await db.terminate();
  await deleteAdminApp(admin);
});

test("two-account quest lifecycle, races, live messages, and security boundaries", { timeout: 90000 }, async () => {
  assert.equal((await request("missing", "", input)).status, 401);
  assert.equal((await request("unverified", "", input)).status, 403);
  assert.equal((await request("requester", "", { ...input, reward: -1 })).status, 400);
  const attempts = await Promise.all([request("requester", "", input), request("requester", "", input)]);
  assert.deepEqual(attempts.map((item) => item.status).sort(), [201, 409]);
  const id = attempts.find((item) => item.status === 201).body.id;
  const ref = db.doc(`quests/${id}`);
  const initial = (await ref.get()).data();
  assert.equal(initial.expiresAt.toMillis() - initial.createdAt.toMillis(), 30 * 60 * 1000);
  assert.equal((await request("requester", `/${id}`, { action: "accept" })).status, 403);
  assert.equal((await request("requester", `/${id}/messages`, { text: "too early" })).status, 403);
  const acceptance = await Promise.all([request("runner1", `/${id}`, { action: "accept" }), request("runner2", `/${id}`, { action: "accept" })]);
  assert.deepEqual(acceptance.map((item) => item.status).sort(), [200, 409]);
  const runner = (await ref.get()).data().questRunnerId;
  assert.equal((await request("requester", "", input)).status, 409);
  assert.equal((await request("outsider", `/${id}`, { action: "start" })).status, 403);
  assert.equal((await request("outsider", `/${id}/messages`, { text: "intrusion" })).status, 403);

  const requesterDb = client("requester");
  const runnerDb = client(runner);
  const outsiderDb = client("outsider");
  const unverifiedDb = client("unverified", false);
  await assert.rejects(getDoc(doc(unverifiedDb, "quests", id)), { code: "permission-denied" });
  await assert.rejects(setDoc(doc(requesterDb, "quests", "forged"), { ...input, requesterId: "requester", status: "available" }), { code: "permission-denied" });
  await assert.rejects(setDoc(doc(requesterDb, "quests", id), { questRunnerId: "outsider" }, { merge: true }), { code: "permission-denied" });
  await assert.rejects(setDoc(doc(requesterDb, "requesterLocks", "requester"), { questId: "forged" }), { code: "permission-denied" });

  function waitForMessage(store, text) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { stop(); reject(new Error("Realtime delivery timed out")); }, 15000);
      const stop = onSnapshot(query(collection(store, "quests", id, "messages")), (snapshot) => {
        if (snapshot.docs.some((record) => record.data().text === text)) { clearTimeout(timer); stop(); resolve(); }
      }, (error) => { clearTimeout(timer); stop(); reject(error); });
    });
  }
  const received = Promise.all([waitForMessage(requesterDb, "Hello runner"), waitForMessage(runnerDb, "Hello runner")]);
  const message = await request("requester", `/${id}/messages`, { text: "Hello runner", senderId: "outsider" });
  assert.equal(message.status, 201);
  await received;
  const messageRef = `quests/${id}/messages/${message.body.id}`;
  assert.equal((await db.doc(messageRef).get()).data().senderId, "requester");
  const inboxPath = `users/${runner}/questInbox/${id}`;
  assert.equal((await getDoc(doc(runnerDb, inboxPath))).data().messageId, message.body.id);
  await assert.rejects(getDoc(doc(outsiderDb, inboxPath)), { code: "permission-denied" });
  await assert.rejects(getDoc(doc(requesterDb, inboxPath)), { code: "permission-denied" });
  await assert.rejects(setDoc(doc(runnerDb, inboxPath), { messageId: "forged" }), { code: "permission-denied" });
  await assert.rejects(getDoc(doc(outsiderDb, messageRef)), { code: "permission-denied" });
  await assert.rejects(setDoc(doc(runnerDb, `quests/${id}/messages/forged`), { senderId: "requester", text: "forged" }), { code: "permission-denied" });
  const replyReceived = waitForMessage(requesterDb, "On my way");
  assert.equal((await request(runner, `/${id}/messages`, { text: "On my way" })).status, 201);
  await replyReceived;
  assert.equal((await request(runner, `/${id}`, { action: "start" })).status, 200);
  assert.equal((await request("requester", `/${id}`, { action: "complete" })).status, 403);
  assert.equal((await request(runner, `/${id}`, { action: "request-completion" })).status, 409);
  assert.equal((await request(runner, `/${id}`, { action: "commit" })).status, 200);
  assert.equal((await request(runner, `/${id}`, { action: "request-completion" })).status, 200);
  assert.equal((await request(runner, `/${id}`, { action: "request-cancellation" })).status, 200);
  assert.equal((await ref.get()).data().cancellationRequestedBy, runner);
  assert.equal((await request(runner, `/${id}`, { action: "approve-cancellation" })).status, 409);
  assert.equal((await request("outsider", `/${id}`, { action: "approve-cancellation" })).status, 409);
  assert.equal((await request("requester", `/${id}`, { action: "complete" })).status, 409);
  assert.equal((await request("requester", `/${id}`, { action: "decline-cancellation" })).status, 200);
  assert.equal((await ref.get()).data().cancellationRequestedBy, undefined);
  assert.equal((await request("requester", `/${id}`, { action: "request-cancellation" })).status, 200);
  assert.equal((await request("requester", `/${id}`, { action: "withdraw-cancellation" })).status, 200);
  assert.equal((await request(runner, `/${id}`, { action: "complete" })).status, 403);
  assert.equal((await request("requester", `/${id}`, { action: "complete", receiptConfirmed: true, paymentConfirmed: true })).status, 409);
  assert.equal((await request(runner, `/${id}`, { action: "acknowledge-payment" })).status, 200);
  assert.equal((await request("requester", `/${id}`, { action: "complete", receiptConfirmed: true, paymentConfirmed: true })).status, 200);
  assert.equal((await request(runner, `/${id}/messages`, { text: "closed" })).status, 403);
  const next = await request("requester", "", input);
  assert.equal(next.status, 201);
  const cancelId = next.body.id;
  assert.equal((await request(runner, `/${cancelId}`, { action: "accept" })).status, 200);
  const cancelMessage = await request(runner, `/${cancelId}/messages`, { text: "Please cancel" });
  assert.equal(cancelMessage.status, 201);
  assert.equal((await request("requester", `/${cancelId}`, { action: "request-cancellation" })).status, 200);
  assert.equal((await request("requester", "", input)).status, 409);
  assert.equal((await request(runner, `/${cancelId}`, { action: "approve-cancellation" })).status, 200);
  assert.equal((await db.doc(`quests/${cancelId}`).get()).data().status, "cancelled");
  assert.equal((await request(runner, `/${cancelId}/messages`, { text: "closed" })).status, 403);
  const cancelledMessagePath = `quests/${cancelId}/messages/${cancelMessage.body.id}`;
  assert.equal((await getDoc(doc(requesterDb, cancelledMessagePath))).data().text, "Please cancel");
  await assert.rejects(getDoc(doc(outsiderDb, cancelledMessagePath)), { code: "permission-denied" });
  const unclaimed = await request("requester", "", input);
  assert.equal(unclaimed.status, 201);
  assert.equal((await request("requester", `/${unclaimed.body.id}`, { action: "cancel" })).status, 200);
  const expiring = await request("requester", "", input);
  assert.equal(expiring.status, 201);
  await db.doc(`quests/${expiring.body.id}`).update({ expiresAt: Timestamp.fromMillis(Date.now() - 1000) });
  assert.equal((await request(runner, `/${expiring.body.id}`, { action: "accept" })).status, 409);
  assert.equal((await request("requester", "", input)).status, 201);

  const archiveQuery = [where("requesterId", "==", "requester"), where("status", "in", ["completed", "cancelled"]), orderBy("createdAt", "desc")];
  const firstPage = await getDocs(query(collection(requesterDb, "quests"), ...archiveQuery, limit(2)));
  assert.equal(firstPage.size, 2);
  const secondPage = await getDocs(query(collection(requesterDb, "quests"), ...archiveQuery, startAfter(firstPage.docs.at(-1)), limit(2)));
  assert.ok(secondPage.size > 0);
  assert.ok(secondPage.docs.every((record) => !firstPage.docs.some((first) => first.id === record.id)));
  const totals = await getAggregateFromServer(query(collection(runnerDb, "quests"), where("questRunnerId", "==", runner), where("status", "==", "completed")), { completed: count(), earnings: sum("reward") });
  assert.deepEqual(totals.data(), { completed: 1, earnings: 30 });
  const recentClosed = await getDocs(query(collection(requesterDb, "quests"), where("requesterId", "==", "requester"), where("status", "in", ["completed", "cancelled"]), orderBy("updatedAt", "desc"), limit(3)));
  assert.equal(recentClosed.size, 3);

  // Existing records from before the lock rollout still enforce the restriction.
  await db.doc("quests/legacy").set({ ...input, requesterId: "outsider", status: "accepted", expiresAt: Timestamp.now() });
  assert.equal((await request("outsider", "", input)).status, 409);
});


test("printing upload is required, preserved, and private to participants", async () => {
  const printing = { ...input, fundingMethod: "prepaid", purchaseBudget: 65, vendorInstructions: "Requester pays the campus print shop directly", category: "Printing", title: "Print my module", requirements: { paperSize: "A4", copies: "2", pages: "All pages", color: "Black and white", sides: "Single-sided" } };
  assert.equal((await request("runner2", "", printing)).status, 400);
  async function upload(content, type, name) {
    const body = new FormData(); body.set("quest", JSON.stringify(printing)); body.set("file", new Blob([content], { type }), name);
    const response = await fetch(endpoint + "/api/quests", { method: "POST", headers: { Authorization: `Bearer ${tokens.runner2}` }, body });
    return { status: response.status, body: await response.json() };
  }
  assert.equal((await upload("not a PDF", "application/pdf", "fake.pdf")).status, 400);
  const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXZkAAAAASUVORK5CYII=", "base64");
  const created = await upload(bytes, "image/png", "page.png");
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const id = created.body.id;
  const download = (uid) => fetch(`${endpoint}/api/quests/${id}/file`, { headers: tokens[uid] ? { Authorization: `Bearer ${tokens[uid]}` } : {} });
  assert.equal((await download("missing")).status, 401);
  assert.equal((await download("outsider")).status, 403);
  assert.equal((await download("requester")).status, 403);
  const ownerFile = await download("runner2");
  assert.equal(ownerFile.status, 200);
  assert.deepEqual(Buffer.from(await ownerFile.arrayBuffer()), bytes);
  assert.equal((await request("requester", `/${id}`, { action: "accept" })).status, 200);
  assert.equal((await download("requester")).status, 200);
});


test("funding, withdrawal, replacement privacy, settlement, deadlines, ratings and administrator boundaries", { timeout: 90000 }, async () => {
  for (const id of ["recovery-requester", "recovery-runner", "recovery-next", "recovery-admin"]) {
    await auth.createUser({ uid: id, email: id + "@cit.edu", displayName: id, emailVerified: true, password: "Emulator-only-123!" });
    if (id === "recovery-admin") await auth.setCustomUserClaims(id, { admin: true });
    const response = await fetch("http://127.0.0.1:9095/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: id + "@cit.edu", password: "Emulator-only-123!", returnSecureToken: true }) });
    tokens[id] = (await response.json()).idToken;
  }
  const requester = "recovery-requester", runner = "recovery-runner", next = "recovery-next", adminId = "recovery-admin";
  const created = await request(requester, "", input);
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.equal((await request(runner, "/" + id, { action: "accept" })).status, 200);
  const oldMessage = await request(runner, "/" + id + "/messages", { text: "Old assignment private message" });
  assert.equal(oldMessage.status, 201);
  assert.equal((await request(runner, "/" + id, { action: "leave", reason: "I cannot continue this errand" })).status, 200);
  assert.equal((await db.doc("quests/" + id).get()).data().status, "cancelled");
  const reposts = await Promise.all([request(requester, "/" + id, { action: "repost" }), request(requester, "/" + id, { action: "repost" })]);
  assert.deepEqual(reposts.map((r) => r.status).sort(), [200, 409]);
  const replacementId = reposts.find((r) => r.status === 200).body.id;
  assert.equal((await request(next, "/" + replacementId, { action: "accept" })).status, 200);
  await assert.rejects(getDoc(doc(client(next), "quests", id, "messages", oldMessage.body.id)), { code: "permission-denied" });
  assert.equal((await request(requester, "/" + replacementId, { action: "open-issue", reason: "Runner is not responding" })).status, 200);
  assert.equal((await request(next, "/" + replacementId, { action: "start" })).status, 409);
  assert.equal((await request(requester, "/" + replacementId, { action: "escalate-issue" })).status, 409);
  await db.doc("quests/" + replacementId).update({ issueDeadline: Timestamp.fromMillis(Date.now() - 1) });
  assert.equal((await request(requester, "/" + replacementId, { action: "escalate-issue" })).status, 200);
  assert.equal((await db.doc("quests/" + replacementId).get()).data().status, "cancelled");
  const abonoInput = { ...input, fundingMethod: "abono", purchaseBudget: 150 };
  const abono = await request(requester, "", abonoInput);
  assert.equal(abono.status, 201);
  const abonoId = abono.body.id;
  assert.equal((await request(runner, "/" + abonoId, { action: "accept" })).status, 400);
  assert.equal((await request(runner, "/" + abonoId, { action: "accept", acceptAdvance: true })).status, 200);
  assert.equal((await request(runner, "/" + abonoId, { action: "start" })).status, 200);
  assert.equal((await request(runner, "/" + abonoId, { action: "commit" })).status, 409);
  assert.equal((await request(runner, "/" + abonoId, { action: "record-expense", amount: 140, evidence: "Campus store quote 001" })).status, 200);
  assert.equal((await request(runner, "/" + abonoId, { action: "approve-expense" })).status, 409);
  assert.equal((await request(requester, "/" + abonoId, { action: "approve-expense" })).status, 200);
  assert.equal((await request(runner, "/" + abonoId, { action: "commit" })).status, 200);
  assert.equal((await request(runner, "/" + abonoId, { action: "record-receipt", amount: 145, evidence: "Receipt 002" })).status, 400);
  assert.equal((await request(runner, "/" + abonoId, { action: "record-receipt", amount: 135, evidence: "Campus store receipt 002" })).status, 200);
  assert.equal((await request(requester, "/" + abonoId, { action: "leave", reason: "I cannot collect the supplies" })).status, 200);
  assert.equal((await db.doc("quests/" + abonoId).get()).data().status, "settlement");
  assert.equal((await request(runner, "/" + abonoId + "/messages", { text: "Please settle the purchase" })).status, 201);
  assert.equal((await request(requester, "/" + abonoId, { action: "repost" })).status, 409);
  const another = await request(requester, "", input);
  assert.equal(another.status, 201);
  const anotherId = another.body.id;
  async function adminRequest(uid, path = "", body) {
    const response = await fetch(endpoint + "/api/admin/quests" + path, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + tokens[uid], "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  }
  assert.equal((await adminRequest(requester)).status, 403);
  assert.equal((await adminRequest(requester, "", { id: abonoId, note: "Forged resolution", settlementVerified: true })).status, 403);
  assert.equal((await adminRequest(adminId)).status, 200);
  assert.equal((await adminRequest(adminId, "/" + abonoId)).status, 200);
  assert.equal((await adminRequest(adminId, "", { id: abonoId, note: "No verified settlement yet" })).status, 400);
  assert.equal((await adminRequest(adminId, "", { id: abonoId, note: "Both participants confirmed reimbursement and return of belongings.", settlementVerified: true })).status, 200);
  assert.equal((await request(next, "/" + anotherId, { action: "accept" })).status, 200);
  assert.equal((await request(next, "/" + anotherId, { action: "start" })).status, 200);
  assert.equal((await request(next, "/" + anotherId, { action: "commit" })).status, 200);
  assert.equal((await request(next, "/" + anotherId, { action: "request-completion" })).status, 200);
  assert.equal((await request(requester, "/" + anotherId, { action: "complete", receiptConfirmed: true, paymentConfirmed: true })).status, 409);
  assert.equal((await request(next, "/" + anotherId, { action: "acknowledge-payment" })).status, 200);
  assert.equal((await request(requester, "/" + anotherId, { action: "complete", receiptConfirmed: true, paymentConfirmed: true })).status, 200);
  const ratings = await Promise.all([request(requester, "/" + anotherId + "/rating", { rating: 5, reviewerId: "outsider" }), request(requester, "/" + anotherId + "/rating", { rating: 5 })]);
  assert.deepEqual(ratings.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await db.doc("users/" + next).get()).data().averageRating, 5);
  assert.equal((await request(runner, "/" + anotherId + "/rating", { rating: 1 })).status, 403);
});

test("reports are deduplicated and admin-only; blocks hide quests, stop acceptance both ways, and stay private", { timeout: 90000 }, async () => {
  for (const id of ["safety-requester", "safety-runner", "safety-other", "safety-admin"]) {
    await auth.createUser({ uid: id, email: id + "@cit.edu", displayName: id, emailVerified: true, password: "Emulator-only-123!" });
    if (id === "safety-admin") await auth.setCustomUserClaims(id, { admin: true });
    const response = await fetch("http://127.0.0.1:9095/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: id + "@cit.edu", password: "Emulator-only-123!", returnSecureToken: true }) });
    tokens[id] = (await response.json()).idToken;
  }
  const requester = "safety-requester", runner = "safety-runner", other = "safety-other", adminId = "safety-admin";
  async function call(uid, url, method = "POST", body) {
    const response = await fetch(endpoint + url, { method, headers: { Authorization: "Bearer " + tokens[uid], "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  }
  const created = await request(requester, "", input);
  assert.equal(created.status, 201);
  const id = created.body.id;

  // The requester has nobody to report until a runner accepts; invalid reports are rejected.
  assert.equal((await request(requester, "/" + id + "/report", { reason: "other", details: "Nobody here yet" })).status, 409);
  assert.equal((await request(other, "/" + id + "/report", { reason: "spam", details: "Prohibited listing text" })).status, 400);

  // Blocking is self-only, cannot target yourself, and the list is private to its owner.
  assert.equal((await call(other, "/api/users/" + other + "/block")).status, 400);
  assert.equal((await call(other, "/api/users/nobody-here/block")).status, 404);
  assert.equal((await call(other, "/api/users/" + requester + "/block")).status, 200);
  await assert.doesNotReject(getDoc(doc(client(other), "users", other, "blocks", requester)));
  await assert.rejects(getDoc(doc(client(requester), "users", other, "blocks", requester)));
  await assert.rejects(setDoc(doc(client(requester), "users", requester, "blocks", other), { blockedId: other }));
  await assert.rejects(getDocs(collection(client(adminId), "reports")));

  // Blocking stops acceptance in both directions without revealing who blocked whom.
  const blockedAccept = await request(other, "/" + id, { action: "accept" });
  assert.equal(blockedAccept.status, 403);
  assert.equal(blockedAccept.body.message, "You can't accept this quest.");
  assert.equal((await call(other, "/api/users/" + requester + "/block", "DELETE")).status, 200);
  assert.equal((await call(requester, "/api/users/" + other + "/block")).status, 200);
  assert.equal((await request(other, "/" + id, { action: "accept" })).status, 403);
  assert.equal((await call(requester, "/api/users/" + other + "/block", "DELETE")).status, 200);

  assert.equal((await request(runner, "/" + id, { action: "accept" })).status, 200);
  const reports = await Promise.all([
    request(requester, "/" + id + "/report", { reason: "no_show", details: "Runner stopped replying after accepting", block: true }),
    request(requester, "/" + id + "/report", { reason: "no_show", details: "Runner stopped replying after accepting", block: true }),
  ]);
  assert.deepEqual(reports.map((r) => r.status).sort(), [201, 409]);
  const reportId = reports.find((r) => r.status === 201).body.id;
  const stored = (await db.doc("reports/" + reportId).get()).data();
  assert.equal(stored.reporterId, requester);
  assert.equal(stored.reportedId, runner);
  assert.ok((await db.doc(`users/${requester}/blocks/${runner}`).get()).exists);

  // Only claim-authorized admins can list or resolve; suspension disables the account.
  assert.equal((await call(requester, "/api/admin/reports", "GET")).status, 403);
  assert.equal((await call(requester, "/api/admin/reports", "POST", { id: reportId, outcome: "dismissed", note: "Forged dismissal attempt" })).status, 403);
  const queue = await call(adminId, "/api/admin/reports", "GET");
  assert.equal(queue.status, 200);
  assert.ok(queue.body.reports.some((r) => r.id === reportId));
  assert.equal((await call(adminId, "/api/admin/reports", "POST", { id: reportId, outcome: "suspended", note: "ok" })).status, 400);
  assert.equal((await call(adminId, "/api/admin/reports", "POST", { id: reportId, outcome: "suspended", note: "Repeated abandonment confirmed in chat logs" })).status, 200);
  assert.equal((await call(adminId, "/api/admin/reports", "POST", { id: reportId, outcome: "dismissed", note: "Second decision should fail" })).status, 409);
  assert.equal((await auth.getUser(runner)).disabled, true);
  assert.equal((await request(runner, "/" + id + "/messages", { text: "still here?" })).status, 401);
});

test("runner location is private to participants, rate-limited, and deleted when the quest ends", { timeout: 60000 }, async () => {
  for (const id of ["map-requester", "map-runner", "map-outsider"]) {
    await auth.createUser({ uid: id, email: id + "@cit.edu", displayName: id, emailVerified: true, password: "Emulator-only-123!" });
    const response = await fetch("http://127.0.0.1:9095/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: id + "@cit.edu", password: "Emulator-only-123!", returnSecureToken: true }) });
    tokens[id] = (await response.json()).idToken;
  }
  const requester = "map-requester", runner = "map-runner", outsider = "map-outsider";
  const here = { lat: 10.2957503, lng: 123.8803769, accuracy: 8 };
  async function locate(uid, id, body, method = "POST") {
    const response = await fetch(`${endpoint}/api/quests/${id}/location`, { method, headers: { Authorization: "Bearer " + tokens[uid], "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return response.status;
  }
  const id = (await request(requester, "", input)).body.id;
  assert.equal(await locate(runner, id, here), 403); // not accepted yet
  assert.equal((await request(runner, "/" + id, { action: "accept" })).status, 200);
  assert.equal(await locate(requester, id, here), 403);
  assert.equal(await locate(outsider, id, here), 403);
  assert.equal(await locate(runner, id, { lat: 200, lng: 0 }), 400);
  assert.equal(await locate(runner, id, here), 200);
  assert.equal(await locate(runner, id, here), 429);

  const tracking = (uid) => getDoc(doc(client(uid), "quests", id, "tracking", "runner"));
  assert.equal((await tracking(requester)).data().lat, 10.29575);
  assert.ok((await tracking(runner)).exists());
  await assert.rejects(tracking(outsider));
  await assert.rejects(setDoc(doc(client(runner), "quests", id, "tracking", "runner"), here));

  assert.equal(await locate(requester, id, undefined, "DELETE"), 403);
  assert.equal(await locate(runner, id, undefined, "DELETE"), 200);
  assert.equal((await db.doc(`quests/${id}/tracking/runner`).get()).exists, false);
  await pause(5100);
  assert.equal(await locate(runner, id, here), 200);
  assert.equal((await request(runner, "/" + id, { action: "leave", reason: "I can no longer do this quest" })).status, 200);
  assert.equal((await db.doc(`quests/${id}/tracking/runner`).get()).exists, false);
  assert.equal(await locate(runner, id, here), 403);
});

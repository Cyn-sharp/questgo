import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { spawn } from "node:child_process";
import { initializeApp as adminApp, deleteApp as deleteAdminApp } from "firebase-admin/app";
import { getAuth as adminAuth } from "firebase-admin/auth";
import { getFirestore as adminFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { initializeApp, deleteApp } from "firebase/app";
import { count, sum, getAggregateFromServer, getDocs, where, orderBy, limit, startAfter, collection, connectFirestoreEmulator, doc, getDoc, getFirestore, onSnapshot, query, setDoc, terminate, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

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
    env: { ...process.env, CRON_SECRET: "test-cron-secret", FIREBASE_PROJECT_ID: projectId, GCLOUD_PROJECT: projectId, FIREBASE_STORAGE_BUCKET: "demo-questgo-test.appspot.com" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
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
  // The recipient may mark only the latest message read, and change nothing else.
  await assert.rejects(updateDoc(doc(runnerDb, inboxPath), { readMessageId: "older", readAt: serverTimestamp() }), { code: "permission-denied" });
  await assert.rejects(updateDoc(doc(runnerDb, inboxPath), { readMessageId: message.body.id, readAt: serverTimestamp(), title: "forged" }), { code: "permission-denied" });
  await assert.rejects(updateDoc(doc(runnerDb, inboxPath), { readMessageId: message.body.id, readAt: new Date(0) }), { code: "permission-denied" });
  await assert.rejects(updateDoc(doc(requesterDb, inboxPath), { readMessageId: message.body.id, readAt: serverTimestamp() }), { code: "permission-denied" });
  await assert.rejects(updateDoc(doc(outsiderDb, inboxPath), { readMessageId: message.body.id, readAt: serverTimestamp() }), { code: "permission-denied" });
  await assert.rejects(deleteDoc(doc(runnerDb, inboxPath)), { code: "permission-denied" });
  await updateDoc(doc(runnerDb, inboxPath), { readMessageId: message.body.id, readAt: serverTimestamp() });
  assert.equal((await getDoc(doc(runnerDb, inboxPath))).data().readMessageId, message.body.id);
  await assert.rejects(getDoc(doc(outsiderDb, messageRef)), { code: "permission-denied" });
  await assert.rejects(setDoc(doc(runnerDb, `quests/${id}/messages/forged`), { senderId: "requester", text: "forged" }), { code: "permission-denied" });
  const replyReceived = waitForMessage(requesterDb, "On my way");
  assert.equal((await request(runner, `/${id}/messages`, { text: "On my way" })).status, 201);
  await replyReceived;
  // A newer message replaces the inbox entry, so it shows as unread again.
  await pause(1100);
  const followUp = await request("requester", `/${id}/messages`, { text: "See you there" });
  assert.equal(followUp.status, 201);
  const unreadAgain = (await getDoc(doc(runnerDb, inboxPath))).data();
  assert.equal(unreadAgain.messageId, followUp.body.id);
  assert.equal(unreadAgain.readMessageId, undefined);
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

test("S2-10 acceptance contract: missing quests, audit timestamp, marketplace removal, role views, and Accepted -> In Progress guards", { timeout: 60000 }, async () => {
  for (const id of ["s2-requester", "s2-runner", "s2-outsider"]) {
    await auth.createUser({ uid: id, email: id + "@cit.edu", displayName: id, emailVerified: true, password: "Emulator-only-123!" });
    const response = await fetch("http://127.0.0.1:9095/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: id + "@cit.edu", password: "Emulator-only-123!", returnSecureToken: true }) });
    tokens[id] = (await response.json()).idToken;
  }
  const requester = "s2-requester", runner = "s2-runner", outsider = "s2-outsider";

  // A missing Quest cannot be accepted, started, or messaged.
  assert.equal((await request(runner, "/does-not-exist", { action: "accept" })).status, 404);
  assert.equal((await request(runner, "/does-not-exist", { action: "start" })).status, 404);
  assert.equal((await request(runner, "/does-not-exist/messages", { text: "hello?" })).status, 404);

  const created = await request(requester, "", input);
  assert.equal(created.status, 201);
  const id = created.body.id;
  const ref = db.doc(`quests/${id}`);
  const runnerDb = client(runner);
  const requesterDb = client(requester);
  const available = async () => (await getDocs(query(collection(runnerDb, "quests"), where("status", "==", "available")))).docs.map((d) => d.id);
  assert.ok((await available()).includes(id));

  // Unverified accounts and non-participants are blocked before acceptance, including messaging.
  assert.equal((await request("unverified", `/${id}`, { action: "accept" })).status, 403);
  assert.equal((await request(runner, `/${id}`, { action: "start" })).status, 403);
  assert.equal((await request(runner, `/${id}/messages`, { text: "too early" })).status, 403);
  await assert.rejects(getDocs(collection(runnerDb, "quests", id, "messages")), { code: "permission-denied" });

  // Acceptance is persisted with the runner and an auditable server timestamp.
  const before = Date.now();
  assert.equal((await request(runner, `/${id}`, { action: "accept" })).status, 200);
  const accepted = (await ref.get()).data();
  assert.equal(accepted.status, "accepted");
  assert.equal(accepted.questRunnerId, runner);
  assert.ok(accepted.acceptedAt instanceof Timestamp);
  assert.ok(accepted.acceptedAt.toMillis() >= before - 5000);
  assert.equal(accepted.requesterId, requester);

  // The accepted Quest leaves the marketplace and cannot be accepted again.
  assert.ok(!(await available()).includes(id));
  assert.equal((await request(outsider, `/${id}`, { action: "accept" })).status, 409);
  assert.equal((await request(runner, `/${id}`, { action: "accept" })).status, 409);

  // Each participant finds the Quest in their own My Requests / Active Quest view.
  const mine = await getDocs(query(collection(requesterDb, "quests"), where("requesterId", "==", requester), where("status", "in", ["available", "accepted", "in_progress"])));
  assert.deepEqual(mine.docs.map((d) => d.id), [id]);
  const running = await getDocs(query(collection(runnerDb, "quests"), where("questRunnerId", "==", runner)));
  assert.deepEqual(running.docs.map((d) => d.id), [id]);

  // Accepted -> In Progress: only the assigned runner, only once, never by the requester or an outsider.
  assert.equal((await request(requester, `/${id}`, { action: "start" })).status, 403);
  assert.equal((await request(outsider, `/${id}`, { action: "start" })).status, 403);
  assert.equal((await request(runner, `/${id}`, { action: "complete" })).status, 403);
  assert.equal((await request(runner, `/${id}`, { action: "start" })).status, 200);
  assert.equal((await ref.get()).data().status, "in_progress");
  assert.equal((await request(runner, `/${id}`, { action: "start" })).status, 403);
  assert.equal((await request(requester, `/${id}`, { action: "cancel" })).status, 403);

  // Clients cannot bypass the server to change the status or runner directly.
  await assert.rejects(setDoc(doc(runnerDb, "quests", id), { status: "completed" }, { merge: true }), { code: "permission-denied" });
  await assert.rejects(setDoc(doc(requesterDb, "quests", id), { questRunnerId: outsider, status: "accepted" }, { merge: true }), { code: "permission-denied" });
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

test("blocks stop chat, suspension closes the user's quests, and the expiry sweep is secured and accurate", { timeout: 90000 }, async () => {
  const ids = { req: "hx-requester", run: "hx-runner", run2: "hx-runner2", other: "hx-other", admin: "hx-admin" };
  for (const uid of Object.values(ids)) {
    await auth.createUser({ uid, email: uid + "@cit.edu", displayName: uid, emailVerified: true, password: "Emulator-only-123!" });
    if (uid === ids.admin) await auth.setCustomUserClaims(uid, { admin: true });
    const response = await fetch("http://127.0.0.1:9095/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: uid + "@cit.edu", password: "Emulator-only-123!", returnSecureToken: true }) });
    tokens[uid] = (await response.json()).idToken;
  }
  async function call(uid, url, method = "POST", body) {
    const response = await fetch(endpoint + url, { method, headers: { Authorization: "Bearer " + tokens[uid], "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  }
  async function suspend(reporter, questId) {
    const report = await request(reporter, "/" + questId + "/report", { reason: "no_show", details: "Stopped responding after accepting" });
    assert.equal(report.status, 201);
    const resolved = await call(ids.admin, "/api/admin/reports", "POST", { id: report.body.id, outcome: "suspended", note: "Confirmed abandonment in the chat" });
    assert.equal(resolved.status, 200);
    assert.notEqual(resolved.body.cleanupFailed, true);
  }

  // 1. A block ends chat in both directions, with a deliberately vague message.
  const first = (await request(ids.req, "", input)).body.id;
  assert.equal((await request(ids.run, "/" + first, { action: "accept" })).status, 200);
  assert.equal((await request(ids.req, "/" + first + "/messages", { text: "hello" })).status, 201);
  assert.equal((await call(ids.run, "/api/users/" + ids.req + "/block")).status, 200);
  const blockedChat = await request(ids.req, "/" + first + "/messages", { text: "are you there" });
  assert.equal(blockedChat.status, 403);
  assert.equal(blockedChat.body.message, "You can't message this user.");
  assert.equal((await request(ids.run, "/" + first + "/messages", { text: "no" })).status, 403);

  // 2. Suspending the runner cancels the uncommitted quest and frees the requester to post again.
  await suspend(ids.req, first);
  const cancelled = (await db.doc("quests/" + first).get()).data();
  assert.equal(cancelled.status, "cancelled");
  assert.equal(cancelled.closedReason, "runner_suspended");
  assert.ok((await db.collection("quests/" + first + "/events").where("action", "==", "account-suspended").get()).size === 1);

  // 3. Committed work goes to administrator settlement instead of being cancelled outright.
  const second = (await request(ids.req, "", input)).body.id;
  assert.equal((await request(ids.run2, "/" + second, { action: "accept" })).status, 200);
  assert.equal((await request(ids.run2, "/" + second, { action: "start" })).status, 200);
  assert.equal((await request(ids.run2, "/" + second, { action: "commit" })).status, 200);
  await suspend(ids.req, second);
  const settlement = (await db.doc("quests/" + second).get()).data();
  assert.equal(settlement.status, "settlement");
  assert.equal(settlement.closedReason, "runner_suspended");
  assert.ok(settlement.reviewRequestedAt);

  // 4. The expiry sweep rejects strangers and only expires unclaimed quests past their window.
  const stale = (await request(ids.req, "", input)).body.id;
  const live = (await request(ids.other, "", input)).body.id;
  await db.doc("quests/" + stale).update({ expiresAt: Timestamp.fromMillis(Date.now() - 60000) });
  const cron = (headers) => fetch(endpoint + "/api/cron/expire-quests", { method: "POST", headers });
  assert.equal((await cron({})).status, 401);
  assert.equal((await cron({ Authorization: "Bearer wrong-secret" })).status, 401);
  const sweep = await cron({ Authorization: "Bearer test-cron-secret" });
  assert.equal(sweep.status, 200);
  assert.ok((await sweep.json()).expired >= 1);
  assert.equal((await db.doc("quests/" + stale).get()).data().status, "expired");
  assert.equal((await db.doc("quests/" + live).get()).data().status, "available");
  assert.equal((await db.doc("quests/" + second).get()).data().status, "settlement");

  // 5. An expired quest can be posted again.
  const reposted = await request(ids.req, "/" + stale, { action: "repost" });
  assert.equal(reposted.status, 200);
  assert.equal((await db.doc("quests/" + reposted.body.id).get()).data().status, "available");
});

test("profile API validates input and updates Auth and Firestore together", { timeout: 30000 }, async () => {
  const patch = async (uid, body) => {
    const response = await fetch(`${endpoint}/api/users/me`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(tokens[uid] ? { Authorization: `Bearer ${tokens[uid]}` } : {}) }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
  assert.equal((await patch("missing", { fullName: "Anyone" })).status, 401);
  assert.equal((await patch("outsider", { fullName: "A" })).status, 400);
  assert.equal((await patch("outsider", { fullName: "Valid Name", course: "BS Wizardry" })).status, 400);
  const saved = await patch("outsider", { fullName: "  Maria   Santos ", course: "BS Information Technology Student" });
  assert.equal(saved.status, 200);
  assert.equal((await auth.getUser("outsider")).displayName, "Maria Santos");
  const profile = (await db.doc("users/outsider").get()).data();
  assert.deepEqual([profile.fullName, profile.course], ["Maria Santos", "BS Information Technology Student"]);
  // Direct client writes are bounded by the Firestore rules too.
  const store = client("outsider");
  await assert.rejects(updateDoc(doc(store, "users", "outsider"), { fullName: "x".repeat(101) }), { code: "permission-denied" });
  await assert.rejects(updateDoc(doc(store, "users", "outsider"), { fullName: "Maria Santos", rating: 5 }), { code: "permission-denied" });
  await assert.doesNotReject(updateDoc(doc(store, "users", "outsider"), { fullName: "Maria S." }));
});

test("the sweep closes quests with no activity for two hours, but chat counts as activity", { timeout: 60000 }, async () => {
  const ids = ["ab-requester", "ab-requester2", "ab-runner"];
  for (const uid of ids) {
    await auth.createUser({ uid, email: uid + "@cit.edu", displayName: uid, emailVerified: true, password: "Emulator-only-123!" });
    const response = await fetch("http://127.0.0.1:9095/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: uid + "@cit.edu", password: "Emulator-only-123!", returnSecureToken: true }) });
    tokens[uid] = (await response.json()).idToken;
  }
  const quiet = (await request("ab-requester", "", input)).body.id;
  const chatty = (await request("ab-requester2", "", input)).body.id;
  assert.equal((await request("ab-runner", "/" + quiet, { action: "accept" })).status, 200);
  assert.equal((await request("ab-runner", "/" + chatty, { action: "accept" })).status, 200);
  // A message is recent activity even when the quest document itself is old.
  assert.equal((await request("ab-requester2", "/" + chatty + "/messages", { text: "On my way?" })).status, 201);
  const old = Timestamp.fromMillis(Date.now() - 3 * 60 * 60 * 1000);
  for (const id of [quiet, chatty]) await db.doc("quests/" + id).update({ updatedAt: old, acceptedAt: old });
  const sweep = await fetch(endpoint + "/api/cron/expire-quests", { method: "POST", headers: { Authorization: "Bearer test-cron-secret" } });
  assert.equal(sweep.status, 200);
  assert.ok((await sweep.json()).abandoned >= 1);
  const closed = (await db.doc("quests/" + quiet).get()).data();
  assert.equal(closed.status, "cancelled");
  assert.equal(closed.closedReason, "abandoned_no_activity");
  assert.equal((await db.doc("quests/" + chatty).get()).data().status, "accepted");
  assert.equal((await db.collection("quests/" + quiet + "/events").where("action", "==", "abandoned").get()).size, 1);
});

test("printing files are deleted after retention, but never while a reposted quest still uses them", { timeout: 60000 }, async () => {
  const uid = "at-requester";
  await auth.createUser({ uid, email: uid + "@cit.edu", displayName: uid, emailVerified: true, password: "Emulator-only-123!" });
  const login = await fetch("http://127.0.0.1:9095/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: uid + "@cit.edu", password: "Emulator-only-123!", returnSecureToken: true }) });
  tokens[uid] = (await login.json()).idToken;
  const printing = { ...input, fundingMethod: "prepaid", purchaseBudget: 65, vendorInstructions: "Requester pays the campus print shop directly", category: "Printing", title: "Print my retention module",
    requirements: { paperSize: "A4", copies: "1", pages: "All", color: "Black and white", sides: "Single-sided" } };
  const body = new FormData(); body.set("quest", JSON.stringify(printing));
  body.set("file", new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXZkAAAAASUVORK5CYII=", "base64")], { type: "image/png" }), "page.png");
  const created = await fetch(endpoint + "/api/quests", { method: "POST", headers: { Authorization: "Bearer " + tokens[uid] }, body });
  assert.equal(created.status, 201);
  const first = (await created.json()).id;
  const path = (await db.doc("quests/" + first).get()).data().attachment.path;
  const fileExists = async () => (await getStorage(admin).bucket("demo-questgo-test.appspot.com").file(path).exists())[0];
  const sweep = async () => { const r = await fetch(endpoint + "/api/cron/expire-quests", { method: "POST", headers: { Authorization: "Bearer test-cron-secret" } }); assert.equal(r.status, 200); return r.json(); };
  const age = (id) => { const old = Timestamp.fromMillis(Date.now() - 8 * 24 * 60 * 60 * 1000); return db.doc("quests/" + id).update({ createdAt: old, updatedAt: old, cancelledAt: old }); };

  // A recently closed quest keeps its file.
  assert.equal((await request(uid, "/" + first, { action: "cancel" })).status, 200);
  await sweep();
  assert.equal(await fileExists(), true);

  // Reposting shares the file, so aging the first quest alone must not delete it.
  const second = (await request(uid, "/" + first, { action: "repost" })).body.id;
  assert.equal((await db.doc("quests/" + second).get()).data().attachment.path, path);
  await age(first);
  await sweep();
  assert.equal(await fileExists(), true);
  assert.ok((await db.doc("quests/" + first).get()).data().attachment);

  // Once every quest using the file is old and closed, the file and references are removed.
  assert.equal((await request(uid, "/" + second, { action: "cancel" })).status, 200);
  await age(second);
  assert.ok((await sweep()).attachmentsRemoved >= 1);
  assert.equal(await fileExists(), false);
  for (const id of [first, second]) {
    const data = (await db.doc("quests/" + id).get()).data();
    assert.equal(data.attachment, undefined);
    assert.ok(data.attachmentRemovedAt);
  }
  const download = await fetch(`${endpoint}/api/quests/${first}/file`, { headers: { Authorization: "Bearer " + tokens[uid] } });
  assert.equal(download.status, 410);
});

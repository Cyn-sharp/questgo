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

const input = { title: "Pick up my notes", description: "Meet at the main entrance.", category: "Pickup", reward: 30,
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
  assert.equal((await request("requester", `/${id}`, { action: "complete" })).status, 200);
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
  const printing = { ...input, category: "Printing", title: "Print my module", requirements: { paperSize: "A4", copies: "2", pages: "All pages", color: "Black and white", sides: "Single-sided" } };
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

import assert from "node:assert/strict";
import test from "node:test";
import { endSession } from "../src/lib/auth/logout.ts";

test("logout clears the server session before client sign-out", async () => {
  const calls = [];
  await endSession(
    async () => { calls.push("client"); },
    async (url, options) => {
      assert.equal(url, "/api/auth/logout");
      assert.equal(options.method, "POST");
      assert.equal(options.credentials, "same-origin");
      calls.push("server");
      return new Response(null, { status: 200 });
    },
  );
  assert.deepEqual(calls, ["server", "client"]);
});

test("a failed server logout leaves the client available for retry", async () => {
  let signedOut = false;
  await assert.rejects(endSession(
    async () => { signedOut = true; },
    async () => new Response(null, { status: 500 }),
  ), /Could not sign out securely/);
  assert.equal(signedOut, false);
});

test("network failure is reported instead of claiming logout succeeded", async () => {
  let signedOut = false;
  await assert.rejects(endSession(
    async () => { signedOut = true; },
    async () => { throw new Error("offline"); },
  ), /offline/);
  assert.equal(signedOut, false);
});

test("client sign-out failure is reported and can be retried", async () => {
  await assert.rejects(endSession(
    async () => { throw new Error("client sign-out failed"); },
    async () => new Response(null, { status: 200 }),
  ), /client sign-out failed/);
});

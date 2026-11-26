// QuestGo admin access tool (S3-07).
// Gives or removes administrator access for one account, or lists all admins.
//
// Run it in the VS Code terminal, inside the questgo folder:
//   node scripts/set-admin.mjs add someone@gmail.com
//   node scripts/set-admin.mjs remove someone@gmail.com
//   node scripts/set-admin.mjs list
//
// It uses the Firebase Admin keys in .env.local, so only people who have
// those keys can run it. The account must already be registered.
import nextEnv from "@next/env";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Read .env.local the same way the app does (quietly).
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error: console.error });

const USAGE = [
  "How to use:",
  "  node scripts/set-admin.mjs add someone@gmail.com",
  "  node scripts/set-admin.mjs remove someone@gmail.com",
  "  node scripts/set-admin.mjs list",
].join("\n");

function connect() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin keys not found. Run this inside the questgo folder that has your .env.local file.");
  }
  return getAuth(initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }));
}

async function findAccount(auth, email) {
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      throw new Error(`No QuestGo account uses ${email}. Register it first, then run this again.`);
    }
    throw error;
  }
}

async function listAdmins(auth) {
  const admins = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      if (user.customClaims?.admin === true) admins.push(user.email || user.uid);
    }
    pageToken = page.pageToken;
  } while (pageToken);
  console.log(admins.length
    ? `QuestGo admins (${admins.length}):\n${admins.map((email) => `  - ${email}`).join("\n")}`
    : "There are no QuestGo admins yet.");
}

async function main() {
  const [command, rawEmail] = process.argv.slice(2);
  const email = rawEmail?.trim().toLowerCase();

  if (command === "list") return listAdmins(connect());
  if (!["add", "remove"].includes(command) || !email?.includes("@")) {
    console.log(USAGE);
    process.exitCode = 1;
    return;
  }

  const auth = connect();
  const account = await findAccount(auth, email);
  // Keep any other settings (claims) the account already has; only change "admin".
  const claims = { ...(account.customClaims ?? {}) };

  if (command === "add") {
    if (claims.admin === true) return console.log(`${email} is already an admin. Nothing changed.`);
    claims.admin = true;
  } else {
    if (claims.admin !== true) return console.log(`${email} is not an admin. Nothing changed.`);
    delete claims.admin;
  }

  await auth.setCustomUserClaims(account.uid, claims);
  console.log(command === "add"
    ? `Done! ${email} is now a QuestGo admin.`
    : `Done! ${email} is no longer an admin.`);
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
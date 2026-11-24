// Student ID check (the workaround for #55): CIT-U email can't receive our
// verification emails, so each student uploads a photo of their CIT-U ID
// and an admin approves it.
//
// The photo is saved in Firestore (studentIdPhotos/{uid}), which only the
// server can read. Firebase Storage would need the paid Blaze plan.

export type StudentIdStatus = "pending" | "approved" | "rejected";

/** Biggest photo the server accepts (one Firestore document must stay under 1 MB). */
export const STUDENT_ID_MAX_BYTES = 800 * 1024;
/** Biggest photo a student can pick before we shrink it (phone photos are big). */
export const STUDENT_ID_PICK_MAX_BYTES = 20 * 1024 * 1024;
export const STUDENT_ID_ACCEPT = "image/jpeg,image/png";

/** Checks a picked photo. Returns a message to show, or "" when it's fine. */
export function studentIdPickProblem(file: { type: string; size: number }) {
  if (file.type !== "image/jpeg" && file.type !== "image/png") return "Please choose a JPG or PNG photo of your CIT-U ID.";
  if (file.size === 0) return "That photo looks empty. Please choose another one.";
  if (file.size > STUDENT_ID_PICK_MAX_BYTES) return "That photo is too large. Please choose one under 20 MB.";
  return "";
}

/** Reads the first bytes to confirm the file really is a JPG or PNG. */
export function detectStudentIdImage(bytes: Uint8Array): "image/jpeg" | "image/png" | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length > png.length && png.every((value, index) => bytes[index] === value)) return "image/png";
  return null;
}

// ---------- Used in the browser only ----------

// Sizes to try, biggest first: [longest side in pixels, JPG quality].
const SHRINK_STEPS: Array<[number, number]> = [[1600, 0.85], [1280, 0.8], [1024, 0.75], [800, 0.7]];

/**
 * Turns a phone photo into a small JPG so it uploads fast and fits the limit.
 * Re-drawing the photo also removes hidden details like the GPS location.
 * If the browser can't do it, the original photo is used.
 */
export async function shrinkStudentIdPhoto(file: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  try {
    let smallest: Blob | null = null;
    for (const [maxSide, quality] of SHRINK_STEPS) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return file;
      context.fillStyle = "#ffffff"; // see-through parts of a PNG become white
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob) continue;
      if (blob.size <= STUDENT_ID_MAX_BYTES) return blob;
      if (!smallest || blob.size < smallest.size) smallest = blob;
    }
    return smallest ?? file;
  } finally {
    bitmap.close();
  }
}

/** Sends the ID photo to the server. Throws an Error with a friendly message if it fails. */
export async function uploadStudentId(idToken: string, photo: Blob) {
  const body = new FormData();
  body.append("photo", photo, photo.type === "image/png" ? "student-id.png" : "student-id.jpg");
  let response: Response;
  try {
    response = await fetch("/api/student-id", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
      body,
    });
  } catch {
    throw new Error("Could not reach QuestGo. Check your internet connection.");
  }
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || "Your ID photo could not be uploaded.");
  }
}
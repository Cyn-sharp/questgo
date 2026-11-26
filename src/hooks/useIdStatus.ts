"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/auth/firebase";
import { idCheckState, type IdCheckState } from "@/lib/auth/id-check";

// The signed-in student's CIT-U ID check, live. "loading" until the first read.
// Every "Verified" badge in the app reads from here, so none can claim more than an admin approved.
export function useIdStatus(): { status: IdCheckState | "loading"; approved: boolean } {
  const { user } = useAuth();
  const [state, setState] = useState<{ uid: string; status: IdCheckState } | null>(null);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    return onSnapshot(
      doc(db, "users", uid),
      (snapshot) => setState({ uid, status: idCheckState(snapshot.data()) }),
      () => setState({ uid, status: "missing" }),
    );
  }, [user]);

  const status = user && state?.uid === user.uid ? state.status : "loading";
  return { status, approved: status === "approved" };
}

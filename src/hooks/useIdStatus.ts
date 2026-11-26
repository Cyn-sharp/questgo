"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/auth/firebase";
import { idCheckState, idRejectReason, type IdCheckState } from "@/lib/auth/id-check";

type IdStatus = { status: IdCheckState | "loading"; approved: boolean; rejectReason: string };

// The signed-in student's CIT-U ID check, live. "loading" until the first read.
// Every "Verified" badge in the app reads from here, so none can claim more than an admin approved.
// `rejectReason` is the admin's note when the photo was rejected (empty otherwise).
export function useIdStatus(): IdStatus {
  const { user } = useAuth();
  const [state, setState] = useState<{ uid: string; status: IdCheckState; rejectReason: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    return onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        const data = snapshot.data();
        setState({ uid, status: idCheckState(data), rejectReason: idRejectReason(data) });
      },
      () => setState({ uid, status: "missing", rejectReason: "" }),
    );
  }, [user]);

  const current = user && state?.uid === user.uid ? state : null;
  const status = current ? current.status : "loading";
  return { status, approved: status === "approved", rejectReason: status === "rejected" ? current?.rejectReason ?? "" : "" };
}
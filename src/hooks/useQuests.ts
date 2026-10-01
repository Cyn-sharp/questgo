"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/auth/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { Quest } from "@/types/quest";

export function useQuest(id: string) {
  const { user, isLoading: authLoading } = useAuth();
  const key = `${user?.uid}:${id}`;
  const [state, setState] = useState<{ key: string; quest: Quest | null; error: string }>();
  useEffect(() => {
    if (!user || !id) return;
    return onSnapshot(doc(db, "quests", id), (snapshot) => {
      setState({ key, quest: snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as Quest : null, error: "" });
    }, () => setState({ key, quest: null, error: "Unable to load this quest. Check your connection and account access." }));
  }, [user, id, key]);
  return { user, quest: state?.key === key ? state.quest : null,
    loading: authLoading || Boolean(user && id && state?.key !== key),
    error: !id ? "Select a quest from My Requests or the marketplace." : state?.key === key ? state.error : "" };
}

export function useMyQuests() {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<{ uid: string; posted?: Quest[]; running?: Quest[]; error?: string }>();
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const stops = ([ ["requesterId", "posted"], ["questRunnerId", "running"] ] as const).map(([field, role]) =>
      onSnapshot(query(collection(db, "quests"), where(field, "==", uid)), (snapshot) => {
        const records = snapshot.docs.map((record) => ({ ...record.data(), id: record.id }) as Quest);
        setState((current) => ({ ...(current?.uid === uid ? current : { uid }), [role]: records }));
      }, () => setState((current) => ({ ...(current?.uid === uid ? current : { uid }), error: "Unable to load your quests. Refresh to retry." }))),
    );
    return () => stops.forEach((stop) => stop());
  }, [user]);
  const current = state?.uid === user?.uid ? state : undefined;
  return { user, posted: current?.posted ?? [], running: current?.running ?? [], error: current?.error,
    loading: authLoading || Boolean(user && !current?.error && (!current?.posted || !current?.running)) };
}

export function useQuestClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

export function useAvailableQuests() {
  const { user, isLoading: authLoading } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ uid: string; records: Quest[]; error: boolean }>();
  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, "quests"), where("status", "==", "available")), (snapshot) => {
      setState({ uid: user.uid, records: snapshot.docs.map((record) => ({ ...record.data(), id: record.id }) as Quest), error: false });
    }, () => setState({ uid: user.uid, records: [], error: true }));
  }, [user, attempt]);
  const current = state?.uid === user?.uid ? state : undefined;
  return { records: current?.records ?? [], isLoading: authLoading || Boolean(user && !current),
    hasError: current?.error ?? false, retry: () => setAttempt((value) => value + 1) };
}

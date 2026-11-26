"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { RunnerStatus } from "@/lib/quests/runner";

type State = { status: RunnerStatus | "loading" | "error"; reviewNote?: string; submittedAt?: string };

// The signed-in user's own runner application status, from the server.
export function useRunnerStatus() {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ status: "loading" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let current = true;
    if (!user) return;
    void (async () => {
      try {
        const response = await fetch("/api/runner", { headers: { Authorization: "Bearer " + (await user.getIdToken()) } });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message);
        if (current) setState({ status: body.status, reviewNote: body.reviewNote, submittedAt: body.submittedAt });
      } catch {
        if (current) setState({ status: "error" });
      }
    })();
    return () => { current = false; };
  }, [user, tick]);

  const refresh = useCallback(() => setTick((value) => value + 1), []);
  return { ...state, refresh };
}

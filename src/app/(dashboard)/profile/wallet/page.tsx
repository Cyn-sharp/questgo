"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { SubPage, Panel } from "@/components/profile/SubPage";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/auth/firebase";
import { money } from "@/lib/quests/funding";

type Row = { id: string; title: string; reward: number; reimbursement: number };

export default function WalletPage() {
  const { user, isLoading } = useAuth();
  const [rows, setRows] = useState<Row[]>();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    getDocs(query(collection(db, "quests"), where("questRunnerId", "==", user.uid), where("status", "==", "completed"), orderBy("createdAt", "desc"), limit(100)))
      .then((snapshot) => {
        if (!active) return;
        setRows(snapshot.docs.map((d) => {
          const q = d.data();
          return { id: d.id, title: String(q.title ?? "Quest"), reward: Number(q.reward) || 0, reimbursement: q.fundingMethod === "abono" ? Number(q.actualExpense) || 0 : 0 };
        }));
      })
      .catch(() => { if (active) setError("Could not load your earnings. Please try again."); });
    return () => { active = false; };
  }, [user]);

  const earned = rows?.reduce((sum, row) => sum + row.reward, 0) ?? 0;
  const reimbursed = rows?.reduce((sum, row) => sum + row.reimbursement, 0) ?? 0;

  return (
    <SubPage title="Quest Wallet" description="Your completed earnings. QuestGo records amounts, but cash is exchanged in person.">
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {(isLoading || (!rows && !error)) && <Panel><p>Loading…</p></Panel>}
      {rows && (
        <>
          <Panel>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Rewards earned</p><p className="text-2xl font-bold">{money(earned)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Purchases reimbursed</p><p className="text-2xl font-bold">{money(reimbursed)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Total received</p><p className="text-2xl font-bold">{money(earned + reimbursed)}</p></div>
            </div>
          </Panel>
          <Panel title="Completed quests">
            {!rows.length && <p className="text-sm text-stone-600">No completed quests yet. Accept a quest from the <Link href="/quests" className="font-semibold text-maroon underline">marketplace</Link> to start earning.</p>}
            <ul className="divide-y divide-[#e5e0d8]">
              {rows.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0 truncate font-semibold">{row.title}</span>
                  <span className="shrink-0 text-sm">{money(row.reward)}{row.reimbursement ? ` + ${money(row.reimbursement)} reimbursed` : ""}</span>
                </li>
              ))}
            </ul>
            {rows.length === 100 && <p className="mt-3 text-xs text-stone-500">Showing your latest 100 completed quests.</p>}
          </Panel>
        </>
      )}
    </SubPage>
  );
}

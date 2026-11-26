import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/landing/LegalPageShell";

export const metadata: Metadata = {
  title: "Runner Terms | QuestGo",
  description: "Terms for verified CIT-U students who run quests on QuestGo.",
};

export default function RunnerTermsPage() {
  return (
    <LegalPageShell
      title="Runner Terms"
      subtitle="These terms apply every time a student accepts and runs a quest."
      updatedAt="November 26, 2026"
    >
      <LegalSection title="1. Who can run quests">
        <p>
          Any student whose CIT-U ID has been approved by an administrator can accept quests. There is no separate runner application.
          The same approval lets you post quests. An administrator can withdraw it at any time, for example after a report, a breach of
          these terms or the Terms &amp; Conditions.
        </p>
      </LegalSection>

      <LegalSection title="2. Your health and safety">
        <ul className="list-disc pl-5 space-y-1">
          <li>Accept a quest only when you are well enough to finish it safely.</li>
          <li>If your health or plans change, hand the quest back or cancel it instead of rushing.</li>
          <li>QuestGo does not ask for or store any medical information.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How you run a quest">
        <ul className="list-disc pl-5 space-y-1">
          <li>Meet at public, agreed campus locations and follow campus rules at all times.</li>
          <li>Handle the requester&apos;s items and money with care, and record any expense and receipt accurately.</li>
          <li>Do not accept a quest involving anything illegal, unsafe, prohibited by the school or beyond what you can do.</li>
          <li>Be respectful in chat and during handover.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. You take part voluntarily and independently">
        <p>
          A runner is a student who chooses to take quests. You are not an employee, agent or representative of QuestGo, its
          administrators or its developers, and QuestGo does not direct how you carry out a quest.
        </p>
      </LegalSection>

      <LegalSection title="5. Assumption of risk and limit of responsibility">
        <p>
          You take quests at your own risk. QuestGo is a platform that connects students. It does not supervise quests, insure runners or
          guarantee any outcome.
        </p>
        <p>
          To the fullest extent permitted by law, QuestGo&apos;s administrators and developers are not responsible for any injury, illness,
          loss, damage, dispute or other event that happens while you act as a runner. This includes events caused by other users, by third
          parties, by your own health or by your own conduct.
        </p>
        <p>Nothing in these terms limits any responsibility that the law does not allow to be limited.</p>
      </LegalSection>

      <LegalSection title="6. Payments">
        <p>
          Payment is arranged directly between the requester and the runner, normally cash on delivery. QuestGo does not process payments or
          guarantee reimbursement.
        </p>
      </LegalSection>

      <LegalSection title="7. Changes">
        <p>
          We may update these terms. When they change, the date above changes. Running a quest after an update means you accept the new
          terms.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
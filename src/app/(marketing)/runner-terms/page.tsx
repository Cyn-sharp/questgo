import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/landing/LegalPageShell";
import { RUNNER_TERMS_VERSION } from "@/lib/quests/runner";

export const metadata: Metadata = {
  title: "Runner Terms | QuestGo",
  description: "Terms for students who apply to run quests as a Verified Runner on QuestGo.",
};

export default function RunnerTermsPage() {
  return (
    <LegalPageShell
      title="Runner Terms"
      subtitle={`These terms apply to every student who applies to become a Verified Runner. Version ${RUNNER_TERMS_VERSION}.`}
      updatedAt="November 26, 2026"
    >
      <LegalSection title="1. Becoming a Verified Runner">
        <p>
          Only Verified Runners can accept quests. To apply you must hold a verified QuestGo account, complete the application and accept these terms.
          An administrator reviews each application and may approve or decline it. Approval can be withdrawn at any time, for example after a
          report, a breach of these terms or the Terms &amp; Conditions.
        </p>
      </LegalSection>

      <LegalSection title="2. Health and fitness self-declaration">
        <p>
          The application asks you to confirm that you are able to run errands on campus safely. This is a self-declaration. QuestGo does not
          examine you, ask for medical records or verify your health.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You must answer truthfully. Confirming a statement you know to be untrue is a breach of these terms.</li>
          <li>QuestGo stores only that you confirmed each statement, together with your consent. It does not store diagnoses or medical details.</li>
          <li>The information is used only by administrators to decide your application, and is not shown to other users.</li>
          <li>Accept a quest only when you are well enough to finish it. If your health changes, hand the quest back or cancel it.</li>
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
          A Verified Runner is a student who chooses to take quests. You are not an employee, agent or representative of QuestGo, its
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
          We may update these terms. When they change, the version above changes and you may be asked to accept the new version before you
          accept further quests.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}

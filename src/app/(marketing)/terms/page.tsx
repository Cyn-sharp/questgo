import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/landing/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms & Conditions | QuestGo",
  description:
    "Terms and Conditions for using QuestGo, the CIT-U student-to-student campus quest marketplace.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms & Conditions"
      subtitle="Please read these terms carefully before using QuestGo."
    >
      <LegalSection title="1. Acceptance of Terms">
        <p>
          By accessing or using QuestGo (&quot;the Platform&quot;), you agree to be
          bound by these Terms & Conditions. If you do not agree, do not use the
          Platform.
        </p>
        <p>
          QuestGo is a student-to-student peer marketplace designed exclusively
          for verified students of Cebu Institute of Technology – University
          (CIT-U).
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>To use QuestGo, you must:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Be a currently enrolled CIT-U student</li>
          <li>Register using a valid official <strong>@cit.edu</strong> email</li>
          <li>Complete account verification when required</li>
          <li>Provide accurate profile information</li>
        </ul>
        <p>
          One student identity should correspond to one QuestGo account.
          Creating fake, duplicate, or misleading accounts is prohibited.
        </p>
      </LegalSection>

      <LegalSection title="3. Nature of the Platform">
        <p>
          QuestGo is a facilitation platform. Users may post tasks (&quot;Quests&quot;)
          and other verified students may accept and complete those Quests.
        </p>
        <p>
          QuestGo is <strong>not</strong> the employer, contractor, escrow agent,
          or direct party to any Quest agreement between students, unless
          expressly stated otherwise in writing.
        </p>
      </LegalSection>

      <LegalSection title="4. Quests, Acceptance, and Completion">
        <ul className="list-disc pl-5 space-y-1">
          <li>Quest Posters must provide clear task details, location, and reward.</li>
          <li>A Quest may be accepted by only one Quest Runner at a time.</li>
          <li>Quests may automatically expire after the stated time window.</li>
          <li>Runners should complete tasks responsibly and provide proof when requested.</li>
          <li>Payment is generally handled through Cash on Delivery (COD) upon verified completion.</li>
        </ul>
        <p>
          Users are responsible for coordinating safe on-campus meetups and
          confirming completion before payment.
        </p>
      </LegalSection>

      <LegalSection title="5. Payments">
        <p>
          Unless otherwise indicated, payments are made directly between users
          through COD or another agreed method at completion.
        </p>
        <p>
          QuestGo does not currently guarantee, insure, or underwrite payments
          between users. Users should only pay after confirming satisfactory
          completion.
        </p>
      </LegalSection>

      <LegalSection title="6. Acceptable Use">
        <p>You agree not to use QuestGo to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Post illegal, harmful, fraudulent, or deceptive Quests</li>
          <li>Harass, threaten, discriminate against, or exploit other students</li>
          <li>Share academic work in violation of university academic integrity rules</li>
          <li>Request or perform tasks that violate CIT-U policies or Philippine law</li>
          <li>Attempt to bypass verification, safety, reporting, or security systems</li>
          <li>Scrape, disrupt, reverse engineer, or abuse the Platform</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Safety and Meetups">
        <p>
          Users should prefer public, on-campus meeting locations and exercise
          sound judgment at all times. QuestGo may provide safety tools such as
          verification badges, reporting, blocking, and ratings, but users remain
          responsible for their own personal safety.
        </p>
      </LegalSection>

      <LegalSection title="8. Accounts, Suspension, and Termination">
        <p>
          We may suspend, restrict, or terminate accounts that violate these
          Terms, university policies, or applicable laws, or that create risk for
          the campus community.
        </p>
        <p>
          You may stop using QuestGo at any time. Some information may remain as
          needed for safety, audit, or legal purposes.
        </p>
      </LegalSection>

      <LegalSection title="9. Ratings, Reports, and Community Trust">
        <p>
          Ratings, reports, and reputation signals help protect the community.
          Submitting false reports, fake reviews, or manipulative feedback is a
          violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="10. Intellectual Property">
        <p>
          QuestGo branding, interface, logos, and original platform content belong
          to the QuestGo project owners and licensors. You may not copy or reuse
          them without permission.
        </p>
        <p>
          You retain ownership of content you post, but grant QuestGo a limited
          license to host and display it for operating the Platform.
        </p>
      </LegalSection>

      <LegalSection title="11. Disclaimers">
        <p>
          QuestGo is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not
          warrant uninterrupted service, perfect matching, or the conduct of any
          user.
        </p>
        <p>
          To the fullest extent permitted by law, QuestGo is not liable for
          indirect, incidental, or consequential damages arising from use of the
          Platform or from user-to-user interactions.
        </p>
      </LegalSection>

      <LegalSection title="12. Limitation of Liability">
        <p>
          QuestGo&apos;s total liability for any claim related to the Platform shall
          be limited to the maximum extent allowed under applicable law. Users
          interact with each other at their own discretion and risk.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to These Terms">
        <p>
          We may update these Terms from time to time. Continued use of QuestGo
          after updates constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact">
        <p>
          For questions about these Terms, contact the QuestGo team through the
          official project channels or campus organization contacts provided in
          the app.
        </p>
        <p>
          <strong>Platform:</strong> QuestGo — CIT-U Campus
          <br />
          <strong>Audience:</strong> Verified CIT-U students only
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
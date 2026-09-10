import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/landing/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy | QuestGo",
  description:
    "Privacy Policy for QuestGo, explaining how we collect, use, and protect CIT-U student data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="How QuestGo collects, uses, and protects your information."
    >
      <LegalSection title="1. Introduction">
        <p>
          This Privacy Policy explains how QuestGo (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
          handles personal information when you use our campus quest marketplace
          for Cebu Institute of Technology – University (CIT-U) students.
        </p>
        <p>
          By using QuestGo, you acknowledge this Policy. If you do not agree,
          please discontinue use of the Platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>We may collect the following categories of information:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Account information:</strong> name, @cit.edu email, password
            (hashed), student profile details
          </li>
          <li>
            <strong>Verification data:</strong> email verification status and
            related confirmation records
          </li>
          <li>
            <strong>Quest activity:</strong> quest posts, acceptances, completion
            status, locations indicated, rewards, ratings, and reports
          </li>
          <li>
            <strong>Communications:</strong> in-app messages after quest acceptance
          </li>
          <li>
            <strong>Technical data:</strong> device/browser type, approximate logs,
            timestamps, and basic usage analytics
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How We Use Information">
        <p>We use personal data to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Create and manage student accounts</li>
          <li>Verify CIT-U eligibility via official school email</li>
          <li>Operate quest posting, acceptance, and completion flows</li>
          <li>Enable secure messaging related to accepted quests</li>
          <li>Support safety features such as reports, blocks, and reputation</li>
          <li>Improve platform performance, reliability, and user experience</li>
          <li>Comply with legal, academic, or administrative requirements when necessary</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Legal / Legitimate Basis for Use">
        <p>We process information because it is necessary to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide the QuestGo service you request</li>
          <li>Protect campus community safety and platform integrity</li>
          <li>Meet legitimate operational and security needs</li>
          <li>Comply with applicable laws and university-related obligations</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Sharing of Information">
        <p>
          We do not sell your personal information. We may share limited data
          only in these cases:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>With other users:</strong> profile name, verification badge,
            quest details, ratings, and necessary meetup-related information
          </li>
          <li>
            <strong>With service providers:</strong> hosting, analytics, email, or
            infrastructure partners under confidentiality obligations
          </li>
          <li>
            <strong>For safety/legal reasons:</strong> when required by law,
            university investigation, or to prevent fraud/harm
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Cash on Delivery Note">
        <p>
          Quest payments are generally settled directly between students through
          Cash on Delivery. QuestGo does not necessarily process card payments or
          store full payment card data for COD transactions.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Retention">
        <p>
          We retain account and activity information only as long as needed for
          platform operations, safety, dispute review, and legal compliance.
          When data is no longer needed, we aim to delete or anonymize it.
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          We use reasonable administrative and technical safeguards designed to
          protect student information. However, no online system can be
          guaranteed 100% secure. Users should protect their login credentials
          and report suspicious activity immediately.
        </p>
      </LegalSection>

      <LegalSection title="9. Your Choices and Rights">
        <p>Depending on applicable policy/law, you may request to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access personal information we hold about you</li>
          <li>Correct inaccurate profile information</li>
          <li>Request account deletion</li>
          <li>Withdraw from optional communications where applicable</li>
        </ul>
        <p>
          Some records may be retained where necessary for security, audit, or
          lawful purposes.
        </p>
      </LegalSection>

      <LegalSection title="10. Children’s Privacy">
        <p>
          QuestGo is intended for verified college students at CIT-U. It is not
          directed to children under 13, and we do not knowingly collect data
          from children.
        </p>
      </LegalSection>

      <LegalSection title="11. Third-Party Links and Services">
        <p>
          The Platform may link to third-party tools or services. Their privacy
          practices are governed by their own policies, not this one.
        </p>
      </LegalSection>

      <LegalSection title="12. International / Local Processing">
        <p>
          QuestGo is operated for the CIT-U campus community in the Philippines.
          Data may be processed on infrastructure that is local or cloud-hosted,
          subject to reasonable protection measures.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to this Policy">
        <p>
          We may update this Privacy Policy periodically. Continued use of
          QuestGo after an update means you acknowledge the revised Policy.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact Us">
        <p>
          For privacy questions, data requests, or concerns, contact the QuestGo
          team through official project channels.
        </p>
        <p>
          <strong>Platform:</strong> QuestGo — CIT-U Campus
          <br />
          <strong>Primary identifier:</strong> verified @cit.edu student accounts
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
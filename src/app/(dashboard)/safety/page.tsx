import Link from "next/link";
import { SubPage, Panel } from "@/components/profile/SubPage";

const RULES = [
  ["Meet in public", "Hand off items at the meet-up point on campus, in daylight and busy areas, never in private rooms."],
  ["Keep chat in QuestGo", "Quest messages are private to both participants and kept as a record if something goes wrong."],
  ["Share live location", "The runner can share their location while a quest is underway. Stop sharing when it ends."],
  ["Cash on delivery", "QuestGo doesn't process payments. Confirm amounts in the quest and acknowledge payment in the app."],
  ["Never share secrets", "Don't send passwords, OTPs or banking details to anyone, including in vendor instructions."],
  ["Report problems", "Use Report on any quest to reach an administrator. You can also block a user from the report dialog."],
];

export default function SafetyPage() {
  return (
    <SubPage title="Safety Center" description="Simple rules that keep every quest safe for both sides.">
      <Panel>
        <ul className="space-y-4">
          {RULES.map(([title, text]) => (
            <li key={title}><p className="font-bold">{title}</p><p className="text-sm text-stone-600">{text}</p></li>
          ))}
        </ul>
      </Panel>
      <Panel title="Need help now?">
        <p className="text-sm text-stone-600">If you feel unsafe, leave and contact campus security immediately. Then open the quest in <Link href="/requests" className="font-semibold text-maroon underline">My Requests</Link> and report it.</p>
      </Panel>
    </SubPage>
  );
}

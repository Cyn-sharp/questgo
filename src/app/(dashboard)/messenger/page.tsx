import { QuestMessenger } from "@/components/quest/QuestMessenger";

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  const params = await searchParams;
  const id = typeof params.id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(params.id) ? params.id : "";
  return <QuestMessenger key={id} id={id} />;
}

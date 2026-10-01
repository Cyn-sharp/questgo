import { LiveQuest } from "@/components/quest/LiveQuest";

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  const params = await searchParams;
  const id = typeof params.id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(params.id) ? params.id : "";
  return <LiveQuest id={id} participantsOnly />;
}

export type MockQuestPhase = "available" | "accepted" | "in_progress" | "completed";

export type MockChatMessage = {
  id: number;
  sender: "requester" | "runner";
  text: string;
  time: string;
};

export type MockQuestFlow = {
  phase: MockQuestPhase;
  questTitle: string;
  requesterName: string;
  runnerName: string;
  reward: string;
  chatMessages: MockChatMessage[];
};

export const STORAGE_KEY = "questgo_mock_quest_flow_v1";

const DEFAULT_FLOW: MockQuestFlow = {
  phase: "available",
  questTitle: "Print CPE Module",
  requesterName: "Maria Santos",
  runnerName: "John Doe",
  reward: "30",
  chatMessages: [
    { id: 1, sender: "requester", text: "Hi! Can you help me with this quest?", time: "3:45 PM" },
    { id: 2, sender: "runner", text: "Yes, sure! I can do it.", time: "3:46 PM" },
    { id: 3, sender: "requester", text: "Great. The module is saved on my USB. Let's meet at the CIT-U Main Entrance.", time: "3:48 PM" },
    { id: 4, sender: "runner", text: "Got it! I'll head to the library now.", time: "3:49 PM" },
  ],
};

export function getMockQuestFlow(): MockQuestFlow {
  if (typeof window === "undefined") return DEFAULT_FLOW;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FLOW));
      return DEFAULT_FLOW;
    }

    const parsed = JSON.parse(raw) as Partial<MockQuestFlow>;
    return {
      ...DEFAULT_FLOW,
      ...parsed,
      chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : DEFAULT_FLOW.chatMessages,
    };
  } catch {
    return DEFAULT_FLOW;
  }
}

export function setMockQuestFlow(partial: Partial<MockQuestFlow>): MockQuestFlow {
  const next = { ...getMockQuestFlow(), ...partial };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}

export function appendMockMessage(text: string, sender: "requester" | "runner") {
  const current = getMockQuestFlow();
  const nextMessage: MockChatMessage = {
    id: Date.now(),
    sender,
    text,
    time: new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };

  const next = {
    ...current,
    chatMessages: [...current.chatMessages, nextMessage],
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}

export function resetMockQuestFlow(): MockQuestFlow {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FLOW));
  }

  return DEFAULT_FLOW;
}

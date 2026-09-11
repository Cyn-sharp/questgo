"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Paperclip,
  Send,
  Flag,
  FileText,
  CheckCircle2,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   TYPES & MOCK DATA
───────────────────────────────────────────────────────── */
type Message = {
  id: number;
  sender: "them" | "me";
  text: string;
  time: string;
};

const CONTACT = {
  name: "Maria Santos",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
  questId: "#Q1024",
  status: "ACCEPTED" as const,
  reward: "30",
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    sender: "them",
    text: "Hi! Can you help me with this quest?",
    time: "3:45 PM",
  },
  {
    id: 2,
    sender: "me",
    text: "Yes, sure! I can do it.",
    time: "3:46 PM",
  },
  {
    id: 3,
    sender: "them",
    text: "Great. The module is saved on my USB. Let's meet at the CIT-U Main Entrance.",
    time: "3:48 PM",
  },
  {
    id: 4,
    sender: "me",
    text: "Got it! I'll head to the library now.",
    time: "3:49 PM",
  },
];

function formatNow() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function MessengerPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    const next: Message = {
      id: Date.now(),
      sender: "me",
      text,
      time: formatNow(),
    };
    setMessages((prev) => [...prev, next]);
    setDraft("");
    setSending(false);

    // Keep focus on input for fast typing
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleAttach(file?: File | null) {
    if (!file) return;
    const next: Message = {
      id: Date.now(),
      sender: "me",
      text: `📎 Attached: ${file.name}`,
      time: formatNow(),
    };
    setMessages((prev) => [...prev, next]);
  }

  return (
    <div className="bg-[#fbf8f0] min-h-full">
      <div className="page-container py-6 lg:py-8">
        {/* Chat shell */}
        <div className="card-surface overflow-hidden flex flex-col min-h-[72vh] max-h-[calc(100vh-11rem)]">
          {/* ───────────── HEADER ───────────── */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 border-b border-[#e5e0d8] bg-white">
            {/* Left: contact + quest meta */}
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src={CONTACT.avatar}
                alt={CONTACT.name}
                width={44}
                height={44}
                className="rounded-full bg-[#f4f2ef] shrink-0"
                unoptimized
              />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-[#161414] truncate">
                  {CONTACT.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#4a4340]">
                    Quest {CONTACT.questId}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#7a1f32] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                    <CheckCircle2 className="w-3 h-3 text-[#c9a227]" />
                    {CONTACT.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span
                className="
                  inline-flex items-center rounded-full border border-[#f0e0a8]
                  bg-[#fbf6e4] px-3 py-1.5 text-xs font-bold text-[#8a6a1f]
                "
              >
                ₱{CONTACT.reward} Reward
              </span>

              <Link
                href="/quests/viewquest"
                className="
                  inline-flex items-center gap-1.5 rounded-full border border-[#e5e0d8]
                  bg-white px-3 py-1.5 text-xs font-semibold text-[#4a4340]
                  hover:border-[#7a1f32] hover:text-[#7a1f32] transition-all duration-300
                "
              >
                <FileText className="w-3.5 h-3.5" />
                Quest Details
              </Link>

              <button
                type="button"
                className="
                  inline-flex items-center gap-1.5 rounded-full border border-[#e5e0d8]
                  bg-white px-3 py-1.5 text-xs font-semibold text-[#4a4340]
                  hover:border-red-400 hover:text-red-600 transition-all duration-300
                "
              >
                <Flag className="w-3.5 h-3.5" />
                Report
              </button>
            </div>
          </header>

          {/* ───────────── MESSAGES ───────────── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 bg-[#fbf8f0]/40">
            {messages.map((msg) => {
              const isMe = msg.sender === "me";

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Their avatar (left only) */}
                  {!isMe && (
                    <Image
                      src={CONTACT.avatar}
                      alt={CONTACT.name}
                      width={32}
                      height={32}
                      className="rounded-full bg-[#f4f2ef] shrink-0 mb-5"
                      unoptimized
                    />
                  )}

                  <div
                    className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${
                      isMe ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`
                        px-4 py-2.5 text-sm leading-relaxed shadow-sm
                        ${
                          isMe
                            ? "bg-[#7a1f32] text-white rounded-2xl rounded-br-md"
                            : "bg-white text-[#161414] border border-[#e5e0d8] rounded-2xl rounded-bl-md"
                        }
                      `}
                    >
                      {msg.text}
                    </div>

                    <div
                      className={`mt-1.5 flex items-center gap-1.5 text-[11px] text-[#4a4340]/80 ${
                        isMe ? "flex-row-reverse" : ""
                      }`}
                    >
                      {!isMe && (
                        <span className="font-medium text-[#4a4340]">
                          {CONTACT.name.split(" ")[0]}
                        </span>
                      )}
                      {isMe && (
                        <span className="font-medium text-[#4a4340]">You</span>
                      )}
                      <span>•</span>
                      <span>{msg.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* ───────────── COMPOSER ───────────── */}
          <form
            onSubmit={handleSend}
            className="border-t border-[#e5e0d8] bg-white px-3 sm:px-4 py-3"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Attach */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="
                  w-10 h-10 rounded-full border border-[#e5e0d8] bg-[#fbf8f0]
                  flex items-center justify-center shrink-0
                  text-[#4a4340] hover:text-[#7a1f32] hover:border-[#7a1f32]
                  transition-all duration-300
                "
                aria-label="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => handleAttach(e.target.files?.[0])}
              />

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                className="
                  flex-1 rounded-full border border-[#e5e0d8] bg-[#fbf8f0]
                  px-4 sm:px-5 py-3 text-sm text-[#161414]
                  placeholder:text-[#4a4340]/55
                  outline-none transition-all duration-300
                  focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20
                "
              />

              {/* Send */}
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="
                  w-11 h-11 rounded-full bg-[#7a1f32] text-white shrink-0
                  flex items-center justify-center
                  shadow-[0_8px_18px_rgba(122,31,50,0.28)]
                  hover:bg-[#5f1727] transition-all duration-300
                  disabled:opacity-50 disabled:hover:bg-[#7a1f32]
                  hover:-translate-y-0.5
                "
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
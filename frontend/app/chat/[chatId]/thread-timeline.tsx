"use client";

import { useEffect, useRef } from "react";

type ThreadMessage = {
  id: string;
  role: "user" | "assistant";
  sender: string;
  text: string;
  at: string;
  status: string;
};

type ThreadTimelineProps = {
  messages: readonly ThreadMessage[];
  chatId: string;
};

export function ThreadTimeline({ messages, chatId }: ThreadTimelineProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollerRef.current;

    if (!container) {
      return;
    }

    // Ensure thread opens at the latest message.
    const frame = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });

    return () => cancelAnimationFrame(frame);
  }, [chatId, messages.length]);

  return (
    <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="mx-auto rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-500">
          Today
        </div>

        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <article
              key={message.id}
              className={`flex w-full items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser ? (
                <div className="mb-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-700">
                  AI
                </div>
              ) : null}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%] ${
                  isUser
                    ? "rounded-br-md bg-stone-900 text-white"
                    : "rounded-bl-md border border-stone-200 bg-white text-stone-800"
                }`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    isUser ? "text-stone-300" : "text-stone-500"
                  }`}
                >
                  {message.sender}
                </p>
                <p className="mt-1">{message.text}</p>
                <p className={`mt-2 text-[11px] ${isUser ? "text-stone-300" : "text-stone-500"}`}>
                  {message.at} • {message.status}
                </p>
              </div>

              {isUser ? (
                <div className="mb-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-stone-100 text-xs font-semibold text-stone-700">
                  Y
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

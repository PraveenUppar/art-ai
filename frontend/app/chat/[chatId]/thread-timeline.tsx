"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ThreadMessage = {
  id: string;
  role: "user" | "assistant";
  sender: string;
  text: string;
  links: string[];
  at: string;
  status: string;
};

type ThreadTimelineProps = {
  messages: readonly ThreadMessage[];
  chatId: string;
};

export function ThreadTimeline({ messages, chatId }: ThreadTimelineProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [dialogLinks, setDialogLinks] = useState<string[] | null>(null);

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
    <div
      ref={scrollerRef}
      className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="mx-auto rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-500">
          Today
        </div>

        {messages.map((message) => {
          const isUser = message.role === "user";
          const isFailed = message.status === "failed";

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
                    : isFailed
                      ? "rounded-bl-md border border-red-200 bg-red-50 text-red-900"
                      : "rounded-bl-md border border-stone-200 bg-white text-stone-800"
                }`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    isUser ? "text-stone-300" : "text-stone-500"
                  }`}
                >
                  {isUser ? message.sender : "Genesis"}
                </p>
                {isUser ? (
                  <p className="mt-1 whitespace-pre-wrap">{message.text}</p>
                ) : (
                  <div className="prose prose-stone mt-1 max-w-none text-sm leading-7 prose-p:my-2 prose-ul:my-2 prose-ul:list-disc prose-ol:my-2 prose-ol:list-decimal prose-code:rounded prose-code:bg-stone-100 prose-code:px-1 prose-code:py-0.5 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-stone-900 prose-pre:text-stone-100">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                )}
                {!isUser && isFailed ? (
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-red-700">
                    Failed after safeguards
                  </p>
                ) : null}
                {message.links.length > 0 ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setDialogLinks(message.links)}
                      className="rounded-lg border border-stone-300 bg-stone-100 px-2 py-1 text-[11px] font-semibold text-stone-700 transition hover:bg-stone-200"
                    >
                      View sources ({message.links.length})
                    </button>
                  </div>
                ) : null}
                <p
                  className={`mt-2 text-[11px] ${isUser ? "text-stone-300" : isFailed ? "text-red-700" : "text-stone-500"}`}
                >
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

      {dialogLinks ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-600">
                Sources
              </h3>
              <button
                type="button"
                onClick={() => setDialogLinks(null)}
                className="rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-600 hover:bg-stone-100"
              >
                Close
              </button>
            </div>
            <ul className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {dialogLinks.map((link) => (
                <li key={link}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-all rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-blue-700 hover:underline"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

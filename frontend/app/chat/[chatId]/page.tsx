import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

import { eq, and, desc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { chats } from "@/lib/db/schema/chats";
import { messages } from "@/lib/db/schema/messages";

import { deleteChat } from "../actions";
import { AccountDropdown } from "../account-dropdown";
import { DeleteChatButton } from "../form-buttons";
import { ChatComposer } from "./chat-composer";
import { ThreadTimeline } from "./thread-timeline";

type ChatThreadPageProps = {
  params: Promise<{ chatId: string }>;
  searchParams: Promise<{ taskId?: string | string[] }>;
};

function normalizeMessagePayload(
  content: string,
  links: unknown,
): {
  text: string;
  links: string[];
} {
  const structuredLinks = Array.isArray(links)
    ? links.filter((item): item is string => typeof item === "string")
    : [];

  if (structuredLinks.length > 0) {
    return { text: content, links: structuredLinks };
  }

  const marker = "\n\nSources:\n";
  const markerIndex = content.indexOf(marker);
  if (markerIndex === -1) {
    return { text: content, links: [] };
  }

  const text = content.slice(0, markerIndex).trimEnd();
  const rawLines = content
    .slice(markerIndex + marker.length)
    .split("\n")
    .map((line) => line.trim());
  const extracted = rawLines
    .filter(
      (line) => line.startsWith("- http://") || line.startsWith("- https://"),
    )
    .map((line) => line.slice(2));

  return { text, links: extracted };
}

export default async function ChatThreadPage({
  params,
  searchParams,
}: ChatThreadPageProps) {
  const { chatId } = await params;
  const resolvedSearchParams = await searchParams;
  const initialTaskId = Array.isArray(resolvedSearchParams.taskId)
    ? resolvedSearchParams.taskId[0]
    : resolvedSearchParams.taskId;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth?mode=signin&redirect=/chat");
  }

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, session.user.id)),
  });

  const recentChats = await db.query.chats.findMany({
    where: eq(chats.userId, session.user.id),
    orderBy: [desc(chats.updatedAt)],
    limit: 10,
    columns: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });

  if (!chat) {
    notFound();
  }

  const chatMessages = await db.query.messages.findMany({
    where: eq(messages.chatId, chat.id),
    orderBy: [messages.createdAt],
    columns: {
      id: true,
      role: true,
      content: true,
      links: true,
      status: true,
      createdAt: true,
    },
  });

  const dateFormatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  });

  const threadPreview = chatMessages.map((message) => {
    const normalized = normalizeMessagePayload(message.content, message.links);
    const role: "assistant" | "user" =
      message.role === "assistant" ? "assistant" : "user";

    return {
      id: message.id,
      role,
      sender: role === "assistant" ? "Genesis" : "You",
      text: normalized.text,
      links: normalized.links,
      at: new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(message.createdAt),
      status: message.status,
    };
  });

  return (
    <main className="h-dvh overflow-hidden bg-[linear-gradient(180deg,#fbf7f2_0%,#ffffff_45%,#f4efe8_100%)] p-4 text-stone-950 sm:p-5 lg:p-6">
      <div className="mx-auto grid h-full max-w-350 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex min-h-full flex-col rounded-4xl border border-stone-200 bg-white p-5 shadow-[0_24px_60px_rgba(120,74,34,0.08)]">
          <div className="space-y-3 border-b border-stone-200 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              Workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Chats</h1>
            <p className="text-sm leading-6 text-stone-600">
              Continue your conversation
            </p>
          </div>

          <Link
            href="/chat"
            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            New chat
          </Link>

          <div className="mt-6 min-h-0 flex flex-1 flex-col gap-3 overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Recent chats
            </p>

            {recentChats.length === 0 ? (
              <div className="flex-1 rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-5 text-sm leading-6 text-stone-600">
                No chats yet. Start your first conversation.
              </div>
            ) : (
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {recentChats.map((recentChat) => {
                  const isActive = recentChat.id === chat.id;

                  return (
                    <li key={recentChat.id}>
                      <div
                        className={`rounded-2xl border px-3 py-3 transition ${
                          isActive
                            ? "border-stone-900 bg-stone-100"
                            : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/chat/${recentChat.id}`}
                            className="min-w-0 flex-1"
                          >
                            <p className="line-clamp-1 text-sm font-medium text-stone-900">
                              {recentChat.title || "Untitled chat"}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">
                              Updated{" "}
                              {dateFormatter.format(recentChat.updatedAt)}
                            </p>
                          </Link>
                          <form action={deleteChat.bind(null, recentChat.id)}>
                            <DeleteChatButton className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs text-stone-500 transition hover:bg-stone-100 disabled:opacity-60" />
                          </form>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="mt-6 border-t border-stone-200 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Account
            </p>
            <div className="mt-3">
              <AccountDropdown email={session.user.email} />
            </div>
          </footer>
        </aside>

        <section className="min-h-0 rounded-4xl border border-stone-200 bg-white p-4 shadow-[0_24px_60px_rgba(120,74,34,0.08)] sm:p-5 lg:p-6">
          <div className="flex h-full min-h-0 flex-col rounded-3xl border border-stone-200 bg-stone-50/60">
            <header className="border-b border-stone-200 bg-white/90 px-4 py-2.5 backdrop-blur sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="truncate text-lg font-semibold tracking-tight text-stone-950 sm:text-xl">
                  {chat.title || "Untitled chat"}
                </h2>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  ART Genesis AI online
                </div>
              </div>
            </header>

            <ThreadTimeline chatId={chat.id} messages={threadPreview} />

            <div className="mx-3 mb-3 rounded-3xl border border-stone-200/80 bg-white/65 shadow-[0_14px_30px_rgba(120,74,34,0.12)] backdrop-blur-md sm:mx-4 sm:mb-4">
              <ChatComposer
                chatId={chat.id}
                initialTaskId={initialTaskId ?? null}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

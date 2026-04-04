import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

import { eq, and, desc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { chats } from "@/lib/db/schema/chats";
import { messages } from "@/lib/db/schema/messages";

import { createChat } from "../actions";
import { AccountDropdown } from "../account-dropdown";
import { ChatComposer } from "./chat-composer";
import { ThreadTimeline } from "./thread-timeline";

type ChatThreadPageProps = {
  params: Promise<{ chatId: string }>;
};

const popularFactChecks = [
  {
    id: "p1",
    title: "Viral post claims city water contains microchips",
    verdict: "False",
    score: 28,
  },
  {
    id: "p2",
    title: "Election result screenshot circulating on social media",
    verdict: "Misleading",
    score: 15,
  },
  {
    id: "p3",
    title: "Celebrity quote attributed to fabricated interview",
    verdict: "False",
    score: 64,
  },
  {
    id: "p4",
    title: "Old flood video reshared as this week incident",
    verdict: "Out of context",
    score: 52,
  },
  {
    id: "p5",
    title: "Policy memo image edited before repost",
    verdict: "Manipulated",
    score: 30,
  },
  {
    id: "p6",
    title: "Hospital closure rumor from anonymous thread",
    verdict: "Unverified",
    score: 49,
  },
  {
    id: "p7",
    title: "AI-generated crowd photo presented as live event",
    verdict: "Synthetic",
    score: 17,
  },
  {
    id: "p8",
    title: "Misquoted economic statistic in viral reel",
    verdict: "Misleading",
    score: 56,
  },
  {
    id: "p9",
    title: "Doctored chart about vaccine side effects",
    verdict: "Manipulated",
    score: 34,
  },
  {
    id: "p10",
    title: "Satellite image falsely labeled as current conflict",
    verdict: "Out of context",
    score: 22,
  },
];

export default async function ChatThreadPage({ params }: ChatThreadPageProps) {
  const { chatId } = await params;
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
      status: true,
      createdAt: true,
    },
  });

  const dateFormatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  });

  const threadPreview = chatMessages.map((message) => ({
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    sender: message.role === "assistant" ? "artAI" : "You",
    text: message.content,
    at: new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(message.createdAt),
    status: message.status,
  }));

  return (
    <main className="h-dvh overflow-hidden bg-[linear-gradient(180deg,#fbf7f2_0%,#ffffff_45%,#f4efe8_100%)] p-4 text-stone-950 sm:p-5 lg:p-6">
      <div className="mx-auto grid h-full max-w-350 gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_340px] xl:gap-6">
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

          <form action={createChat} className="mt-5">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              New chat
            </button>
          </form>

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
                      <Link
                        href={`/chat/${recentChat.id}`}
                        className={`block rounded-2xl border px-3 py-3 transition ${
                          isActive
                            ? "border-stone-900 bg-stone-100"
                            : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                        }`}
                      >
                        <p className="line-clamp-1 text-sm font-medium text-stone-900">
                          {recentChat.title || "Untitled chat"}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          Updated {dateFormatter.format(recentChat.updatedAt)}
                        </p>
                      </Link>
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
            <header className="flex items-center justify-between gap-4 border-b border-stone-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
                  Assistant thread
                </p>
                <h2 className="truncate text-xl font-semibold tracking-tight text-stone-950 sm:text-2xl">
                  {chat.title || "Untitled chat"}
                </h2>
                <p className="mt-1 line-clamp-1 text-xs text-stone-500">
                  ID {chat.id}
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-600 sm:flex">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                Live
              </div>
            </header>

            <ThreadTimeline chatId={chat.id} messages={threadPreview} />

            <ChatComposer chatId={chat.id} />
          </div>
        </section>

        <aside className="rounded-4xl border border-stone-200 bg-white p-5 shadow-[0_24px_60px_rgba(120,74,34,0.08)] xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto">
          <div className="space-y-6">
            <div className="space-y-2 border-b border-stone-200 pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
                Intelligence feed
              </p>
              <h3 className="text-lg font-semibold tracking-tight text-stone-950">
                Fact checks & fake detection
              </h3>
              <p className="text-sm text-stone-600">
                Top 10 most recent fact checks and AI-generated content
                detections from around the web.
              </p>
            </div>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-900">
                  Recent Popular fact checks
                </p>
                <span className="text-xs text-stone-500">Top 10</span>
              </div>
              <ol className="space-y-2">
                {popularFactChecks.map((item, index) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2"
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium text-stone-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          {item.verdict} • Score {item.score}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-900">
                  Recent detections
                </p>
                <span className="text-xs text-stone-500">Latest 10</span>
              </div>
              <ul className="space-y-2">
                {recentDetections.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-stone-200 px-3 py-2"
                  >
                    <p className="line-clamp-2 text-sm font-medium text-stone-900">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">
                      {item.verdict} • {item.posted}
                    </p>
                  </li>
                ))}
              </ul>
            </section> */}
          </div>
        </aside>
      </div>
    </main>
  );
}

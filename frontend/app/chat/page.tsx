import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { desc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { chats } from "@/lib/db/schema/chats";

import { createChat } from "./actions";

export default async function ChatIndexPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth?mode=signin&redirect=/chat");
  }

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

  const displayName =
    session.user.name?.trim().split(" ")[0] || session.user.email.split("@")[0];

  const dateFormatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fbf7f2_0%,_#ffffff_45%,_#f4efe8_100%)] px-6 py-8 text-stone-950">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex min-h-full flex-col rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_24px_60px_rgba(120,74,34,0.08)]">
          <div className="space-y-3 border-b border-stone-200 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              Workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Chats</h1>
            <p className="text-sm leading-6 text-stone-600">
              Create a new conversation
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

          <div className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Recent chats
            </p>

            {recentChats.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-5 text-sm leading-6 text-stone-600">
                No chats yet. Start your first conversation.
              </div>
            ) : (
              <ul className="space-y-2">
                {recentChats.map((chat) => (
                  <li key={chat.id}>
                    <Link
                      href={`/chat/${chat.id}`}
                      className="block rounded-2xl border border-stone-200 px-3 py-3 transition hover:border-stone-300 hover:bg-stone-50"
                    >
                      <p className="line-clamp-1 text-sm font-medium text-stone-900">
                        {chat.title || "Untitled chat"}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        Updated {dateFormatter.format(chat.updatedAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className="mt-6 border-t border-stone-200 pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Account
            </p>
            <div className="mt-3 rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
              Signed in as
              <div className="mt-1 font-medium text-stone-950">
                {session.user.email}
              </div>
            </div>
          </footer>
        </aside>

        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_24px_60px_rgba(120,74,34,0.08)]">
          <div className="flex min-h-full flex-col justify-between gap-8 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50/80 p-6">
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                  Assistant interface
                </p>
                <h2 className="text-3xl font-semibold tracking-tight">
                  Hello, {displayName}
                </h2>
                <p className="max-w-xl text-sm leading-6 text-stone-600">
                  Pick a model, write your prompt, and start a new thread.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-sm transition hover:border-stone-300"
                >
                  <p className="font-medium text-stone-900">
                    Plan a release note
                  </p>
                  <p className="mt-1 text-stone-600">
                    Summarize this week&apos;s product updates.
                  </p>
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-sm transition hover:border-stone-300"
                >
                  <p className="font-medium text-stone-900">Generate UI copy</p>
                  <p className="mt-1 text-stone-600">
                    Draft concise text for a settings page.
                  </p>
                </button>
              </div>
            </div>

            <form
              action={createChat}
              className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3"
            >
              <label htmlFor="prompt" className="sr-only">
                Message
              </label>
              <textarea
                id="prompt"
                name="prompt"
                rows={4}
                placeholder="Ask anything to start a new conversation..."
                className="w-full resize-none rounded-xl border border-transparent bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-200"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <span className="text-stone-500">Model</span>
                  <select
                    name="model"
                    defaultValue="gpt-5-mini"
                    className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-stone-300"
                  >
                    <option value="gpt-5-mini">GPT-5 mini</option>
                    <option value="gpt-5.3-codex">GPT-5.3 Codex</option>
                    <option value="gpt-4.1">GPT-4.1</option>
                  </select>
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  Start chat
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

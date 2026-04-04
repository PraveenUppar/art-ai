import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { desc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { chats } from "@/lib/db/schema/chats";

import { createChat, deleteChat } from "./actions";
import { AccountDropdown } from "./account-dropdown";
import { DeleteChatButton, PendingButton } from "./form-buttons";

// const recentDetections = [
//   {
//     id: "r1",
//     title: "Thread claiming airport shutdown in downtown",
//     verdict: "False",
//     posted: "5m ago",
//   },
//   {
//     id: "r2",
//     title: "Fake emergency alert shared in community groups",
//     verdict: "Manipulated",
//     posted: "17m ago",
//   },
//   {
//     id: "r3",
//     title: "Altered press release on tuition changes",
//     verdict: "Misleading",
//     posted: "31m ago",
//   },
//   {
//     id: "r4",
//     title: "Edited video of public speech trending",
//     verdict: "Out of context",
//     posted: "44m ago",
//   },
//   {
//     id: "r5",
//     title: "Fabricated weather advisory screenshot",
//     verdict: "False",
//     posted: "1h ago",
//   },
//   {
//     id: "r6",
//     title: "Rumor about bank withdrawal limits",
//     verdict: "Unverified",
//     posted: "1h ago",
//   },
//   {
//     id: "r7",
//     title: "Clipped clip of council meeting discussion",
//     verdict: "Misleading",
//     posted: "2h ago",
//   },
//   {
//     id: "r8",
//     title: "Reposted wildfire image from 2021",
//     verdict: "Out of context",
//     posted: "3h ago",
//   },
//   {
//     id: "r9",
//     title: "Meme claims mandatory app rollout tomorrow",
//     verdict: "False",
//     posted: "4h ago",
//   },
//   {
//     id: "r10",
//     title: "Impersonation account spreading fake notice",
//     verdict: "Synthetic",
//     posted: "5h ago",
//   },
// ];

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
                {recentChats.map((chat) => (
                  <li key={chat.id}>
                    <div className="rounded-2xl border border-stone-200 px-3 py-3 transition hover:border-stone-300 hover:bg-stone-50">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/chat/${chat.id}`}
                          className="min-w-0 flex-1"
                        >
                          <p className="line-clamp-1 text-sm font-medium text-stone-900">
                            {chat.title || "Untitled chat"}
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            Updated {dateFormatter.format(chat.updatedAt)}
                          </p>
                        </Link>
                        <form action={deleteChat.bind(null, chat.id)}>
                          <DeleteChatButton className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-xs text-stone-500 transition hover:bg-stone-100 disabled:opacity-60" />
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
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
              <h2 className="truncate text-lg font-semibold tracking-tight text-stone-950 sm:text-xl">
                New chat
              </h2>
            </header>

            <div className="min-h-0 flex-1" />

            <div className="border-t border-stone-200 bg-white p-3 sm:p-4">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <p className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold tracking-[0.08em] text-stone-700">
                  ART Genesis
                </p>

                <form action={createChat} className="space-y-3">
                  <label htmlFor="prompt" className="sr-only">
                    Message
                  </label>
                  <textarea
                    id="prompt"
                    name="prompt"
                    rows={3}
                    placeholder={`Hello, ${displayName}. Write a message...`}
                    className="w-full resize-none rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-200"
                  />

                  <div className="flex justify-end">
                    <PendingButton
                      idleText="Start chat"
                      pendingText="Starting..."
                      className="inline-flex items-center justify-center rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

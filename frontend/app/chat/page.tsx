import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { desc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { chats } from "@/lib/db/schema/chats";

import { createChat } from "./actions";
import { AccountDropdown } from "./account-dropdown";

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
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fbf7f2_0%,_#ffffff_45%,_#f4efe8_100%)] px-6 py-8 text-stone-950">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1400px] gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
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
            <div className="mt-3">
              <AccountDropdown email={session.user.email} />
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

        <aside className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_24px_60px_rgba(120,74,34,0.08)] xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto">
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

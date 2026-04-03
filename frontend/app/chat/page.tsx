import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { createChat } from "./actions";

export default async function ChatIndexPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth?mode=signin&redirect=/chat");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fbf7f2_0%,_#ffffff_45%,_#f4efe8_100%)] px-6 py-8 text-stone-950">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_24px_60px_rgba(120,74,34,0.08)]">
          <div className="space-y-3 border-b border-stone-200 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
              Workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Chats</h1>
            <p className="text-sm leading-6 text-stone-600">
              Create a new conversation and route into the assistant thread by
              id.
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

          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Account
            </p>
            <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
              Signed in as
              <div className="mt-1 font-medium text-stone-950">
                {session.user.email}
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_24px_60px_rgba(120,74,34,0.08)]">
          <div className="flex min-h-full flex-col justify-between gap-8 rounded-[1.5rem] border border-dashed border-stone-200 bg-stone-50/80 p-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                Assistant UI shell
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                Start a new chat to open the full assistant experience.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-stone-600">
                This page is the entry point for the chat interface. The actual
                assistant conversation view lives at the chat id route so every
                thread is addressable and refresh-safe.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] bg-white p-5 shadow-sm md:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-stone-950">
                  New thread
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Create a DB row first, then navigate.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-950">
                  Persistent route
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Use /chat/[chatId] for deep links.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-950">
                  Assistants UI ready
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Drop the library into the thread page next.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
              <span>Next step:</span>
              <Link
                href="/auth?mode=signup"
                className="font-semibold text-stone-950 underline underline-offset-4"
              >
                add the assistant thread view
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

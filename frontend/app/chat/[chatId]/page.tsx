import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { chats } from "@/lib/db/schema/chats";

type ChatThreadPageProps = {
  params: { chatId: string };
};

export default async function ChatThreadPage({ params }: ChatThreadPageProps) {
  const { chatId } = params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth?mode=signin&redirect=/chat");
  }

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, session.user.id)),
  });

  if (!chat) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fcf8f3_0%,_#ffffff_35%,_#f6f0e8_100%)] px-6 py-8 text-stone-950">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-[0_24px_60px_rgba(120,74,34,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Chat id
          </p>
          <h1 className="mt-2 break-all text-lg font-semibold text-stone-950">
            {chat.id}
          </h1>
          <div className="mt-6 space-y-3 text-sm text-stone-600">
            <p className="font-medium text-stone-950">
              {chat.title || "New chat"}
            </p>
            <p>This route is ready for the Assistants UI conversation panel.</p>
            <p>
              Next you can bind messages, stream assistant responses, and update
              this route from the actual chat SDK.
            </p>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_24px_60px_rgba(120,74,34,0.08)]">
          <div className="flex min-h-full flex-col gap-6 rounded-[1.5rem] bg-stone-50 p-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                Assistant thread
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                {chat.title || "Untitled chat"}
              </h2>
            </div>

            <div className="flex-1 rounded-[1.5rem] border border-dashed border-stone-300 bg-white p-6">
              <div className="max-w-2xl space-y-4 text-sm leading-7 text-stone-600">
                <p>
                  This is the placeholder thread view. When you integrate
                  Assistants UI, swap this area for the message timeline,
                  composer, attachments, and tool output panels.
                </p>
                <p>
                  The important part is that the chat id already exists in the
                  database and is tied to the current user, so the UI can mount
                  against it safely.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

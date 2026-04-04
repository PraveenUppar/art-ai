"use server";

import { randomUUID } from "node:crypto";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { chats } from "@/lib/db/schema/chats";
import { messages } from "@/lib/db/schema/messages";
import { postToFastApi } from "@/lib/fastapi-client";
import { and, eq } from "drizzle-orm";

export async function createChat(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth?mode=signin&redirect=/chat");
  }

  const promptValue = formData.get("prompt");
  const prompt = typeof promptValue === "string" ? promptValue.trim() : "";

  const initialTitle = prompt ? prompt.slice(0, 80) : "New chat";

  const [chat] = await db
    .insert(chats)
    .values({
      id: randomUUID(),
      userId: session.user.id,
      title: initialTitle,
    })
    .returning({ id: chats.id });

  if (prompt) {
    await db.insert(messages).values({
      id: randomUUID(),
      chatId: chat.id,
      userId: session.user.id,
      role: "user",
      content: prompt,
      links: [],
      status: "submitted",
    });

    const task = await postToFastApi<{ task_id: string }>(
      `/api/chat/${chat.id}/start`,
      {
        user_prompt: prompt,
        user_id: session.user.id,
      },
    );

    redirect(`/chat/${chat.id}?taskId=${encodeURIComponent(task.task_id)}`);
  }

  redirect(`/chat/${chat.id}`);
}

export async function deleteChat(chatId: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth?mode=signin&redirect=/chat");
  }

  await db
    .delete(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, session.user.id)));

  redirect("/chat");
}

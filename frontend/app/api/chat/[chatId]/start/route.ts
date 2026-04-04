import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { chats } from "@/lib/db/schema/chats";
import { messages } from "@/lib/db/schema/messages";
import { postToFastApi } from "@/lib/fastapi-client";

type StartTaskResponse = {
  task_id: string;
  chat_id: string;
  status: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ chatId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = await context.params;
  const body = (await request.json()) as { userPrompt?: string };
  const userPrompt = body.userPrompt?.trim();

  if (!userPrompt) {
    return NextResponse.json(
      { error: "userPrompt is required" },
      { status: 400 },
    );
  }

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, session.user.id)),
    columns: { id: true },
  });

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  await db.insert(messages).values({
    id: randomUUID(),
    chatId,
    userId: session.user.id,
    role: "user",
    content: userPrompt,
    status: "submitted",
  });

  const task = await postToFastApi<StartTaskResponse>(
    `/api/chat/${chatId}/start`,
    {
      user_prompt: userPrompt,
      user_id: session.user.id,
    },
  );

  return NextResponse.json(task, { status: 202 });
}

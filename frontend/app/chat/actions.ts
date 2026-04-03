"use server";

import { randomUUID } from "node:crypto";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { chats } from "@/lib/db/schema/chats";

export async function createChat() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth?mode=signin&redirect=/chat");
  }

  const [chat] = await db
    .insert(chats)
    .values({
      id: randomUUID(),
      userId: session.user.id,
      title: "New chat",
    })
    .returning({ id: chats.id });

  redirect(`/chat/${chat.id}`);
}

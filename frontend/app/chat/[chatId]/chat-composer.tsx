"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useTaskSocket } from "@/hooks/use-task-socket";
import type { TaskUpdate } from "@/hooks/use-task-socket";

type StartTaskResponse = {
  task_id: string;
  chat_id: string;
  status: string;
};

type ChatComposerProps = {
  chatId: string;
  initialTaskId?: string | null;
};

export function ChatComposer({
  chatId,
  initialTaskId = null,
}: ChatComposerProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [taskId, setTaskId] = useState<string | null>(initialTaskId);
  const [submitting, setSubmitting] = useState(false);
  const [taskUpdate, setTaskUpdate] = useState<TaskUpdate | null>(null);
  const [liveLinks, setLiveLinks] = useState<string[]>([]);
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [linksDialogOpen, setLinksDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useTaskSocket(taskId, (payload) => {
    setTaskUpdate(payload);

    const nextLinks = new Set<string>();
    for (const link of liveLinks) {
      nextLinks.add(link);
    }
    for (const link of payload.evidence_links ?? []) {
      nextLinks.add(link);
    }
    for (const link of payload.result?.links ?? []) {
      nextLinks.add(link);
    }
    for (const claim of payload.result?.claims ?? []) {
      for (const link of claim.evidence_urls ?? []) {
        nextLinks.add(link);
      }
      for (const link of claim.contradicting_urls ?? []) {
        nextLinks.add(link);
      }
    }

    setLiveLinks(Array.from(nextLinks).slice(0, 20));
  });

  useEffect(() => {
    setTaskId(initialTaskId);
  }, [chatId, initialTaskId]);

  useEffect(() => {
    if (!taskUpdate) {
      return;
    }

    if (taskUpdate.status === "completed") {
      router.replace(`/chat/${chatId}`);
      router.refresh();
      setTaskUpdate(null);
      setTaskId(null);
      setSubmittedPrompt(null);
      setLiveLinks([]);
      setLinksDialogOpen(false);
      setError(null);
      return;
    }

    if (taskUpdate.status === "failed") {
      // Failure details are shown as assistant messages in timeline.
      setError(null);
      setTaskId(null);
      setTaskUpdate(null);
      setSubmittedPrompt(null);
      setLiveLinks([]);
      setLinksDialogOpen(false);
      router.replace(`/chat/${chatId}`);
      router.refresh();
    }
  }, [chatId, router, taskUpdate]);

  const statusText = useMemo(() => {
    if (taskUpdate) {
      const progressSuffix =
        typeof taskUpdate.progress === "number"
          ? ` (${taskUpdate.progress}%)`
          : "";
      return `${taskUpdate.status}: ${taskUpdate.message}${progressSuffix}`;
    }
    if (taskId) {
      return `Task ${taskId} started. Waiting for live updates...`;
    }
    return "";
  }, [taskId, taskUpdate]);

  const isThinking = taskUpdate?.status === "in_progress";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || submitting || isThinking) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/${chatId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: content }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Failed to start worker task");
      }

      const data = (await response.json()) as StartTaskResponse;
      setTaskId(data.task_id);
      setTaskUpdate(null);
      setLiveLinks([]);
      setSubmittedPrompt(content);
      setPrompt("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to start task",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onPromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    if (submitting || isThinking || !prompt.trim()) {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  };

  return (
    <form onSubmit={onSubmit} className="bg-transparent p-3 sm:p-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <label htmlFor="thread-prompt" className="sr-only">
          Message
        </label>
        <textarea
          id="thread-prompt"
          rows={3}
          placeholder="Write a message..."
          value={prompt}
          onKeyDown={onPromptKeyDown}
          onChange={(event) => setPrompt(event.target.value)}
          className="w-full resize-none rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-200"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold tracking-[0.06em] text-stone-700">
              ART Genesis
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || isThinking}
            className="inline-flex items-center justify-center rounded-xl bg-stone-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isThinking
              ? "Thinking..."
              : submitting
                ? "Sending..."
                : "Send message"}
          </button>
        </div>

        {statusText && taskUpdate?.status !== "in_progress" ? (
          <p className="text-xs text-stone-600">{statusText}</p>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-900">
            <p className="font-semibold uppercase tracking-[0.12em] text-red-700">
              Generation issue
            </p>
            <p className="mt-1 whitespace-pre-wrap leading-6">{error}</p>
          </div>
        ) : null}

        {submittedPrompt ? (
          <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700">
            <p className="font-semibold uppercase tracking-[0.12em] text-stone-500">
              Submitted prompt
            </p>
            <p className="mt-1">{submittedPrompt}</p>
          </div>
        ) : null}

        {taskUpdate?.status === "in_progress" ? (
          <div className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-xs text-stone-700">
            <p className="font-semibold uppercase tracking-[0.12em] text-stone-500">
              Verifying answer
            </p>
            <div className="mt-2 rounded-lg border border-stone-100 bg-stone-50 px-2 py-2">
              <p className="font-medium text-stone-800">
                {taskUpdate.message}
                {typeof taskUpdate.progress === "number"
                  ? ` (${taskUpdate.progress}%)`
                  : ""}
              </p>
              {taskUpdate.searches && taskUpdate.searches.length > 0 ? (
                <p className="mt-1 text-stone-600">
                  Searching: {taskUpdate.searches.slice(0, 3).join(" | ")}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {liveLinks.length > 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-xs text-stone-700">
            <p className="font-semibold uppercase tracking-[0.12em] text-stone-500">
              Links used
            </p>
            <button
              type="button"
              onClick={() => setLinksDialogOpen(true)}
              className="mt-2 rounded-lg border border-stone-300 bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-200"
            >
              View links ({liveLinks.length})
            </button>
          </div>
        ) : null}
      </div>

      {linksDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-600">
                Links used by model
              </h3>
              <button
                type="button"
                onClick={() => setLinksDialogOpen(false)}
                className="rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-600 hover:bg-stone-100"
              >
                Close
              </button>
            </div>
            <ul className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {liveLinks.map((link) => (
                <li key={link}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-all rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-blue-700 hover:underline"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </form>
  );
}

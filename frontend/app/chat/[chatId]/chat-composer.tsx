"use client";

import { FormEvent, useMemo, useState } from "react";

import { useTaskSocket } from "@/hooks/use-task-socket";

type StartTaskResponse = {
  task_id: string;
  chat_id: string;
  status: string;
};

type TaskUpdate = {
  task_id: string;
  status: string;
  message: string;
  step?: string;
  progress?: number;
};

type ChatComposerProps = {
  chatId: string;
};

export function ChatComposer({ chatId }: ChatComposerProps) {
  const [prompt, setPrompt] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [taskUpdate, setTaskUpdate] = useState<TaskUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useTaskSocket(taskId, (payload) => {
    setTaskUpdate(payload);
  });

  const statusText = useMemo(() => {
    if (error) {
      return error;
    }
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
  }, [error, taskId, taskUpdate]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || submitting) {
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

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-stone-200 bg-white p-3 sm:p-4"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <label htmlFor="thread-prompt" className="sr-only">
          Message
        </label>
        <textarea
          id="thread-prompt"
          rows={3}
          placeholder="Write a message..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="w-full resize-none rounded-xl border border-transparent bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-200"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Attach file"
              className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100"
            >
              +
            </button>
            <select
              name="model"
              aria-label="Model"
              defaultValue="gpt-5.3-codex"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700 outline-none focus:border-stone-300"
            >
              <option value="gpt-5.3-codex">GPT-5.3 Codex</option>
              <option value="gpt-5-mini">GPT-5 mini</option>
              <option value="gpt-4.1">GPT-4.1</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl bg-stone-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send message"}
          </button>
        </div>

        {statusText ? (
          <p className="text-xs text-stone-600">{statusText}</p>
        ) : null}
      </div>
    </form>
  );
}

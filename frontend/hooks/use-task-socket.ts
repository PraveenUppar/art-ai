"use client";

import { useEffect, useMemo, useRef } from "react";
import { io, Socket } from "socket.io-client";

type TaskUpdate = {
  task_id: string;
  chat_id?: string | null;
  status: string;
  message: string;
  step?: string;
  progress?: number;
  attempt?: number;
  questions?: string[];
  searches?: string[];
  evidence_links?: string[];
  result?: {
    content?: string;
    final_verdict?: string;
    links?: string[];
    claims?: Array<{
      evidence_urls?: string[];
      contradicting_urls?: string[];
    }>;
  };
};

export type { TaskUpdate };

function normalizeSocketBaseUrl(raw: string | undefined): string {
  if (!raw) {
    return "http://localhost:8000";
  }

  let normalized = raw.trim();

  // If env uses ws/wss, keep host but use http(s) for socket.io-client base URL.
  if (normalized.startsWith("ws://")) {
    normalized = normalized.replace("ws://", "http://");
  } else if (normalized.startsWith("wss://")) {
    normalized = normalized.replace("wss://", "https://");
  }

  if (normalized.endsWith("/ws")) {
    normalized = normalized.slice(0, -3);
  }
  if (normalized.endsWith("/socket.io")) {
    normalized = normalized.slice(0, -10);
  }

  return normalized.replace(/\/$/, "");
}

const SOCKET_URL = normalizeSocketBaseUrl(
  process.env.NEXT_PUBLIC_FASTAPI_SOCKET_URL,
);

export function useTaskSocket(
  taskId: string | null,
  onUpdate: (payload: TaskUpdate) => void,
) {
  const callbackRef = useRef(onUpdate);

  useEffect(() => {
    callbackRef.current = onUpdate;
  }, [onUpdate]);

  const socket = useMemo<Socket>(() => {
    return io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
    });
  }, []);

  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    const join = () => {
      socket.emit("join_room_event", { room: taskId });
    };

    const onTaskUpdate = (payload: TaskUpdate) => {
      if (payload.task_id !== taskId) {
        return;
      }
      callbackRef.current(payload);
    };

    if (socket.connected) {
      join();
    }
    socket.on("connect", join);
    socket.on("task_update", onTaskUpdate);

    return () => {
      socket.off("connect", join);
      socket.off("task_update", onTaskUpdate);
    };
  }, [socket, taskId]);
}

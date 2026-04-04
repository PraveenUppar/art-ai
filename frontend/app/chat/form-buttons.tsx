"use client";

import { useFormStatus } from "react-dom";

type PendingButtonProps = {
  idleText: string;
  pendingText: string;
  className: string;
};

export function PendingButton({
  idleText,
  pendingText,
  className,
}: PendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : idleText}
    </button>
  );
}

type DeleteChatButtonProps = {
  className: string;
};

export function DeleteChatButton({ className }: DeleteChatButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Delete chat"
      className={className}
      title={pending ? "Deleting..." : "Delete chat"}
    >
      {pending ? "..." : "x"}
    </button>
  );
}

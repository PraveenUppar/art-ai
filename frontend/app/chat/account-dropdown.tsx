"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth-client";

type AccountDropdownProps = {
  email: string;
};

export function AccountDropdown({ email }: AccountDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/auth?mode=signin");
      router.refresh();
    } catch {
      router.push("/auth?mode=signin");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
        <div className="min-w-0">
          <span className="block text-stone-600">Signed in as</span>
          <span className="mt-1 block break-all font-medium text-stone-950">{email}</span>
        </div>

        <button
          type="button"
          aria-label="Open account menu"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-20 w-52 rounded-2xl border border-stone-200 bg-white p-2 shadow-[0_16px_40px_rgba(120,74,34,0.18)]">
        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
        >
          Settings
          <span aria-hidden="true">&#9881;</span>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <span>Sign out</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </button>
        </div>
      ) : null}
    </div>
  );
}

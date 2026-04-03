"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";

type AuthMode = "signin" | "signup";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode =
    searchParams.get("mode") === "signup" ? "signup" : "signin";
  const redirectTo = searchParams.get("redirect") || "/chat";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(
    () => (mode === "signin" ? "Sign in to continue" : "Create your account"),
    [mode],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response =
        mode === "signup"
          ? await authClient.signUp.email({
              name,
              email,
              password,
              callbackURL: redirectTo,
            })
          : await authClient.signIn.email({
              email,
              password,
              callbackURL: redirectTo,
            });

      if (response.error) {
        setError(response.error.message || "Authentication failed");
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Authentication failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,208,184,0.3),_transparent_34%),linear-gradient(180deg,_#fff9f5_0%,_#ffffff_100%)] px-6 py-12 text-stone-950">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-between rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(120,74,34,0.12)] backdrop-blur">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {title}
              </h1>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  mode === "signin"
                    ? "bg-stone-950 text-white"
                    : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "bg-stone-950 text-white"
                    : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                Sign up
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_24px_80px_rgba(120,74,34,0.08)]">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h2>
                <p className="text-sm text-stone-600">
                  You will be redirected back to the chat area after a
                  successful sign in.
                </p>
              </div>
              {mode === "signup" && (
                <label className="block space-y-2 text-sm font-medium text-stone-700">
                  Name
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:bg-white"
                    placeholder="Your name"
                    required
                  />
                </label>
              )}

              <label className="block space-y-2 text-sm font-medium text-stone-700">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:bg-white"
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-stone-700">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:bg-white"
                  placeholder="••••••••"
                  required
                />
              </label>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Please wait..."
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

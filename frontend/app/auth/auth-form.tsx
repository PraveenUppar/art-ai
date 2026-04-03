"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";

type AuthMode = "signin" | "signup";

function AbstractIllustration() {
  return (
    <div className="overflow-hidden rounded-2xl">
      <svg
        viewBox="0 0 440 290"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
        aria-hidden
      >
        {/* large celestial arc bleeding off right edge */}
        <circle cx="435" cy="95" r="135" fill="#fff7ed" />
        <circle
          cx="435"
          cy="95"
          r="108"
          fill="none"
          stroke="#fed7aa"
          strokeWidth="0.8"
        />
        <circle cx="435" cy="95" r="80" fill="#fed7aa" opacity="0.55" />
        <circle
          cx="435"
          cy="95"
          r="52"
          fill="none"
          stroke="#fb923c"
          strokeWidth="0.7"
        />
        <circle cx="435" cy="95" r="26" fill="#fb923c" opacity="0.35" />

        {/* organic blob bottom-left */}
        <path
          d="M-15 210 C-5 155 35 125 72 142 C109 159 118 205 102 248 C86 291 20 285 -15 210Z"
          fill="#e7e5e4"
        />

        {/* central organic 'window' form */}
        <path
          d="M68 110 C100 72 158 62 198 90 C238 118 248 168 218 202 C188 236 148 238 124 218 C100 198 36 148 68 110Z"
          fill="#fff7ed"
          stroke="#c7bfb9"
          strokeWidth="0.9"
        />
        {/* inner warm fill */}
        <path
          d="M105 128 C128 108 165 110 180 136 C195 162 183 196 162 208 C141 220 120 212 110 194 C100 176 85 148 105 128Z"
          fill="#fed7aa"
          opacity="0.65"
        />
        {/* focal dot cluster */}
        <circle cx="148" cy="162" r="18" fill="#ea580c" opacity="0.18" />
        <circle cx="148" cy="162" r="8" fill="#ea580c" opacity="0.42" />
        <circle cx="148" cy="162" r="3" fill="#9a3412" />

        {/* tilted square fragment upper-mid */}
        <rect
          x="218"
          y="38"
          width="58"
          height="58"
          rx="2"
          fill="none"
          stroke="#57534e"
          strokeWidth="1"
          transform="rotate(22 247 67)"
        />
        <rect
          x="232"
          y="52"
          width="30"
          height="30"
          rx="1"
          fill="#fb923c"
          opacity="0.28"
          transform="rotate(22 247 67)"
        />

        {/* small tilted rectangle left */}
        <rect
          x="18"
          y="105"
          width="36"
          height="22"
          rx="2"
          fill="none"
          stroke="#a8a29e"
          strokeWidth="0.7"
          transform="rotate(-14 36 116)"
        />

        {/* triangle upper-left */}
        <polygon points="28,75 62,138 -6,138" fill="#fb923c" opacity="0.45" />
        <polygon
          points="28,75 62,138 -6,138"
          fill="none"
          stroke="#ea580c"
          strokeWidth="0.8"
        />

        {/* hatching block lower-right */}
        <rect
          x="305"
          y="185"
          width="72"
          height="56"
          rx="2"
          fill="none"
          stroke="#a8a29e"
          strokeWidth="0.6"
        />
        <line
          x1="305"
          y1="200"
          x2="320"
          y2="185"
          stroke="#a8a29e"
          strokeWidth="0.45"
          opacity="0.8"
        />
        <line
          x1="305"
          y1="214"
          x2="334"
          y2="185"
          stroke="#a8a29e"
          strokeWidth="0.45"
          opacity="0.8"
        />
        <line
          x1="305"
          y1="228"
          x2="348"
          y2="185"
          stroke="#a8a29e"
          strokeWidth="0.45"
          opacity="0.8"
        />
        <line
          x1="305"
          y1="241"
          x2="362"
          y2="185"
          stroke="#a8a29e"
          strokeWidth="0.45"
          opacity="0.8"
        />
        <line
          x1="312"
          y1="241"
          x2="377"
          y2="185"
          stroke="#a8a29e"
          strokeWidth="0.45"
          opacity="0.8"
        />
        <line
          x1="326"
          y1="241"
          x2="377"
          y2="199"
          stroke="#a8a29e"
          strokeWidth="0.45"
          opacity="0.8"
        />
        <line
          x1="340"
          y1="241"
          x2="377"
          y2="213"
          stroke="#a8a29e"
          strokeWidth="0.45"
          opacity="0.8"
        />
        <line
          x1="354"
          y1="241"
          x2="377"
          y2="227"
          stroke="#a8a29e"
          strokeWidth="0.45"
          opacity="0.8"
        />

        {/* constellation cluster upper area */}
        <circle cx="192" cy="30" r="3.5" fill="#ea580c" />
        <circle cx="238" cy="16" r="2.5" fill="#ea580c" opacity="0.75" />
        <circle cx="162" cy="44" r="2" fill="#ea580c" opacity="0.55" />
        <circle cx="275" cy="30" r="2" fill="#ea580c" opacity="0.55" />
        <circle cx="210" cy="10" r="1.5" fill="#ea580c" opacity="0.4" />
        <line
          x1="192"
          y1="30"
          x2="238"
          y2="16"
          stroke="#ea580c"
          strokeWidth="0.5"
          opacity="0.35"
        />
        <line
          x1="162"
          y1="44"
          x2="192"
          y2="30"
          stroke="#ea580c"
          strokeWidth="0.5"
          opacity="0.35"
        />
        <line
          x1="238"
          y1="16"
          x2="275"
          y2="30"
          stroke="#ea580c"
          strokeWidth="0.5"
          opacity="0.35"
        />
        <line
          x1="210"
          y1="10"
          x2="238"
          y2="16"
          stroke="#ea580c"
          strokeWidth="0.5"
          opacity="0.35"
        />

        {/* concentric target lower-left */}
        <circle
          cx="58"
          cy="255"
          r="22"
          fill="none"
          stroke="#c2410c"
          strokeWidth="0.8"
        />
        <circle
          cx="58"
          cy="255"
          r="12"
          fill="none"
          stroke="#c2410c"
          strokeWidth="0.6"
        />
        <circle cx="58" cy="255" r="4" fill="#c2410c" opacity="0.7" />

        {/* plus marks */}
        <line
          x1="298"
          y1="115"
          x2="298"
          y2="132"
          stroke="#57534e"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <line
          x1="289"
          y1="123"
          x2="307"
          y2="123"
          stroke="#57534e"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <line
          x1="155"
          y1="260"
          x2="155"
          y2="273"
          stroke="#57534e"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <line
          x1="148"
          y1="266"
          x2="162"
          y2="266"
          stroke="#57534e"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <line
          x1="250"
          y1="240"
          x2="250"
          y2="250"
          stroke="#a8a29e"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="245"
          y1="245"
          x2="255"
          y2="245"
          stroke="#a8a29e"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* loose bracket arc */}
        <path
          d="M198 240 C210 262 232 274 254 268 C276 262 292 248 296 232"
          stroke="#78716c"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />

        {/* wavy ground line */}
        <path
          d="M10 280 C55 264 98 282 140 270 C182 258 224 278 268 266 C312 254 356 272 400 261 C420 256 432 264 444 260"
          stroke="#d6d3d1"
          strokeWidth="0.8"
          fill="none"
        />

        {/* small floating squares */}
        <rect
          x="340"
          y="100"
          width="10"
          height="10"
          rx="1"
          fill="#e7e5e4"
          stroke="#a8a29e"
          strokeWidth="0.6"
          transform="rotate(30 345 105)"
        />
        <rect
          x="88"
          y="170"
          width="8"
          height="8"
          rx="1"
          fill="#fed7aa"
          opacity="0.8"
          transform="rotate(-20 92 174)"
        />

        {/* tiny scattered dots */}
        <circle cx="120" cy="285" r="1.5" fill="#c7bfb9" />
        <circle cx="220" cy="282" r="1.5" fill="#c7bfb9" />
        <circle cx="330" cy="278" r="1.5" fill="#c7bfb9" />
        <circle cx="408" cy="275" r="1.5" fill="#c7bfb9" />
        <circle cx="345" cy="145" r="2" fill="#c7bfb9" opacity="0.7" />
        <circle cx="20" cy="160" r="1.5" fill="#c7bfb9" opacity="0.7" />
      </svg>
    </div>
  );
}

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
    () =>
      mode === "signin" ? "Sign-in to your Account" : "Create a new Account",
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
          {/* ── Left panel ── */}
          <section className="flex flex-col justify-between rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(120,74,34,0.12)] backdrop-blur">
            <div className="space-y-1">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {title}
              </h1>
            </div>

            {/* illustration fills the gap */}
            <div className="my-6 flex-1">
              <AbstractIllustration />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
                Create Account
              </button>
            </div>
          </section>

          {/* ── Right panel (unchanged) ── */}
          <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_24px_80px_rgba(120,74,34,0.08)]">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h2>
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
                  ? "Loading..."
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

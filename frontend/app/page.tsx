import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,212,166,0.35),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(255,158,129,0.24),_transparent_28%),linear-gradient(180deg,_#fff7f0_0%,_#fffdf9_100%)] text-stone-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16 lg:px-10">
        <div className="grid w-full gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <section className="space-y-8">
            <span className="inline-flex items-center rounded-full border border-stone-300/70 bg-white/70 px-4 py-2 text-sm font-medium tracking-wide text-stone-700 shadow-sm backdrop-blur">
              Creative assistant workspace
            </span>
            <div className="space-y-5">
              <h1 className="max-w-2xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                A landing page that routes straight into your chat product.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-stone-700 sm:text-xl">
                Your friend can own the public home page, while this app handles
                authentication and per-chat conversation IDs for the assistant
                experience.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth?mode=signin"
                className="inline-flex items-center justify-center rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Sign in
              </Link>
              <Link
                href="/auth?mode=signup"
                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-950 transition hover:border-stone-400 hover:bg-stone-50"
              >
                Sign up
              </Link>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_rgba(120,74,34,0.12)] backdrop-blur">
            <div className="space-y-4 rounded-[1.5rem] bg-stone-950 p-6 text-white">
              <p className="text-sm uppercase tracking-[0.35em] text-stone-400">
                Current scope
              </p>
              <ul className="space-y-3 text-sm leading-6 text-stone-200">
                <li>Combined sign in and sign up page</li>
                <li>Protected chat route for signed-in users</li>
                <li>New chat id created from the frontend</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

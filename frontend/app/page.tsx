import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,212,166,0.35),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(255,158,129,0.24),_transparent_28%),linear-gradient(180deg,_#fff7f0_0%,_#fffdf9_100%)] text-stone-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16 lg:px-10">
        <div className="grid w-full gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <section className="space-y-8">
            <span className="inline-flex items-center rounded-full border border-stone-300/70 bg-white/70 px-4 py-2 text-sm font-medium tracking-wide text-stone-700 shadow-sm backdrop-blur">
              A trusted platform for authentic AI conversations
            </span>
            <div className="space-y-5">
              <h1 className="max-w-2xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                Trust your AI assistant with facts - not just internet search
                results.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-stone-700 sm:text-xl">
                A trusted platform for authentic AI conversations — where your
                assistant relies on verified, curated knowledge rather than
                pulling answers from unpredictable internet search results. Get
                responses that are accurate, consistent, and grounded in facts
                you can depend on
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth?mode=signin"
                className="inline-flex items-center justify-center rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                CLICK HERE TO TRY NOW !!
              </Link>
              {/* <Link
                href="/auth?mode=signup"
                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-950 transition hover:border-stone-400 hover:bg-stone-50"
              >
                Sign up
              </Link> */}
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_rgba(120,74,34,0.12)] backdrop-blur">
            <div className="space-y-4 rounded-[1.5rem] bg-stone-950 p-6 text-white">
              <p className="text-sm uppercase tracking-[0.35em] text-stone-400">
                Current scope
              </p>
              <ul className="space-y-3 text-sm leading-6 text-stone-200">
                <li>
                  <strong>
                    <mark> Fact-Checked Responses </mark>
                  </strong>
                  — Every answer is verified against trusted, curated sources
                  before being delivered to you.
                </li>
                <li>
                  <strong>
                    <mark> Credibility Score </mark>
                  </strong>
                  — Each response comes with a transparency score showing how
                  reliable and well-sourced the information is.
                </li>
                <li>
                  <strong>
                    <mark> Source Attribution </mark>
                  </strong>
                  — Know exactly where the information comes from, with clear
                  references and citations attached to every answer.
                </li>
                <li>
                  <strong>
                    <mark> Bias Detection </mark>
                  </strong>
                  — Identifies and flags potentially biased or one-sided
                  information so you always get a balanced perspective.
                </li>
                <li>
                  <strong>
                    <mark> Misinformation Filtering </mark>
                  </strong>
                  — Automatically screens out known false claims, debunked
                  theories, and unreliable sources before they reach you.
                </li>
                <li>
                  <strong>
                    <mark> Trusted Knowledge Base </mark>
                  </strong>
                  — Powered by a curated library of credible, expert-reviewed
                  content — not raw, unfiltered internet data.
                </li>
                <li>
                  <strong>
                    <mark>Conversation Authenticity </mark>
                  </strong>
                  — Every interaction is transparent and honest — no
                  hallucinations, no filler, no made-up facts.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

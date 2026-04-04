"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BookOpenText,
  Boxes,
  BrainCircuit,
  Cable,
  CheckCircle2,
  Code2,
  GitBranch,
  Rocket,
  Settings2,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const sectionLinks = [
  { id: "intro", title: "Intro", icon: BookOpenText },
  { id: "installation-guide", title: "Installation Guide", icon: Rocket },
  { id: "configuration", title: "Configuration", icon: Settings2 },
  { id: "getting-started", title: "Getting Started", icon: Wrench },
  { id: "critical-functions", title: "Critical Functions", icon: BrainCircuit },
  { id: "client-api", title: "Client API", icon: Boxes },
  { id: "providers-and-di", title: "Providers and DI", icon: Cable },
  { id: "hooks", title: "Progress and Persistence", icon: GitBranch },
  { id: "infra-adapters", title: "Infra Adapters", icon: ShieldCheck },
  { id: "models", title: "Return Shapes and Models", icon: Code2 },
  { id: "retry-rules", title: "Behavior and Retry Rules", icon: CheckCircle2 },
] as const;

const functionLinks = [
  {
    id: "fn-classify-content-relevance",
    title: "classify_content_relevance(...)",
    sectionId: "critical-functions",
  },
  {
    id: "fn-generate-fact-check-questions",
    title: "generate_fact_check_questions(...)",
    sectionId: "critical-functions",
  },
  {
    id: "fn-collect-evidence",
    title: "collect_evidence(...)",
    sectionId: "critical-functions",
  },
  {
    id: "fn-check-relevance",
    title: "check_relevance(...)",
    sectionId: "critical-functions",
  },
  {
    id: "fn-generate-and-verify-content",
    title: "generate_and_verify_content(...)",
    sectionId: "critical-functions",
  },
] as const;

const sectionKeywords: Record<(typeof sectionLinks)[number]["id"], string[]> = {
  "intro": ["workflow", "overview", "generate", "verify"],
  "installation-guide": ["pip", "requirements", "install", "infra", "dev"],
  "configuration": ["environment", "sdksettings", "groq", "firecrawl"],
  "getting-started": ["sync", "async", "process", "function-first"],
  "critical-functions": functionLinks.map((fn) => fn.title.toLowerCase()),
  "client-api": ["artaiclient", "asyncartaiclient"],
  "providers-and-di": ["provider", "dependency injection", "callable"],
  "hooks": ["progress", "persistence", "callback"],
  "infra-adapters": ["redis", "sqlalchemy", "celery"],
  "models": ["domaintype", "classificationresult", "linkcheckresult"],
  "retry-rules": ["iterations", "unverified", "confidence", "retries"],
};

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(code);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1400);
  };

  return (
    <div className="group relative">
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={copyCode}
        className="absolute top-2 right-2 z-10 border-primary/20 bg-background/90 opacity-0 shadow-xs transition-all group-hover:opacity-100"
      >
        {copied ? "Copied" : "Copy"}
      </Button>
      <pre className="overflow-x-auto rounded-xl border border-stone-300/70 bg-linear-to-br from-stone-100/70 via-background to-orange-100/40 p-4 pr-20 text-xs leading-relaxed shadow-xs">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function SDKDocsLayout() {
  const [activeSection, setActiveSection] = useState<(typeof sectionLinks)[number]["id"]>(
    "intro",
  );
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const visibleSections = useMemo(() => {
    if (!normalizedSearch) {
      return sectionLinks;
    }

    return sectionLinks.filter((section) => {
      const haystack = [
        section.title,
        ...sectionKeywords[section.id],
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [normalizedSearch]);

  const matchingFunctions = useMemo(() => {
    if (!normalizedSearch) {
      return functionLinks;
    }

    return functionLinks.filter((fn) =>
      fn.title.toLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch]);

  const visibleSectionIds = useMemo(
    () => new Set(visibleSections.map((section) => section.id)),
    [visibleSections],
  );

  useEffect(() => {
    const visibleIds = visibleSections.map((section) => section.id);
    if (visibleIds.length === 0 || typeof window === "undefined") {
      return;
    }

    let rafId = 0;

    const updateActiveFromScroll = () => {
      const scrollTop = window.scrollY;
      const offset = 180;

      let current = visibleIds[0];

      for (const id of visibleIds) {
        const element = document.getElementById(id);
        if (!element) {
          continue;
        }

        if (element.offsetTop - offset <= scrollTop) {
          current = id;
        }
      }

      setActiveSection((prev) =>
        prev === current
          ? prev
          : (current as (typeof sectionLinks)[number]["id"]),
      );
    };

    const onScroll = () => {
      if (rafId) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        updateActiveFromScroll();
        rafId = 0;
      });
    };

    updateActiveFromScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [visibleSections]);

  useEffect(() => {
    const first = visibleSections[0]?.id;
    if (!first) {
      return;
    }

    setActiveSection(first);
  }, [visibleSections]);

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon" className="bg-linear-to-b from-stone-100/70 to-background">
        <SidebarHeader className="pt-4">
          <div className="mx-2 rounded-xl border border-stone-300/60 bg-background/80 px-3 py-3 shadow-xs group-data-[collapsible=icon]:hidden">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              SDK Docs
            </p>
            <h2 className="text-sm font-semibold tracking-tight">art_ai_sdk</h2>
          </div>
          <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
            <SidebarInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sections or functions"
              aria-label="Search docs"
              className="border-stone-300/70 bg-background/90"
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="pt-1">
            <SidebarGroupLabel>On this page</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSections.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      render={<a href={`#${item.id}`} />}
                      tooltip={item.title}
                      isActive={item.id === activeSection}
                      className={cn(
                        "rounded-lg border border-transparent transition-all hover:translate-x-0.5 group-data-[collapsible=icon]:hover:translate-x-0",
                        item.id === activeSection &&
                          "border-orange-300/70 bg-orange-100 text-stone-900 shadow-xs",
                      )}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Functions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {matchingFunctions.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      render={<a href={`#${item.id}`} />}
                      tooltip={item.title}
                      className="rounded-lg text-xs transition-all hover:translate-x-0.5 group-data-[collapsible=icon]:hover:translate-x-0"
                    >
                      <Code2 />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-stone-300/70 bg-background/75 px-4 backdrop-blur-md">
          <SidebarTrigger />
          <p className="text-sm font-medium text-muted-foreground">SDK setup and usage guide</p>
        </header>

        <main className="relative mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
          <div className="pointer-events-none absolute -top-14 -left-8 h-44 w-44 rounded-full bg-orange-200/45 blur-3xl" />
          <div className="pointer-events-none absolute top-56 -right-8 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" />

          <section className="relative mb-10 overflow-hidden rounded-3xl border border-stone-300/70 bg-linear-to-br from-stone-100 via-background to-orange-100 p-6 shadow-sm ring-1 ring-orange-200/30 md:p-8">
            <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-orange-200/35 blur-2xl" />
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Python SDK
            </p>
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              art_ai_sdk Setup and Usage
            </h1>
            <p className="max-w-3xl text-sm text-stone-700 md:text-base">
              This page documents the full generate + evidence + verification flow,
              including installation, configuration, sync or async client usage, and
              provider injection patterns.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-stone-700">
              <span className="rounded-full border border-stone-300/70 bg-background/70 px-3 py-1 shadow-xs">Python 3.12+</span>
              <span className="rounded-full border border-stone-300/70 bg-background/70 px-3 py-1 shadow-xs">Function-first + Client API</span>
              <span className="rounded-full border border-stone-300/70 bg-background/70 px-3 py-1 shadow-xs">Retries + claim verification</span>
            </div>
          </section>

          <section className="mb-8 space-y-3 rounded-2xl border border-stone-300/70 bg-card/90 p-4 shadow-xs backdrop-blur">
            <label
              htmlFor="docs-search"
              className="text-sm font-semibold"
            >
              Find sections and function names
            </label>
            <Input
              id="docs-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try: collect_evidence, retry rules, async"
            />
            {normalizedSearch && visibleSections.length === 0 && matchingFunctions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No matches found for "{search}".
              </p>
            ) : null}
          </section>

          <article className="space-y-8">
            {visibleSectionIds.has("intro") ? (
            <section id="intro" className="scroll-mt-20 space-y-4 rounded-2xl border border-stone-300/70 bg-card/85 p-6 shadow-xs">
              <h2 className="text-2xl font-semibold tracking-tight">Intro</h2>
              <p className="text-sm text-muted-foreground md:text-base">
                Use this package to run the workflow directly from Python without
                going through HTTP routes. It preserves the same high-level behavior
                as worker execution.
              </p>
              <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground md:text-base">
                <li>Generate response text from an LLM.</li>
                <li>Classify domain relevance.</li>
                <li>Generate atomic fact-check questions.</li>
                <li>Collect evidence from domain-specific sources.</li>
                <li>Verify claims against evidence.</li>
                <li>Retry when quality is weak.</li>
              </ol>
            </section>
            ) : null}

            {visibleSectionIds.has("installation-guide") ? (
            <section id="installation-guide" className="scroll-mt-20 space-y-4 rounded-2xl border border-stone-300/70 bg-card/85 p-6 shadow-xs">
              <h2 className="text-2xl font-semibold tracking-tight">Installation Guide</h2>
              <Accordion defaultValue={["requirements"]} className="rounded-xl border border-stone-300/70 bg-background/70 p-3">
                <AccordionItem value="requirements">
                  <AccordionTrigger>Requirements</AccordionTrigger>
                  <AccordionContent>
                    <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
                      <li>Python 3.12+</li>
                      <li>GROQ_API_KEY</li>
                      <li>FIRE_CRAWL_API_KEY</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="install-core">
                  <AccordionTrigger>Install Core SDK</AccordionTrigger>
                  <AccordionContent>
                    <CodeBlock code={`pip install -e ./SDK`} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="install-optional">
                  <AccordionTrigger>Optional Extras (infra/dev)</AccordionTrigger>
                  <AccordionContent>
                    <CodeBlock
                      code={`pip install -e "./SDK[infra]"
pip install -e "./SDK[dev]"`}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
            ) : null}

            {visibleSectionIds.has("configuration") ? (
            <section id="configuration" className="scroll-mt-20 space-y-4 rounded-2xl border border-stone-300/70 bg-card/85 p-6 shadow-xs">
              <h2 className="text-2xl font-semibold tracking-tight">Configuration</h2>
              <p className="text-sm text-muted-foreground md:text-base">
                Configuration is loaded via SDKSettings (pydantic-settings). Set
                environment variables for default providers:
              </p>
              <CodeBlock
                code={`export GROQ_API_KEY="your-groq-key"
export GROQ_MODEL="openai/gpt-oss-20b"
export FIRE_CRAWL_API_KEY="your-firecrawl-key"

export REDIS_URL="redis://localhost:6379/0"
export DATABASE_URL="postgresql://user:pass@localhost:5432/db"`}
              />
              <p className="text-sm text-muted-foreground md:text-base">
                To disable writing evidence to disk, pass
                <span className="font-medium text-foreground"> evidence_output_path=None </span>
                 in collect_evidence() or client.process().
              </p>
            </section>
            ) : null}

            {visibleSectionIds.has("getting-started") ? (
            <section id="getting-started" className="scroll-mt-20 space-y-4 rounded-2xl border border-stone-300/70 bg-card/85 p-6 shadow-xs">
              <h2 className="text-2xl font-semibold tracking-tight">Getting Started</h2>
              <Accordion defaultValue={["sync"]} className="rounded-xl border border-stone-300/70 bg-background/70 p-3">
                <AccordionItem value="sync">
                  <AccordionTrigger>Quick Start (Sync Client)</AccordionTrigger>
                  <AccordionContent>
                    <CodeBlock
                      code={`from art_ai_sdk import ArtAIClient

client = ArtAIClient()
result = client.process(
    task_id="demo-task-1",
    user_prompt="Summarize the latest RBI inflation update and verify key claims.",
)

print(result["ok"])
print(result["result"]["final_verdict"])`}
                    />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="async">
                  <AccordionTrigger>Async Client</AccordionTrigger>
                  <AccordionContent>
                    <CodeBlock
                      code={`import asyncio
from art_ai_sdk import AsyncArtAIClient

async def main():
    client = AsyncArtAIClient()
    result = await client.process(
        task_id="demo-task-async",
        user_prompt="Explain recent Supreme Court judgments about privacy rights.",
    )
    print(result["ok"], result["task_id"])

asyncio.run(main())`}
                    />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="functions">
                  <AccordionTrigger>Function-First Pipeline</AccordionTrigger>
                  <AccordionContent>
                    <CodeBlock
                      code={`from art_ai_sdk import (
    classify_content_relevance,
    generate_fact_check_questions,
    collect_evidence,
    check_relevance,
)

classification = classify_content_relevance(user_prompt, content)
questions = generate_fact_check_questions(user_prompt, content)
evidence = collect_evidence(questions.FactCheckQuestions, [classification.content_domain])
verdict = check_relevance(user_prompt, content, evidence)`}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
            ) : null}

            {visibleSectionIds.has("critical-functions") ? (
            <section id="critical-functions" className="scroll-mt-20 space-y-4 rounded-2xl border border-stone-300/70 bg-card/85 p-6 shadow-xs">
              <h2 className="text-2xl font-semibold tracking-tight">Critical Functions</h2>
              <Accordion defaultValue={["classify"]} className="rounded-xl border border-stone-300/70 bg-background/70 p-3">
                <AccordionItem id="fn-classify-content-relevance" value="classify">
                  <AccordionTrigger>classify_content_relevance(...)</AccordionTrigger>
                  <AccordionContent>
                    Classifies prompt and generated content into domains and returns
                    ClassificationResult with relevance and confidence.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem id="fn-generate-fact-check-questions" value="factcheck">
                  <AccordionTrigger>generate_fact_check_questions(...)</AccordionTrigger>
                  <AccordionContent>
                    Generates atomic yes/no verification questions and normalizes
                    expected answers to yes or no.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem id="fn-collect-evidence" value="evidence">
                  <AccordionTrigger>collect_evidence(...)</AccordionTrigger>
                  <AccordionContent>
                    Collects evidence in parallel over domain and question pairs,
                    and can write output to evidence_chunks.json by default.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem id="fn-check-relevance" value="relevance">
                  <AccordionTrigger>check_relevance(...)</AccordionTrigger>
                  <AccordionContent>
                    Verifies claim status against evidence and retries parsing once
                    with a fallback compact-evidence prompt path if needed.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem id="fn-generate-and-verify-content" value="orchestration">
                  <AccordionTrigger>generate_and_verify_content(...)</AccordionTrigger>
                  <AccordionContent>
                    End-to-end orchestration used by client.process(), including
                    progress events, retries, and failure handling.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
            ) : null}

            {visibleSectionIds.has("client-api") ? (
            <section id="client-api" className="scroll-mt-20 space-y-3 rounded-2xl border border-stone-300/70 bg-card/85 p-6 shadow-xs">
              <h2 className="text-2xl font-semibold tracking-tight">Client API</h2>
              <p className="text-sm text-muted-foreground md:text-base">
                ArtAIClient is the standard sync entry point. AsyncArtAIClient mirrors
                the same API and uses asyncio.to_thread internally to remain
                async-friendly.
              </p>
            </section>
            ) : null}

            {visibleSectionIds.has("providers-and-di") ? (
            <section id="providers-and-di" className="scroll-mt-20 space-y-4 rounded-2xl border border-stone-300/70 bg-card/85 p-6 shadow-xs">
              <h2 className="text-2xl font-semibold tracking-tight">Providers and Dependency Injection</h2>
              <p className="text-sm text-muted-foreground md:text-base">
                You can inject LLM and search providers for tests or custom
                integrations.
              </p>
              <CodeBlock
                code={`from art_ai_sdk import ArtAIClient, CallableLLMProvider, CallableSearchProvider

client = ArtAIClient(
    llm_provider=CallableLLMProvider(fake_llm),
    search_provider=CallableSearchProvider(fake_search),
)`}
              />
            </section>
            ) : null}

            {visibleSectionIds.has("hooks") ? (
            <section id="hooks" className="scroll-mt-20 space-y-3 rounded-2xl border border-stone-300/70 bg-card/85 p-6 shadow-xs">
              <h2 className="text-2xl font-semibold tracking-tight">Progress and Persistence Hooks</h2>
              <p className="text-sm text-muted-foreground md:text-base">
                Progress callback emits task status snapshots across key milestones.
                Persistence hooks run when chat_id is provided.
              </p>
            </section>
            ) : null}

            {visibleSectionIds.has("infra-adapters") ? (
            <section id="infra-adapters" className="scroll-mt-20 space-y-3 rounded-2xl border border-stone-300/70 bg-card/85 p-6 shadow-xs">
              <h2 className="text-2xl font-semibold tracking-tight">Optional Infra Adapters</h2>
              <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground md:text-base">
                <li>RedisProgressAdapter</li>
                <li>SQLAlchemyPersistenceAdapter</li>
                <li>CeleryTaskAdapter</li>
              </ul>
            </section>
            ) : null}

            {visibleSectionIds.has("models") ? (
            <section id="models" className="scroll-mt-20 space-y-3 rounded-2xl border border-stone-300/70 bg-card/85 p-6 shadow-xs">
              <h2 className="text-2xl font-semibold tracking-tight">Return Shapes and Data Models</h2>
              <p className="text-sm text-muted-foreground md:text-base">
                Key models include DomainType, ClassificationResult, FactCheckItem,
                FactCheckResult, LinkCheckClaims, LinkCheckResult, and TaskStatus.
              </p>
            </section>
            ) : null}

            {visibleSectionIds.has("retry-rules") ? (
            <section id="retry-rules" className="scroll-mt-20 space-y-4 rounded-2xl border border-stone-300/70 bg-card/85 p-6 shadow-xs">
              <h2 className="text-2xl font-semibold tracking-tight">Behavior and Retry Rules</h2>
              <Accordion defaultValue={["rules"]} className="rounded-xl border border-stone-300/70 bg-background/70 p-3">
                <AccordionItem value="rules">
                  <AccordionTrigger>Core retry logic</AccordionTrigger>
                  <AccordionContent>
                    <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
                      <li>tries_left = max(1, iterations)</li>
                      <li>
                        Domain gate requires is_relevant, domain_match, and
                        confidence_score &gt;= 0.5
                      </li>
                      <li>
                        secondary domain added when confidence &lt; 0.7 and
                        alternate_domain exists
                      </li>
                      <li>
                        unverified ratio &gt; 0.7 triggers targeted regeneration
                      </li>
                      <li>final failure returns {`{ "ok": False, "task_id": ... }`}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
            ) : null}
          </article>

          <footer className="mt-12 border-t border-stone-300/70 pt-6 text-sm text-muted-foreground md:text-center">
            art_ai_sdk v0.1.0 @ 2026 All rights reserved.
            <p>ArtAI</p>
          </footer>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

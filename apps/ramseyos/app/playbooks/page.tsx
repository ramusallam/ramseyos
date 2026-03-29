"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getActiveKnowledge,
  type KnowledgeEntry,
} from "@/lib/knowledge";
import { WORKFLOWS, type Workflow } from "@/lib/workflows";
import Link from "next/link";

/* ── Playbook catalog: the 7 markdown playbooks from packages/playbooks/ ── */

interface CatalogPlaybook {
  id: string;
  title: string;
  workspace: string;
  category: string;
  description: string;
  workflowId?: string;
}

const PLAYBOOK_CATALOG: CatalogPlaybook[] = [
  {
    id: "sonoma-lesson-planning",
    title: "Lesson Planning",
    workspace: "Sonoma Academy",
    category: "teach",
    description:
      "Inquiry-driven lesson plan generation using the 5E model",
    workflowId: "new-lesson-plan",
  },
  {
    id: "sonoma-rubric-grading",
    title: "Rubric Grading",
    workspace: "Sonoma Academy",
    category: "teach",
    description:
      "Structured student work evaluation against rubric criteria",
    workflowId: "grade-with-rubric",
  },
  {
    id: "sonoma-recommendation",
    title: "Recommendation Letters",
    workspace: "Sonoma Academy",
    category: "ops",
    description:
      "College recommendation letter drafting with authentic voice",
    workflowId: "draft-recommendation",
  },
  {
    id: "concordia-discussion",
    title: "Discussion Board Responses",
    workspace: "Concordia",
    category: "teach",
    description:
      "Engaging with graduate student ideas in discussion forums",
  },
  {
    id: "concordia-rubric-feedback",
    title: "Rubric Feedback",
    workspace: "Concordia",
    category: "teach",
    description:
      "Supporting adult learners with collegial evaluation",
  },
  {
    id: "woven-workshop",
    title: "Workshop Development",
    workspace: "Woven",
    category: "consulting",
    description:
      "Structured outlines for professional development workshops",
  },
  {
    id: "cycles-blog",
    title: "Blog Writing",
    workspace: "Cycles of Learning",
    category: "consulting",
    description:
      "Long-form blog post drafting on education and learning",
  },
];

const WORKSPACE_STYLE: Record<string, string> = {
  "Sonoma Academy": "bg-sky-500/10 text-sky-400",
  Concordia: "bg-violet-500/10 text-violet-400",
  Woven: "bg-amber-500/10 text-amber-400",
  "Cycles of Learning": "bg-emerald-500/10 text-emerald-400",
};

function groupByWorkspace(
  playbooks: CatalogPlaybook[]
): [string, CatalogPlaybook[]][] {
  const map = new Map<string, CatalogPlaybook[]>();
  for (const pb of playbooks) {
    const group = map.get(pb.workspace) ?? [];
    group.push(pb);
    map.set(pb.workspace, group);
  }
  return Array.from(map.entries());
}

export default function PlaybooksPage() {
  const [firestorePlaybooks, setFirestorePlaybooks] = useState<
    KnowledgeEntry[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getActiveKnowledge()
      .then((data) => {
        if (!cancelled)
          setFirestorePlaybooks(data.filter((e) => e.type === "playbook"));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const catalogGrouped = useMemo(
    () => groupByWorkspace(PLAYBOOK_CATALOG),
    []
  );

  function getWorkflow(id?: string): Workflow | undefined {
    if (!id) return undefined;
    return WORKFLOWS.find((w) => w.id === id);
  }

  return (
    <div className="max-w-5xl px-4 sm:px-8 pt-10 pb-20">
      {/* Header */}
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <div className="flex items-baseline gap-4 mt-2">
          <h1 className="text-[20px] font-semibold text-foreground">
            Playbooks
          </h1>
          <span className="text-[11px] text-muted/60 tabular-nums">
            {PLAYBOOK_CATALOG.length} playbooks
          </span>
        </div>
        <p className="text-[13px] text-muted/50 mt-1">
          Step-by-step guides for recurring workflows across all workspaces.
        </p>

        <div className="flex items-center gap-3 mt-3">
          <Link
            href="/knowledge"
            className="text-[11px] text-muted hover:text-muted/60 transition-colors"
          >
            Knowledge &rarr;
          </Link>
          <Link
            href="/workspaces"
            className="text-[11px] text-muted hover:text-muted/60 transition-colors"
          >
            Workspaces &rarr;
          </Link>
        </div>
      </header>

      {/* Catalog playbooks grouped by workspace */}
      <div className="space-y-10">
        {catalogGrouped.map(([workspace, playbooks]) => (
          <section key={workspace}>
            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-medium ${WORKSPACE_STYLE[workspace] ?? "bg-white/5 text-muted"}`}
              >
                {workspace}
              </span>
              <span className="text-[10px] text-muted tabular-nums">
                {playbooks.length}
              </span>
              <div className="flex-1 border-t border-border ml-2" />
            </div>

            {/* Playbook cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {playbooks.map((pb) => {
                const wf = getWorkflow(pb.workflowId);

                return (
                  <div
                    key={pb.id}
                    className="group flex flex-col rounded-xl border border-border bg-surface backdrop-blur-sm p-4 transition-all hover:border-border-strong hover:bg-surface-raised/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          pb.category === "teach"
                            ? "bg-sky-500/10 text-sky-400"
                            : pb.category === "ops"
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {pb.category}
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted/30"
                      >
                        <path d="M3 2h10v12H3zM6 5h4M6 7.5h4M6 10h2" />
                      </svg>
                    </div>
                    <h3 className="text-[13px] font-medium text-foreground/90 mb-1 group-hover:text-foreground transition-colors leading-snug">
                      {pb.title}
                    </h3>
                    <p className="text-[12px] text-muted/60 leading-relaxed line-clamp-2 flex-1">
                      {pb.description}
                    </p>

                    {wf && (
                      <Link
                        href={wf.entryRoute}
                        className="inline-flex items-center gap-1.5 text-[11px] text-accent hover:text-accent/80 mt-3 transition-colors"
                      >
                        Launch workflow &rarr;
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Firestore playbook entries */}
        {loading && (
          <div className="flex items-center gap-3 py-8 justify-center">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[13px] text-muted">
              Loading saved playbooks&hellip;
            </span>
          </div>
        )}

        {!loading && firestorePlaybooks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted"
              >
                <path d="M3 2h10v12H3zM6 5h4M6 7.5h4M6 10h2" />
              </svg>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Saved Playbooks
              </h2>
              <span className="text-[10px] text-muted tabular-nums">
                {firestorePlaybooks.length}
              </span>
              <div className="flex-1 border-t border-border ml-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {firestorePlaybooks.map((entry) => {
                const wf = entry.workflowId
                  ? getWorkflow(entry.workflowId)
                  : undefined;

                return (
                  <div
                    key={entry.id}
                    className="group flex flex-col rounded-xl border border-border bg-surface backdrop-blur-sm p-4 transition-all hover:border-border-strong hover:bg-surface-raised/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {entry.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted/50 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-violet-500/10 text-violet-400">
                        playbook
                      </span>
                    </div>
                    <h3 className="text-[13px] font-medium text-foreground/90 mb-1 group-hover:text-foreground transition-colors leading-snug">
                      {entry.title}
                    </h3>
                    <p className="text-[12px] text-muted/60 leading-relaxed line-clamp-2 flex-1">
                      {entry.body.slice(0, 120)}
                      {entry.body.length > 120 ? "..." : ""}
                    </p>

                    {wf && (
                      <Link
                        href={wf.entryRoute}
                        className="inline-flex items-center gap-1.5 text-[11px] text-accent hover:text-accent/80 mt-3 transition-colors"
                      >
                        Launch workflow &rarr;
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

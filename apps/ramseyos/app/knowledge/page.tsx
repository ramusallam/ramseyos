"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getActiveKnowledge,
  seedKnowledge,
  type KnowledgeEntry,
  type KnowledgeType,
} from "@/lib/knowledge";
import { WORKFLOWS } from "@/lib/workflows";
import Link from "next/link";

const TYPE_STYLE: Record<KnowledgeType, string> = {
  playbook: "bg-violet-500/10 text-violet-400",
  reference: "bg-sky-500/10 text-sky-400",
  note: "bg-emerald-500/10 text-emerald-400",
};

const TYPE_ICON: Record<KnowledgeType, string> = {
  playbook: "M3 2h10v12H3zM6 5h4M6 7.5h4M6 10h2",
  reference: "M2 3h12v10H2zM5 6h6M5 8.5h4",
  note: "M4 2h8v12H4zM6.5 5h3M6.5 7.5h3",
};

type FilterType = "all" | KnowledgeType;

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActiveKnowledge()
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSeed() {
    setSeeding(true);
    try {
      const count = await seedKnowledge();
      if (count > 0) {
        const fresh = await getActiveKnowledge();
        setEntries(fresh);
      }
    } catch {
      // silent
    } finally {
      setSeeding(false);
    }
  }

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const e of entries) {
      for (const t of e.tags) tagSet.add(t);
    }
    return [...tagSet].sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let result = entries;
    if (filterType !== "all") {
      result = result.filter((e) => e.type === filterType);
    }
    if (filterTag) {
      result = result.filter((e) => e.tags.includes(filterTag));
    }
    return result;
  }, [entries, filterType, filterTag]);

  const grouped = useMemo(() => {
    const groups: Record<KnowledgeType, KnowledgeEntry[]> = {
      playbook: [],
      reference: [],
      note: [],
    };
    for (const e of filtered) {
      groups[e.type].push(e);
    }
    return Object.entries(groups).filter(
      ([, items]) => items.length > 0
    ) as [KnowledgeType, KnowledgeEntry[]][];
  }, [filtered]);

  function getLinkedWorkflows(entry: KnowledgeEntry) {
    if (entry.workflowId) {
      const wf = WORKFLOWS.find((w) => w.id === entry.workflowId);
      if (wf) return [wf];
    }
    return WORKFLOWS.filter((w) =>
      w.knowledgeTags.some((t) => entry.tags.includes(t))
    );
  }

  const GROUP_LABEL: Record<KnowledgeType, string> = {
    playbook: "Playbooks",
    reference: "References",
    note: "Notes",
  };

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
            Knowledge
          </h1>
          {!loading && entries.length > 0 && (
            <span className="text-[11px] text-muted/60 tabular-nums">
              {entries.length} entries
            </span>
          )}
        </div>
        <p className="text-[13px] text-muted/50 mt-1">
          Operational knowledge, playbooks, and references that inform how
          recurring work gets done.
        </p>

        <div className="flex items-center gap-3 mt-3">
          <Link
            href="/playbooks"
            className="text-[11px] text-muted hover:text-muted/60 transition-colors"
          >
            Playbooks &rarr;
          </Link>
        </div>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">
            Loading knowledge&hellip;
          </span>
        </div>
      )}

      {/* Empty */}
      {!loading && entries.length === 0 && (
        <div className="rounded-xl border border-border bg-surface backdrop-blur-sm p-10 text-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-muted mb-4"
          >
            <path d="M3 2h10v12H3zM6 5h4M6 7.5h4M6 10h2" />
          </svg>
          <p className="text-sm text-muted/60">No knowledge entries yet.</p>
          <p className="text-[12px] text-muted mt-1 mb-5">
            Seed the initial library to get started.
          </p>
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="text-[13px] font-medium text-accent hover:text-accent/80 disabled:opacity-50 transition-colors"
          >
            {seeding ? "Seeding..." : "Seed Knowledge"}
          </button>
        </div>
      )}

      {/* Filters + Content */}
      {!loading && entries.length > 0 && (
        <div className="space-y-8">
          {/* Type filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["all", "playbook", "reference", "note"] as FilterType[]).map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(t)}
                    className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                      filterType === t
                        ? t === "all"
                          ? "bg-accent-dim text-accent"
                          : TYPE_STYLE[t as KnowledgeType]
                        : "text-muted/50 hover:text-muted/80"
                    }`}
                  >
                    {t === "all"
                      ? "All"
                      : t === "playbook"
                        ? "Playbooks"
                        : t === "reference"
                          ? "References"
                          : "Notes"}
                  </button>
                )
              )}
            </div>

            {/* Tag filters */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted/40 mr-1">Tags:</span>
                {filterTag && (
                  <button
                    type="button"
                    onClick={() => setFilterTag(null)}
                    className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-accent-dim text-accent transition-colors"
                  >
                    Clear
                  </button>
                )}
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setFilterTag(filterTag === tag ? null : tag)
                    }
                    className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${
                      filterTag === tag
                        ? "bg-accent-dim text-accent font-medium"
                        : "text-muted/50 hover:text-muted/80"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Seed button (when entries exist) */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="text-[11px] text-muted/40 hover:text-muted/60 disabled:opacity-50 transition-colors"
            >
              {seeding ? "Seeding..." : "Seed Knowledge"}
            </button>
          </div>

          {/* Grouped entries */}
          {grouped.length === 0 && (
            <p className="text-sm text-muted/50 text-center py-8">
              No matching entries found.
            </p>
          )}

          {grouped.map(([type, items]) => (
            <section key={type}>
              {/* Section header */}
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
                  <path d={TYPE_ICON[type]} />
                </svg>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {GROUP_LABEL[type]}
                </h2>
                <span className="text-[10px] text-muted tabular-nums">
                  {items.length}
                </span>
                <div className="flex-1 border-t border-border ml-2" />
              </div>

              {/* Entry cards */}
              <div className="space-y-2">
                {items.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const linkedWorkflows = getLinkedWorkflows(entry);

                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-border bg-surface backdrop-blur-sm transition-all hover:border-border-strong"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : entry.id)
                        }
                        className="w-full text-left px-4 py-3.5 flex items-start gap-3"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted shrink-0 mt-0.5"
                        >
                          <path d={TYPE_ICON[entry.type]} />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-[13px] font-medium text-foreground/90 truncate">
                              {entry.title}
                            </h3>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${TYPE_STYLE[entry.type]}`}
                            >
                              {entry.type}
                            </span>
                          </div>
                          {!isExpanded && (
                            <p className="text-[12px] text-muted/50 leading-relaxed line-clamp-1">
                              {entry.body.slice(0, 120)}
                              {entry.body.length > 120 ? "..." : ""}
                            </p>
                          )}
                          {entry.tags.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {entry.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted/50"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          className={`text-muted/40 shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        >
                          <path
                            d="M3 4.5l3 3 3-3"
                            stroke="currentColor"
                            strokeWidth="1.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {/* Expanded body */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="border-t border-border pt-3 ml-[26px]">
                            <p className="text-[12px] text-foreground/70 leading-relaxed whitespace-pre-wrap">
                              {entry.body}
                            </p>

                            {entry.url && (
                              <a
                                href={entry.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] text-accent hover:text-accent/80 mt-3 transition-colors"
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                >
                                  <path
                                    d="M4.5 2H10v5.5M10 2L3 9"
                                    stroke="currentColor"
                                    strokeWidth="1.25"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                {entry.url}
                              </a>
                            )}

                            {linkedWorkflows.length > 0 && (
                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-muted/40">
                                  Workflows:
                                </span>
                                {linkedWorkflows.map((wf) => (
                                  <Link
                                    key={wf.id}
                                    href={wf.entryRoute}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-accent-dim text-accent hover:text-accent/80 transition-colors"
                                  >
                                    {wf.shortName} &rarr;
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

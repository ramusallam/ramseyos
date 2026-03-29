"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  getActiveKnowledge,
  seedKnowledge,
  createKnowledgeEntry,
  updateKnowledgeEntry,
  archiveKnowledgeEntry,
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

const EMPTY_FORM = {
  title: "",
  body: "",
  type: "note" as KnowledgeType,
  tags: "",
  url: "",
  workflowId: "",
};

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const data = await getActiveKnowledge();
    setEntries(data);
  }, []);

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
      if (count > 0) await reload();
    } catch {
      // silent
    } finally {
      setSeeding(false);
    }
  }

  async function handleCreate() {
    if (!createForm.title.trim()) return;
    setCreating(true);
    try {
      const tags = createForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await createKnowledgeEntry({
        title: createForm.title.trim(),
        body: createForm.body.trim(),
        type: createForm.type,
        tags,
        url: createForm.url.trim() || undefined,
        workflowId: createForm.workflowId || undefined,
      });
      setCreateForm(EMPTY_FORM);
      setShowCreate(false);
      await reload();
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  }

  function startEdit(entry: KnowledgeEntry) {
    setEditingId(entry.id);
    setEditTitle(entry.title);
    setEditBody(entry.body);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateKnowledgeEntry(editingId, {
        title: editTitle.trim(),
        body: editBody.trim(),
      });
      setEditingId(null);
      await reload();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleArchive(id: string) {
    try {
      await archiveKnowledgeEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (expandedId === id) setExpandedId(null);
      if (editingId === id) setEditingId(null);
    } catch {
      // silent
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

          {/* Action bar: New Entry + Seed */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowCreate(!showCreate)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M8 3v10M3 8h10" />
              </svg>
              {showCreate ? "Cancel" : "New Entry"}
            </button>
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="text-[11px] text-muted/40 hover:text-muted/60 disabled:opacity-50 transition-colors"
            >
              {seeding ? "Seeding..." : "Seed Knowledge"}
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="rounded-xl border border-border bg-surface backdrop-blur-sm p-5 space-y-4">
              <h3 className="text-[13px] font-medium text-foreground/80">
                New Knowledge Entry
              </h3>

              {/* Title */}
              <input
                type="text"
                placeholder="Title (required)"
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm({ ...createForm, title: e.target.value })
                }
                className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-colors"
              />

              {/* Body */}
              <textarea
                placeholder="Body / content"
                value={createForm.body}
                onChange={(e) =>
                  setCreateForm({ ...createForm, body: e.target.value })
                }
                rows={4}
                className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-colors resize-y"
              />

              {/* Type + Tags row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted/50 block mb-1">
                    Type
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        type: e.target.value as KnowledgeType,
                      })
                    }
                    className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-accent/50 transition-colors"
                  >
                    <option value="note">Note</option>
                    <option value="playbook">Playbook</option>
                    <option value="reference">Reference</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted/50 block mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="teach, grading"
                    value={createForm.tags}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, tags: e.target.value })
                    }
                    className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
              </div>

              {/* URL + Workflow row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted/50 block mb-1">
                    URL (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={createForm.url}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, url: e.target.value })
                    }
                    className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted/50 block mb-1">
                    Workflow (optional)
                  </label>
                  <select
                    value={createForm.workflowId}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        workflowId: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-accent/50 transition-colors"
                  >
                    <option value="">None</option>
                    {WORKFLOWS.map((wf) => (
                      <option key={wf.id} value={wf.id}>
                        {wf.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating || !createForm.title.trim()}
                  className="text-[12px] font-medium px-4 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-40 transition-colors"
                >
                  {creating ? "Saving..." : "Create Entry"}
                </button>
              </div>
            </div>
          )}

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
                  const isEditing = editingId === entry.id;
                  const linkedWorkflows = getLinkedWorkflows(entry);

                  return (
                    <div
                      key={entry.id}
                      className="group/card rounded-xl border border-border bg-surface backdrop-blur-sm transition-all hover:border-border-strong"
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

                        {/* Archive button — visible on hover */}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(entry.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              handleArchive(entry.id);
                            }
                          }}
                          className="opacity-0 group-hover/card:opacity-100 text-[10px] text-muted/40 hover:text-rose-400 shrink-0 mt-1 transition-opacity cursor-pointer"
                          title="Archive"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M3 4v9a1 1 0 001 1h8a1 1 0 001-1V4" />
                          </svg>
                        </span>

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
                            {isEditing ? (
                              /* Inline edit mode */
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-accent/50 transition-colors"
                                />
                                <textarea
                                  value={editBody}
                                  onChange={(e) => setEditBody(e.target.value)}
                                  rows={6}
                                  className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-[12px] text-foreground/70 leading-relaxed focus:outline-none focus:border-accent/50 transition-colors resize-y"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleSaveEdit}
                                    disabled={saving || !editTitle.trim()}
                                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-40 transition-colors"
                                  >
                                    {saving ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="text-[11px] text-muted/50 hover:text-muted/80 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Read mode */
                              <>
                                <p className="text-[12px] text-foreground/70 leading-relaxed whitespace-pre-wrap">
                                  {entry.body}
                                </p>

                                {/* Edit button */}
                                <button
                                  type="button"
                                  onClick={() => startEdit(entry)}
                                  className="inline-flex items-center gap-1 text-[11px] text-muted/40 hover:text-muted/70 mt-3 transition-colors"
                                >
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M11.5 2.5l2 2L5 13H3v-2z" />
                                  </svg>
                                  Edit
                                </button>
                              </>
                            )}

                            {!isEditing && entry.url && (
                              <a
                                href={entry.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] text-accent hover:text-accent/80 mt-3 ml-4 transition-colors"
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

                            {!isEditing && linkedWorkflows.length > 0 && (
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

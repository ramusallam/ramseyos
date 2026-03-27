"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getRubrics,
  createRubric,
  archiveRubric,
  duplicateRubric,
  type Rubric,
  type RubricStatus,
} from "@/lib/rubrics";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_BADGE: Record<RubricStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-zinc-100", text: "text-zinc-500", label: "Draft" },
  active: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Active" },
  archived: { bg: "bg-zinc-50", text: "text-zinc-400", label: "Archived" },
};

export default function RubricsPage() {
  const router = useRouter();
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    getRubrics().then((r) => { setRubrics(r); setLoading(false); });
  }, []);

  const filtered = useMemo(
    () => showArchived ? rubrics : rubrics.filter((r) => r.status !== "archived"),
    [rubrics, showArchived]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Rubric[]>();
    for (const r of filtered) {
      const key = r.course?.trim() || "General";
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
  }, [filtered]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const id = await createRubric({ title: "Untitled rubric" });
      router.push(`/rubrics/${id}`);
    } catch { setCreating(false); }
  }, [router]);

  const handleDuplicate = useCallback(async (id: string) => {
    const newId = await duplicateRubric(id);
    if (newId) router.push(`/rubrics/${newId}`);
  }, [router]);

  const handleArchive = useCallback(async (id: string) => {
    await archiveRubric(id);
    setRubrics((prev) => prev.map((r) => r.id === id ? { ...r, status: "archived" as RubricStatus } : r));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading rubrics…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      <header className="mb-8">
        <Link href="/" className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors">
          &larr; Today
        </Link>
        <div className="flex items-center gap-4 mt-2">
          <h1 className="text-[20px] font-semibold text-foreground tracking-tight">Rubrics</h1>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="ml-auto text-[12px] font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
          >
            {creating ? "Creating…" : "+ New rubric"}
          </button>
        </div>
        <p className="text-[13px] text-muted/50 mt-1">
          Assessment rubrics with criteria and performance levels.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <Link href="/lesson-plans" className="text-[11px] text-muted hover:text-accent transition-colors">Lessons &rarr;</Link>
          <Link href="/grading" className="text-[11px] text-muted hover:text-accent transition-colors">Grading &rarr;</Link>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`text-[11px] px-3 py-1.5 rounded-lg transition-colors ${
              showArchived ? "bg-zinc-100 text-zinc-600 font-medium" : "text-muted/50 hover:text-muted"
            }`}
          >
            {showArchived ? "Hide archived" : "Show archived"}
          </button>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted mb-4">
            <rect x="2" y="2" width="12" height="12" rx="1.5" />
            <path d="M5 5.5h6M5 8h6M5 10.5h4" />
          </svg>
          <p className="text-sm text-muted/60 font-medium">No rubrics yet</p>
          <p className="text-[12px] text-muted mt-1">Create your first rubric to start assessing student work.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {[...grouped.entries()].map(([course, courseRubrics]) => (
            <section key={course}>
              <div className="flex items-center gap-2 mb-4">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <rect x="2" y="2" width="12" height="12" rx="1.5" />
                  <path d="M5 5.5h6M5 8h6M5 10.5h4" />
                </svg>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{course}</h2>
                <span className="text-[10px] text-muted tabular-nums">{courseRubrics.length}</span>
                <div className="flex-1 border-t border-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {courseRubrics.map((rubric) => {
                  const badge = STATUS_BADGE[rubric.status];
                  return (
                    <div
                      key={rubric.id}
                      className={`group flex flex-col rounded-xl border border-border bg-surface p-4 transition-all hover:border-border-strong hover:shadow-[var(--shadow-card-hover)] ${
                        rubric.status === "archived" ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Link href={`/rubrics/${rubric.id}`} className="flex-1 text-[13px] font-medium text-foreground/90 hover:text-foreground transition-colors leading-snug">
                          {rubric.title || "Untitled rubric"}
                        </Link>
                        <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>
                      {rubric.description && (
                        <p className="text-[12px] text-muted/50 line-clamp-2 mt-1.5">{rubric.description}</p>
                      )}
                      <div className="mt-auto pt-3 flex items-center gap-2">
                        <span className="text-[10px] text-muted tabular-nums">{rubric.criteria.length} criteria</span>
                        <span className="text-[10px] text-muted tabular-nums">{rubric.totalPoints} pts</span>
                        {rubric.version > 1 && (
                          <span className="text-[10px] text-muted tabular-nums">v{rubric.version}</span>
                        )}
                        <div className="flex-1" />
                        <button type="button" onClick={() => handleDuplicate(rubric.id)} className="text-[10px] text-muted/30 hover:text-accent transition-colors opacity-0 group-hover:opacity-100">
                          duplicate
                        </button>
                        {rubric.status !== "archived" && (
                          <button type="button" onClick={() => handleArchive(rubric.id)} className="text-[10px] text-muted/30 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                            archive
                          </button>
                        )}
                      </div>
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

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getActiveLifeItems,
  seedLifeItems,
  updateLifeItemStatus,
  type LifeItem,
  type LifeItemStatus,
} from "@/lib/life";

/* ── Style maps ── */

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  family: { bg: "bg-rose-500/10 border-rose-400/20", text: "text-rose-400/80", label: "Family", icon: "M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z" },
  home: { bg: "bg-amber-500/10 border-amber-400/20", text: "text-amber-400/80", label: "Home", icon: "M2 8.5l6-5.5 6 5.5M3.5 7.5V13a1 1 0 001 1h7a1 1 0 001-1V7.5" },
  reminder: { bg: "bg-blue-500/10 border-blue-400/20", text: "text-blue-400/80", label: "Reminder", icon: "M8 2v1M8 13v1M3.5 8H2.5M13.5 8H12.5M8 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" },
  "life-admin": { bg: "bg-slate-500/10 border-slate-400/20", text: "text-slate-400/80", label: "Life Admin", icon: "M3 3h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zM5 7h6M5 9.5h3" },
};

const CATEGORY_ORDER = ["family", "home", "reminder", "life-admin"];

function categoryMeta(cat: string) {
  return CATEGORY_STYLES[cat] ?? { bg: "bg-white/5 border-white/10", text: "text-gray-500/70", label: cat || "Other", icon: "M8 2v12M2 8h12" };
}

const STATUS_META: Record<LifeItemStatus, { dot: string; label: string }> = {
  pending: { dot: "bg-gray-300", label: "Pending" },
  in_progress: { dot: "bg-blue-400", label: "In Progress" },
  done: { dot: "bg-emerald-400", label: "Done" },
};

const STATUS_ORDER: LifeItemStatus[] = ["in_progress", "pending", "done"];

/* ── Page ── */

export default function LifePage() {
  const [items, setItems] = useState<LifeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedLifeItems().then(async () => {
      const i = await getActiveLifeItems();
      setItems(i);
      setLoading(false);
    });
  }, []);

  const setStatus = useCallback(
    async (id: string, status: LifeItemStatus) => {
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status } : x))
      );
      await updateLifeItemStatus(id, status);
    },
    []
  );

  const openCount = items.filter((i) => i.status !== "done").length;
  const recurringCount = items.filter((i) => i.recurring && i.status !== "done").length;

  /* Group by category */
  const byCategory = new Map<string, LifeItem[]>();
  for (const i of items) {
    const key = i.category || "other";
    const arr = byCategory.get(key) ?? [];
    arr.push(i);
    byCategory.set(key, arr);
  }
  const sortedCategories = Array.from(byCategory.entries()).sort(
    ([a], [b]) =>
      (CATEGORY_ORDER.indexOf(a) === -1 ? 99 : CATEGORY_ORDER.indexOf(a)) -
      (CATEGORY_ORDER.indexOf(b) === -1 ? 99 : CATEGORY_ORDER.indexOf(b))
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-8 pt-10 pb-20">
        <p className="text-sm text-muted/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 pt-10 pb-20">
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          Life
        </h1>
        <p className="text-[12px] text-muted/60 mt-1">
          {openCount} open item{openCount === 1 ? "" : "s"}
          {recurringCount > 0 && <> · {recurringCount} recurring</>}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-surface/40 p-8 text-center">
          <p className="text-[12px] text-muted/50">No life items yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedCategories.map(([cat, catItems]) => {
            const meta = categoryMeta(cat);
            const catOpen = catItems.filter((i) => i.status !== "done").length;
            const catRecurring = catItems.filter((i) => i.recurring && i.status !== "done");
            const catOther = catItems.filter((i) => !i.recurring || i.status === "done");

            return (
              <section key={cat}>
                <h2 className={`text-[10px] font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${meta.text}`}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d={meta.icon} />
                  </svg>
                  {meta.label}
                  <span className="text-muted/40 font-normal">{catOpen > 0 ? `${catOpen} open` : "all done"}</span>
                </h2>

                <div className="space-y-2">
                  {/* Recurring items first within each category */}
                  {catRecurring.map((i) => (
                    <LifeItemCard key={i.id} item={i} onStatusChange={setStatus} />
                  ))}
                  {/* Then the rest, ordered by status */}
                  {STATUS_ORDER.flatMap((s) =>
                    catOther
                      .filter((i) => i.status === s)
                      .map((i) => (
                        <LifeItemCard key={i.id} item={i} onStatusChange={setStatus} />
                      ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Life Item Card ── */

function LifeItemCard({
  item: i,
  onStatusChange,
}: {
  item: LifeItem;
  onStatusChange: (id: string, status: LifeItemStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const style = categoryMeta(i.category);
  const status = STATUS_META[i.status];
  const preview =
    i.body.length > 120 ? i.body.slice(0, 120).trimEnd() + "..." : i.body;

  return (
    <div className={`rounded-lg bg-surface border border-border/40 overflow-hidden ${i.recurring && i.status !== "done" ? "border-l-2 border-l-violet-400/30" : ""}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-surface-raised/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className={`text-[14px] font-medium ${i.status === "done" ? "text-foreground/45 line-through" : "text-foreground/85"}`}>
              {i.title}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-white/5 px-2 py-0 text-[9px] font-medium text-muted/60">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            {i.recurring && (
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/15 bg-violet-500/10 px-2 py-0 text-[9px] font-medium text-violet-400/70">
                <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.5 8a4.5 4.5 0 11-1.3-3.2" />
                  <path d="M12.5 2.5v2.3h-2.3" />
                </svg>
                Recurring
              </span>
            )}
          </div>
          {!expanded && (
            <p className="text-[12px] text-muted/50 leading-relaxed">
              {preview}
            </p>
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`shrink-0 mt-1.5 text-muted/30 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-5 py-4 space-y-4">
          <p className="text-[12px] text-foreground/65 leading-relaxed whitespace-pre-line">
            {i.body}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-muted/40 mr-1">Status</span>
            {STATUS_ORDER.map((s) => {
              const meta = STATUS_META[s];
              const isActive = i.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isActive) onStatusChange(i.id, s);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    isActive
                      ? "border-foreground/15 bg-foreground/5 text-foreground/70"
                      : "border-border/30 bg-surface text-muted/45 hover:bg-surface-raised/60 hover:text-muted/60"
                  }`}
                >
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

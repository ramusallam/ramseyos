"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getActiveAdminTemplates,
  getActiveAdminItems,
  seedAdminTemplates,
  seedAdminItems,
  updateAdminItemStatus,
  type AdminTemplate,
  type AdminItem,
  type AdminItemStatus,
} from "@/lib/admin-templates";

/* ── Style maps ── */

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "follow-up": { bg: "bg-blue-500/10 border-blue-400/20", text: "text-blue-400/80", label: "Follow-Up" },
  tracking: { bg: "bg-violet-500/10 border-violet-400/20", text: "text-violet-400/80", label: "Tracking" },
  reminder: { bg: "bg-amber-500/10 border-amber-400/20", text: "text-amber-400/80", label: "Reminder" },
  operations: { bg: "bg-emerald-500/10 border-emerald-400/20", text: "text-emerald-400/80", label: "Operations" },
};

function categoryMeta(cat: string) {
  return CATEGORY_STYLES[cat] ?? { bg: "bg-white/5 border-white/10", text: "text-gray-500/70", label: cat || "Other" };
}

const STATUS_META: Record<AdminItemStatus, { dot: string; label: string }> = {
  pending: { dot: "bg-gray-300", label: "Pending" },
  in_progress: { dot: "bg-blue-400", label: "In Progress" },
  done: { dot: "bg-emerald-400", label: "Done" },
};

const STATUS_ORDER: AdminItemStatus[] = ["in_progress", "pending", "done"];

/* ── Page ── */

export default function AdminPage() {
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([seedAdminTemplates(), seedAdminItems()]).then(async () => {
      const [t, i] = await Promise.all([
        getActiveAdminTemplates(),
        getActiveAdminItems(),
      ]);
      setTemplates(t);
      setItems(i);
      setLoading(false);
    });
  }, []);

  const setStatus = useCallback(
    async (id: string, status: AdminItemStatus) => {
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status } : x))
      );
      await updateAdminItemStatus(id, status);
    },
    []
  );

  /* Split items */
  const recurring = items.filter((i) => i.recurring && i.status !== "done");
  const nonRecurring = items.filter((i) => !i.recurring || i.status === "done");

  const statusGroups = new Map<AdminItemStatus, AdminItem[]>();
  for (const i of nonRecurring) {
    const arr = statusGroups.get(i.status) ?? [];
    arr.push(i);
    statusGroups.set(i.status, arr);
  }

  /* Template grouping */
  const templateGrouped = new Map<string, AdminTemplate[]>();
  for (const t of templates) {
    const key = t.category || "other";
    const arr = templateGrouped.get(key) ?? [];
    arr.push(t);
    templateGrouped.set(key, arr);
  }
  const categoryOrder = ["follow-up", "tracking", "reminder", "operations"];
  const sortedCategories = Array.from(templateGrouped.entries()).sort(
    ([a], [b]) =>
      (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
      (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  );

  const openCount = items.filter((i) => i.status !== "done").length;

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
          Admin
        </h1>
        <p className="text-[12px] text-muted/60 mt-1">
          {openCount} open item{openCount === 1 ? "" : "s"} · {templates.length} template{templates.length === 1 ? "" : "s"}
        </p>
      </header>

      <div className="space-y-10">
        {/* ── Recurring Operations ── */}
        {recurring.length > 0 && (
          <section>
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60 mb-3 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.5 8a4.5 4.5 0 11-1.3-3.2" />
                <path d="M12.5 2.5v2.3h-2.3" />
              </svg>
              Recurring Operations
              <span className="text-muted/40 font-normal">{recurring.length}</span>
            </h2>
            <div className="space-y-2">
              {recurring.map((i) => (
                <AdminItemCard key={i.id} item={i} onStatusChange={setStatus} />
              ))}
            </div>
          </section>
        )}

        {/* ── Items by Status ── */}
        {STATUS_ORDER.map((status) => {
          const group = statusGroups.get(status);
          if (!group || group.length === 0) return null;
          const meta = STATUS_META[status];
          return (
            <section key={status}>
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60 mb-3 flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${meta.dot}`} />
                {meta.label}
                <span className="text-muted/40 font-normal">{group.length}</span>
              </h2>
              <div className="space-y-2">
                {group.map((i) => (
                  <AdminItemCard key={i.id} item={i} onStatusChange={setStatus} />
                ))}
              </div>
            </section>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-xl border border-border/40 bg-surface/40 p-8 text-center">
            <p className="text-[12px] text-muted/50">No admin items yet.</p>
          </div>
        )}

        {/* ── Admin Templates ── */}
        <section>
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60 mb-4 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="12" height="12" rx="2" />
              <path d="M5 5h6M5 8h4M5 11h5" />
            </svg>
            Admin Templates
            <span className="text-muted/40 font-normal">{templates.length}</span>
          </h2>

          {templates.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-surface/40 p-8 text-center">
              <p className="text-[12px] text-muted/50">
                No admin templates yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedCategories.map(([cat, catItems]) => {
                const meta = categoryMeta(cat);
                return (
                  <div key={cat}>
                    <h3 className={`text-[9px] font-semibold uppercase tracking-wider mb-2.5 ${meta.text}`}>
                      {meta.label}
                      <span className="ml-2 text-muted/40 font-normal">{catItems.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {catItems.map((t) => (
                        <AdminTemplateCard key={t.id} template={t} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ── Admin Item Card ── */

function AdminItemCard({
  item: i,
  onStatusChange,
}: {
  item: AdminItem;
  onStatusChange: (id: string, status: AdminItemStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const style = categoryMeta(i.category);
  const status = STATUS_META[i.status];
  const preview =
    i.body.length > 120 ? i.body.slice(0, 120).trimEnd() + "..." : i.body;

  return (
    <div className="rounded-lg bg-surface border border-border/40 overflow-hidden">
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
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0 text-[9px] font-medium ${style.bg} ${style.text}`}
            >
              {style.label}
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

          {/* Status controls */}
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

/* ── Admin Template Card (preserved from v2) ── */

function AdminTemplateCard({ template: t }: { template: AdminTemplate }) {
  const [expanded, setExpanded] = useState(false);
  const style = categoryMeta(t.category);
  const preview =
    t.body.length > 120 ? t.body.slice(0, 120).trimEnd() + "..." : t.body;

  return (
    <div className="rounded-lg bg-surface border border-border/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-surface-raised/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-[14px] font-medium text-foreground/85">
              {t.title}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0 text-[9px] font-medium ${style.bg} ${style.text}`}
            >
              {style.label}
            </span>
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
        <div className="border-t border-border/30 px-5 py-4">
          <p className="text-[12px] text-foreground/65 leading-relaxed whitespace-pre-line">
            {t.body}
          </p>
        </div>
      )}
    </div>
  );
}

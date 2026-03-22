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

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  "follow-up": { bg: "bg-blue-500/10 border-blue-400/20", text: "text-blue-400/80", label: "Follow-Up", icon: "M2 3l5 5-5 5M8 8h6" },
  tracking: { bg: "bg-violet-500/10 border-violet-400/20", text: "text-violet-400/80", label: "Tracking", icon: "M2 2h12v12H2zM5 6h6M5 9h4" },
  reminder: { bg: "bg-amber-500/10 border-amber-400/20", text: "text-amber-400/80", label: "Reminder", icon: "M8 2v1M8 13v1M3.5 8H2.5M13.5 8H12.5M8 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" },
  operations: { bg: "bg-emerald-500/10 border-emerald-400/20", text: "text-emerald-400/80", label: "Operations", icon: "M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v3l2 2" },
};

function categoryMeta(cat: string) {
  return CATEGORY_STYLES[cat] ?? { bg: "bg-white/5 border-white/10", text: "text-muted/70", label: cat || "Other", icon: "M8 2v12M2 8h12" };
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

  /* Derived data */
  const inProgress = items.filter((i) => i.status === "in_progress");
  const pending = items.filter((i) => i.status === "pending" && !i.recurring);
  const recurring = items.filter((i) => i.recurring && i.status !== "done");
  const doneItems = items.filter((i) => i.status === "done");
  const openCount = items.filter((i) => i.status !== "done").length;

  /* Template grouping */
  const categoryOrder = ["follow-up", "tracking", "reminder", "operations"];
  const templateGrouped = new Map<string, AdminTemplate[]>();
  for (const t of templates) {
    const key = t.category || "other";
    const arr = templateGrouped.get(key) ?? [];
    arr.push(t);
    templateGrouped.set(key, arr);
  }
  const sortedTemplateCategories = Array.from(templateGrouped.entries()).sort(
    ([a], [b]) =>
      (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
      (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  );

  if (loading) {
    return (
      <div className="max-w-5xl px-4 sm:px-8 pt-10 pb-20">
        <div className="flex items-center gap-2 py-12">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-sm text-muted/60">Loading admin…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl px-4 sm:px-8 pt-10 pb-20">
      <header className="mb-10">
        <h1 className="text-xl font-normal text-foreground tracking-tight">
          Admin
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Follow-ups, operations, and recurring admin tasks.
        </p>
        {(openCount > 0 || templates.length > 0) && (
          <div className="flex items-center gap-4 mt-3">
            <Stat label="open" value={openCount} />
            {inProgress.length > 0 && <Stat label="active" value={inProgress.length} accent="blue" />}
            {recurring.length > 0 && <Stat label="recurring" value={recurring.length} accent="violet" />}
            <Stat label="templates" value={templates.length} />
          </div>
        )}
      </header>

      {/* ═══ Workflow zones ═══ */}
      <div className="space-y-10">

        {/* ── In Progress ── */}
        {inProgress.length > 0 && (
          <section>
            <SectionHeader
              icon={<><circle cx="8" cy="8" r="3" /><path d="M8 5v3l2 1" /></>}
              title="In Progress"
              count={inProgress.length}
              color="text-blue-400/80"
              ruleColor="border-blue-400/10"
            />
            <div className="space-y-2">
              {inProgress.map((i) => (
                <AdminItemCard key={i.id} item={i} onStatusChange={setStatus} />
              ))}
            </div>
          </section>
        )}

        {/* ── Recurring Operations ── */}
        {recurring.length > 0 && (
          <section>
            <SectionHeader
              icon={<><path d="M12.5 8a4.5 4.5 0 11-1.3-3.2" /><path d="M12.5 2.5v2.3h-2.3" /></>}
              title="Recurring Operations"
              count={recurring.length}
              color="text-violet-400/70"
              ruleColor="border-violet-400/10"
            />
            <div className="space-y-2">
              {recurring.map((i) => (
                <AdminItemCard key={i.id} item={i} onStatusChange={setStatus} />
              ))}
            </div>
          </section>
        )}

        {/* ── Pending ── */}
        {pending.length > 0 && (
          <section>
            <SectionHeader
              icon={<><rect x="2" y="2" width="12" height="12" rx="2" /><path d="M5 6h6M5 9h4" /></>}
              title="Pending"
              count={pending.length}
              color="text-muted"
              ruleColor="border-border/40"
            />
            <div className="space-y-2">
              {pending.map((i) => (
                <AdminItemCard key={i.id} item={i} onStatusChange={setStatus} />
              ))}
            </div>
          </section>
        )}

        {/* ── Completed ── */}
        {doneItems.length > 0 && (
          <section>
            <SectionHeader
              icon={<path d="M3 8.5l3.5 3.5 6.5-7" />}
              title="Completed"
              count={doneItems.length}
              color="text-emerald-400/60"
              ruleColor="border-emerald-400/10"
            />
            <div className="space-y-2">
              {doneItems.map((i) => (
                <AdminItemCard key={i.id} item={i} onStatusChange={setStatus} />
              ))}
            </div>
          </section>
        )}

        {items.length === 0 && (
          <EmptyState
            message="No admin items yet"
            detail="Operational items and follow-ups will appear here."
          />
        )}

        {/* ── Divider ── */}
        {templates.length > 0 && <div className="border-t border-border/30" />}

        {/* ── Admin Templates ── */}
        {templates.length > 0 && (
          <section>
            <SectionHeader
              icon={<><rect x="2" y="2" width="12" height="12" rx="2" /><path d="M5 5h6M5 8h4M5 11h5" /></>}
              title="Reference Templates"
              count={templates.length}
              color="text-muted"
              ruleColor="border-border/40"
            />

            <div className="space-y-6">
              {sortedTemplateCategories.map(([cat, catItems]) => {
                const meta = categoryMeta(cat);
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-3">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={meta.text}>
                        <path d={meta.icon} />
                      </svg>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${meta.text}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] tabular-nums text-muted/40">
                        {catItems.length}
                      </span>
                      <div className="flex-1 border-t border-border/30" />
                    </div>
                    <div className="space-y-2">
                      {catItems.map((t) => (
                        <AdminTemplateCard key={t.id} template={t} />
                      ))}
                    </div>
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

/* ── Shared UI ── */

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-400/70",
    violet: "text-violet-400/70",
    emerald: "text-emerald-400/70",
  };
  const color = accent ? colorMap[accent] ?? "text-muted/50" : "text-muted/50";
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[13px] font-medium tabular-nums ${color}`}>{value}</span>
      <span className="text-[10px] text-muted/40">{label}</span>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  color,
  ruleColor,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  color: string;
  ruleColor: string;
}) {
  return (
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
        className={color}
      >
        {icon}
      </svg>
      <h2 className={`text-[11px] font-semibold uppercase tracking-wider ${color}`}>
        {title}
      </h2>
      <span className="text-[10px] tabular-nums text-muted/40">
        {count}
      </span>
      <div className={`flex-1 border-t ${ruleColor}`} />
    </div>
  );
}

function EmptyState({ message, detail }: { message: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-surface/40 p-10 text-center">
      <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted/30 mb-4">
        <rect x="2" y="2" width="12" height="12" rx="2" />
        <path d="M5 5h6M5 8h4M5 11h5" />
      </svg>
      <p className="text-sm text-muted/60">{message}</p>
      <p className="text-[12px] text-muted/35 mt-1">{detail}</p>
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
    <div className={`rounded-lg bg-surface border border-border/40 overflow-hidden ${i.recurring && i.status !== "done" ? "border-l-2 border-l-violet-400/30" : ""}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-surface-raised/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[13px] font-medium ${i.status === "done" ? "text-foreground/45 line-through" : "text-foreground/85"}`}>
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
          {!expanded && preview && (
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
          {i.body && (
            <p className="text-[12px] text-foreground/65 leading-relaxed whitespace-pre-line">
              {i.body}
            </p>
          )}

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

/* ── Admin Template Card ── */

function AdminTemplateCard({ template: t }: { template: AdminTemplate }) {
  const [expanded, setExpanded] = useState(false);
  const preview =
    t.body.length > 120 ? t.body.slice(0, 120).trimEnd() + "..." : t.body;

  return (
    <div className="rounded-lg bg-surface border border-border/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-surface-raised/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-medium text-foreground/75">
            {t.title}
          </span>
          {!expanded && preview && (
            <p className="text-[12px] text-muted/45 leading-relaxed mt-0.5">
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
          className={`shrink-0 mt-1 text-muted/30 transition-transform ${expanded ? "rotate-180" : ""}`}
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

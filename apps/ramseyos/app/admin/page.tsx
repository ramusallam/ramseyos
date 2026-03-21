"use client";

import { useEffect, useState } from "react";
import {
  getActiveAdminTemplates,
  seedAdminTemplates,
  type AdminTemplate,
} from "@/lib/admin-templates";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  "follow-up": { bg: "bg-blue-50 border-blue-200/40", text: "text-blue-600/70", label: "Follow-Up" },
  tracking: { bg: "bg-violet-50 border-violet-200/40", text: "text-violet-600/70", label: "Tracking" },
  reminder: { bg: "bg-amber-50 border-amber-200/40", text: "text-amber-600/70", label: "Reminder" },
  operations: { bg: "bg-emerald-50 border-emerald-200/40", text: "text-emerald-600/70", label: "Operations" },
};

function categoryMeta(cat: string) {
  return CATEGORY_STYLES[cat] ?? { bg: "bg-gray-50 border-gray-200/40", text: "text-gray-500/70", label: cat || "Other" };
}

export default function AdminPage() {
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedAdminTemplates().then(async () => {
      const t = await getActiveAdminTemplates();
      setTemplates(t);
      setLoading(false);
    });
  }, []);

  const grouped = new Map<string, AdminTemplate[]>();
  for (const t of templates) {
    const key = t.category || "other";
    const arr = grouped.get(key) ?? [];
    arr.push(t);
    grouped.set(key, arr);
  }
  const categoryOrder = ["follow-up", "tracking", "reminder", "operations"];
  const sortedCategories = Array.from(grouped.entries()).sort(
    ([a], [b]) =>
      (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
      (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
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
          Admin
        </h1>
        <p className="text-[12px] text-muted/60 mt-1">
          {templates.length} template{templates.length === 1 ? "" : "s"} · Operations &amp; reusable patterns
        </p>
      </header>

      {/* Admin Templates */}
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
            {sortedCategories.map(([cat, items]) => {
              const meta = categoryMeta(cat);
              return (
                <div key={cat}>
                  <h3 className={`text-[9px] font-semibold uppercase tracking-wider mb-2.5 ${meta.text}`}>
                    {meta.label}
                    <span className="ml-2 text-muted/40 font-normal">{items.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {items.map((t) => (
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
  );
}

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

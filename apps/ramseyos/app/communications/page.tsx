"use client";

import { useEffect, useState } from "react";
import { getActiveTemplates, seedTemplates, type TemplateItem } from "@/lib/templates";

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  school: { bg: "bg-blue-50 border-blue-200/40", text: "text-blue-600/70" },
  personal: { bg: "bg-amber-50 border-amber-200/40", text: "text-amber-600/70" },
  professional: { bg: "bg-emerald-50 border-emerald-200/40", text: "text-emerald-600/70" },
};

function categoryStyle(cat: string) {
  return CATEGORY_STYLES[cat] ?? { bg: "bg-gray-50 border-gray-200/40", text: "text-gray-500/70" };
}

export default function CommunicationsPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedTemplates().then(() =>
      getActiveTemplates().then((t) => {
        setTemplates(t);
        setLoading(false);
      })
    );
  }, []);

  const grouped = new Map<string, TemplateItem[]>();
  for (const t of templates) {
    const key = t.category || "other";
    const arr = grouped.get(key) ?? [];
    arr.push(t);
    grouped.set(key, arr);
  }

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
          Communications
        </h1>
        <p className="text-[12px] text-muted/60 mt-1">
          {templates.length} template{templates.length === 1 ? "" : "s"}
        </p>
      </header>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-surface/40 p-8 text-center">
          <p className="text-[12px] text-muted/50">
            No communication templates yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => {
            const style = categoryStyle(t.category);
            const preview =
              t.body.length > 120 ? t.body.slice(0, 120).trimEnd() + "..." : t.body;
            return (
              <div
                key={t.id}
                className="rounded-lg bg-surface border border-border/40 px-5 py-4"
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-[14px] font-medium text-foreground/85">
                    {t.title}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0 text-[9px] font-medium ${style.bg} ${style.text}`}
                  >
                    {t.category}
                  </span>
                </div>
                {t.subject && (
                  <p className="text-[11px] text-foreground/50 mb-1">
                    Subject: {t.subject}
                  </p>
                )}
                <p className="text-[12px] text-muted/50 leading-relaxed whitespace-pre-line">
                  {preview}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

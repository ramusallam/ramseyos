"use client";

import { useEffect, useState } from "react";
import { getKnowledgeByTags } from "@/lib/knowledge";
import type { KnowledgeEntry } from "@/lib/knowledge";

interface ContextGuidanceProps {
  tags: string[];
  title?: string;
  maxItems?: number;
}

const TYPE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  playbook: { label: "playbook", bg: "bg-violet-500/10", text: "text-violet-400" },
  reference: { label: "reference", bg: "bg-sky-500/10", text: "text-sky-400" },
  note: { label: "note", bg: "bg-amber-500/10", text: "text-amber-400" },
};

export function ContextGuidance({ tags, title = "Guidance", maxItems = 5 }: ContextGuidanceProps) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (tags.length === 0) return;
    getKnowledgeByTags(tags).then((items) => setEntries(items.slice(0, maxItems)));
  }, [tags, maxItems]);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted/60">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v3M8 11h0" />
          </svg>
          <span className="text-[12px] font-medium text-muted/70">{title}</span>
          <span className="text-[10px] text-muted/40 tabular-nums">{entries.length}</span>
        </div>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={`text-muted/40 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {/* Content */}
      {open && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {entries.map((entry) => {
            const badge = TYPE_BADGE[entry.type] ?? TYPE_BADGE.note;
            return (
              <div key={entry.id} className="group">
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="w-full text-left flex items-start gap-2 py-1.5 hover:bg-white/[0.02] rounded-lg px-1 -mx-1 transition-colors"
                >
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium mt-0.5 shrink-0 ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                  <span className="text-[12px] text-foreground/80 block truncate flex-1 min-w-0">{entry.title}</span>
                </button>
                {expandedId === entry.id && (
                  <div className="ml-5 mt-1 mb-2 text-[11px] text-muted/60 leading-relaxed whitespace-pre-wrap">
                    {entry.body}
                    {entry.url && (
                      <a href={entry.url} target="_blank" rel="noopener" className="block mt-2 text-accent hover:underline">
                        Learn more &rarr;
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <a href="/knowledge" className="block text-[10px] text-muted/40 hover:text-muted/60 transition-colors pt-1">
            View all knowledge &rarr;
          </a>
        </div>
      )}
    </div>
  );
}

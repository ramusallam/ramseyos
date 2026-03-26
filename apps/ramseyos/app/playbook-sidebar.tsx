"use client";

import { useEffect, useState } from "react";
import { getActiveKnowledge, type KnowledgeEntry } from "@/lib/knowledge";

const TYPE_ICON: Record<string, string> = {
  playbook: "M3 2h10v12H3zM6 5h4M6 7.5h4M6 10h2",
  reference: "M2 3h12v10H2zM5 6h6M5 8.5h4",
  note: "M4 2h8v12H4zM6.5 5h3M6.5 7.5h3",
};

export function PlaybookSidebar() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getActiveKnowledge()
      .then((data) => {
        if (!cancelled) setEntries(data.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-surface-raised/40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-[12px] text-muted/50 italic">
        No playbooks yet — they'll appear here once added.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-raised cursor-default"
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
            <path d={TYPE_ICON[entry.type] ?? TYPE_ICON.note} />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-foreground/80 truncate">
              {entry.title}
            </p>
            <p className="text-[10px] text-muted/50 mt-0.5 capitalize">
              {entry.type}
              {entry.tags.length > 0 && ` · ${entry.tags.slice(0, 2).join(", ")}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

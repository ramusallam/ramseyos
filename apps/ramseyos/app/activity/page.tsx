"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getRecentActivity,
  type ActivityEntry,
  type ActivityObjectType,
} from "@/lib/activity-log";
import { toDate } from "@/lib/shared";

/* ── Presentation maps ── */

const ACTION_LABEL: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  completed: "Completed",
  archived: "Archived",
  deleted: "Deleted",
  status_changed: "Status changed",
  approved: "Approved",
  sent: "Sent",
  pinned: "Pinned",
  unpinned: "Unpinned",
};

const TYPE_META: Record<
  ActivityObjectType,
  { label: string; color: string; dot: string }
> = {
  task: { label: "Task", color: "text-sky-400", dot: "bg-sky-400" },
  project: { label: "Project", color: "text-emerald-400", dot: "bg-emerald-400" },
  "lesson-plan": { label: "Lesson", color: "text-violet-400", dot: "bg-violet-400" },
  capture: { label: "Capture", color: "text-white/50", dot: "bg-white/40" },
  draft: { label: "Draft", color: "text-indigo-400", dot: "bg-indigo-400" },
  recommendation: { label: "Rec", color: "text-orange-400", dot: "bg-orange-400" },
  knowledge: { label: "Knowledge", color: "text-cyan-400", dot: "bg-cyan-400" },
  rubric: { label: "Rubric", color: "text-amber-400", dot: "bg-amber-400" },
  "grading-job": { label: "Grading", color: "text-rose-400", dot: "bg-rose-400" },
  reflection: { label: "Reflection", color: "text-pink-400", dot: "bg-pink-400" },
  "weekly-review": { label: "Review", color: "text-teal-400", dot: "bg-teal-400" },
};

const FILTER_OPTIONS: { value: ActivityObjectType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "task", label: "Tasks" },
  { value: "project", label: "Projects" },
  { value: "lesson-plan", label: "Lessons" },
  { value: "draft", label: "Drafts" },
  { value: "recommendation", label: "Recs" },
  { value: "knowledge", label: "Knowledge" },
  { value: "capture", label: "Captures" },
];

/* ── Relative time ── */

function relativeTime(entry: ActivityEntry): string {
  const d = toDate(entry.createdAt);
  if (!d) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDay(entry: ActivityEntry): string {
  const d = toDate(entry.createdAt);
  if (!d) return "Unknown";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - entryDay.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Page ── */

export default function ActivityPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityObjectType | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getRecentActivity(
      100,
      filter === "all" ? undefined : filter
    );
    setEntries(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // Group entries by day
  const grouped = useMemo(() => {
    const groups: { day: string; items: ActivityEntry[] }[] = [];
    let currentDay = "";
    for (const entry of entries) {
      const day = formatDay(entry);
      if (day !== currentDay) {
        currentDay = day;
        groups.push({ day, items: [] });
      }
      groups[groups.length - 1].items.push(entry);
    }
    return groups;
  }, [entries]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">
          Activity
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          What changed recently across the system.
        </p>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              filter === opt.value
                ? "bg-accent/[0.12] text-accent"
                : "text-muted hover:text-foreground/70 hover:bg-surface-raised/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-12 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading activity...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && entries.length === 0 && (
        <div className="rounded-xl border border-border bg-surface backdrop-blur-sm p-12 text-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-muted/20 mb-5"
          >
            <path d="M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v3l2 1" />
          </svg>
          <p className="text-[16px] text-muted/50 font-medium">No activity yet</p>
          <p className="text-[13px] text-muted/40 mt-2">
            Activity will appear here as you create, update, and complete items across the system.
          </p>
        </div>
      )}

      {/* Grouped entries */}
      {!loading && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.day}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">
                  {group.day}
                </span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Entries */}
              <ul className="space-y-1">
                {group.items.map((entry) => {
                  const meta = TYPE_META[entry.objectType] ?? {
                    label: entry.objectType,
                    color: "text-muted",
                    dot: "bg-muted/40",
                  };

                  const inner = (
                    <>
                      {/* Type dot */}
                      <span
                        className={`size-2 rounded-full shrink-0 ${meta.dot}`}
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] text-foreground/85 group-hover:text-foreground transition-colors">
                          <span className="text-muted/60">
                            {ACTION_LABEL[entry.action] ?? entry.action}
                          </span>{" "}
                          <span className="font-medium truncate">
                            {entry.label}
                          </span>
                        </span>
                        {entry.detail && (
                          <span className="text-[11px] text-muted/40 block mt-0.5 truncate">
                            {entry.detail}
                          </span>
                        )}
                      </div>

                      {/* Type badge */}
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${meta.color} bg-white/[0.04]`}
                      >
                        {meta.label}
                      </span>

                      {/* Time */}
                      <span className="text-[10px] text-muted/40 shrink-0 tabular-nums">
                        {relativeTime(entry)}
                      </span>
                    </>
                  );

                  const cls = "group flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-surface-raised/40";

                  return (
                    <li key={entry.id}>
                      {entry.href ? (
                        <Link href={entry.href} className={cls}>
                          {inner}
                        </Link>
                      ) : (
                        <div className={cls}>
                          {inner}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

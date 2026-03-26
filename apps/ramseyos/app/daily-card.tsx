"use client";

import { useState } from "react";
import {
  type DailyPlan,
  type TimelineItem,
  type LifeContextItem,
} from "@/lib/orchestration";
import { type AdminItem } from "@/lib/admin-templates";
import { formatDailyCardText } from "@/lib/daily-card-format";
import { PRIORITY_STYLE } from "@/lib/shared";
import { shareOrCopy, copyToClipboard } from "@/lib/platform";
import { toggleTaskCompleted } from "@/lib/tasks";
import {
  TYPE_DOT,
  TYPE_LABEL,
  LIFE_CAT_DOT,
  ADMIN_CAT_DOT,
  ADMIN_CAT_LABEL,
  fmtCardTime,
  fmtCardDate,
} from "@/lib/daily-card-constants";
import Link from "next/link";

interface DailyCardProps {
  plan: DailyPlan;
  adminActive: AdminItem[];
}

export function DailyCard({ plan, adminActive }: DailyCardProps) {
  const [copied, setCopied] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  function handleTaskComplete(id: string) {
    setCompletedIds((prev) => new Set(prev).add(id));
  }

  const scheduleItems = plan.timeline.filter((i) => i.type === "schedule");
  const taskItems = plan.timeline.filter(
    (i) => i.type === "chosen" || i.type === "focus"
  );
  const dailyActions = plan.timeline.filter((i) => i.type === "daily-action");

  const hasContext = plan.lifeContext.length > 0 || adminActive.length > 0;

  async function handleCopy() {
    const text = formatDailyCardText(plan);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    const text = formatDailyCardText(plan);
    const result = await shareOrCopy({ title: `RamseyOS — ${fmtCardDate()}`, text });
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-5">
      {/* Card header */}
      <div className="flex items-center gap-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted/50">
          Daily plan
        </h2>
        <span className="text-[9px] text-muted tabular-nums">
          {plan.timeline.length} item{plan.timeline.length !== 1 ? "s" : ""}
        </span>
        <div className="flex-1 border-t border-border" />
        {/* Delivery actions */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-md text-muted hover:text-muted/60 hover:bg-surface-raised transition-colors"
            aria-label="Copy daily card"
          >
            {copied ? (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M3.5 8.5l3 3 6-7" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="5" width="8" height="8" rx="1.5" />
                <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-md text-muted hover:text-muted/60 hover:bg-surface-raised transition-colors"
            aria-label="Share daily card"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8v5a1 1 0 001 1h6a1 1 0 001-1V8" />
              <path d="M8 2v8M5 5l3-3 3 3" />
            </svg>
          </button>
          <Link
            href="/today"
            className="p-1.5 rounded-md text-muted hover:text-muted/60 hover:bg-surface-raised transition-colors"
            aria-label="Open mobile daily card"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="1" width="8" height="14" rx="2" />
              <path d="M7 12h2" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Schedule */}
      {scheduleItems.length > 0 && (
        <div>
          <SectionLabel
            icon="M2 7h12M5 1.5v3M11 1.5v3"
            label="Schedule"
            count={scheduleItems.length}
          />
          <ul className="space-y-0.5">
            {scheduleItems.map((item) => (
              <ScheduleRow key={`schedule-${item.id}`} item={item} />
            ))}
          </ul>
        </div>
      )}

      {/* Tasks */}
      {taskItems.length > 0 && (
        <div>
          <SectionLabel
            icon="M5.5 8l2 2 3-4"
            label="Tasks"
            count={taskItems.length}
            completedCount={completedIds.size}
          />
          <ul className="space-y-0.5">
            {taskItems.map((item) => (
              <TaskRow key={`${item.type}-${item.id}`} item={item} onComplete={handleTaskComplete} />
            ))}
          </ul>
        </div>
      )}

      {/* Daily Actions */}
      {dailyActions.length > 0 && (
        <div>
          <SectionLabel
            icon="M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v3l2 1"
            label="Daily"
            count={dailyActions.length}
          />
          <ul className="space-y-0.5">
            {dailyActions.map((item) => (
              <li key={`daily-${item.id}`} className="flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-raised">
                <span className="size-2 shrink-0 rounded-full bg-gray-400" />
                <span className="flex-1 text-[13px] text-foreground/60 truncate">
                  {item.title}
                </span>
                <span className="text-[9px] text-muted shrink-0">routine</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.timeline.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted/20">
            <path d="M8 2a6 6 0 100 12A6 6 0 008 2z" />
            <path d="M8 5v3l2 1" />
          </svg>
          <p className="text-[13px] text-muted">Nothing planned for today</p>
          <p className="text-[11px] text-muted">Add tasks or schedule events to build your day.</p>
        </div>
      )}

      {/* Teach — lesson plans + Spark */}
      <TeachNudge />

      {/* Inbox nudge */}
      <InboxNudge count={plan.inboxItems.length} />

      {/* Context — life + ops */}
      {hasContext && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <path d="M8 2a6 6 0 100 12A6 6 0 008 2z" />
            </svg>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted/60">
              Context
            </h3>
            <span className="text-[9px] text-muted tabular-nums">{plan.lifeContext.length + adminActive.length}</span>
            <div className="flex-1" />
            {plan.lifeContext.length > 0 && (
              <Link
                href="/life"
                className="text-[10px] text-muted hover:text-muted/60 transition-colors"
              >
                Life &rarr;
              </Link>
            )}
            {adminActive.length > 0 && (
              <Link
                href="/admin"
                className="text-[10px] text-muted hover:text-muted/60 transition-colors"
              >
                Admin &rarr;
              </Link>
            )}
          </div>

          {/* Life items */}
          {plan.lifeContext.length > 0 && (
            <ul className="space-y-0.5">
              {plan.lifeContext.map((item) => (
                <LifeContextRow key={`life-${item.id}`} item={item} />
              ))}
            </ul>
          )}

          {/* Admin items — visually separated when both present */}
          {adminActive.length > 0 && (
            <>
              {plan.lifeContext.length > 0 && (
                <div className="flex items-center gap-2 mt-2 mb-1 px-3">
                  <div className="flex-1 border-t border-border/20" />
                  <span className="text-[8px] uppercase tracking-widest text-muted">ops</span>
                  <div className="flex-1 border-t border-border/20" />
                </div>
              )}
              <ul className="space-y-0.5">
                {adminActive.map((item) => (
                  <AdminContextRow key={`ops-${item.id}`} item={item} />
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Section label ── */

function SectionLabel({
  icon,
  label,
  count,
  completedCount,
}: {
  icon: string;
  label: string;
  count?: number;
  completedCount?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
        <path d={icon} />
      </svg>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted/60">
        {label}
      </h3>
      {count !== undefined && (
        <span className="text-[9px] text-muted tabular-nums">{count}</span>
      )}
      {completedCount !== undefined && completedCount > 0 && (
        <span className="text-[9px] text-emerald-400/60 tabular-nums font-medium">
          {completedCount} done
        </span>
      )}
    </div>
  );
}

/* ── Inbox nudge — compact inline ── */

function InboxNudge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
        <span className="size-1.5 shrink-0 rounded-full bg-emerald-400/40" />
        <span className="text-[12px] text-muted italic">Inbox clear</span>
      </div>
    );
  }

  return (
    <Link
      href="/inbox"
      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-surface-raised group"
    >
      <span className="size-1.5 shrink-0 rounded-full bg-amber-400" />
      <span className="text-[12px] text-foreground/60 group-hover:text-foreground/80 transition-colors">
        {count} inbox item{count !== 1 ? "s" : ""} to review
      </span>
      <span className="ml-auto text-[10px] text-accent/60 group-hover:text-accent transition-colors font-medium">
        Review &rarr;
      </span>
    </Link>
  );
}

/* ── Schedule row ── */

function ScheduleRow({ item }: { item: TimelineItem }) {
  const now = new Date();
  const isPast =
    item.endTime ? item.endTime.toDate() < now : false;
  const isActive =
    item.startTime && item.endTime
      ? item.startTime.toDate() <= now && item.endTime.toDate() > now
      : false;

  return (
    <li
      className={`flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-raised ${
        isPast ? "opacity-30" : ""
      } ${isActive ? "bg-emerald-500/[0.04]" : ""}`}
    >
      {isActive ? (
        <span className="size-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
      ) : (
        <span className="size-2 shrink-0 rounded-full bg-sky-500" />
      )}

      {item.startTime && item.endTime ? (
        <span className={`text-[11px] tabular-nums shrink-0 w-28 ${
          isActive ? "text-emerald-400/80 font-medium" : "text-muted/60"
        }`}>
          {fmtCardTime(item.startTime)} – {fmtCardTime(item.endTime)}
        </span>
      ) : (
        <span className="text-[10px] text-muted uppercase tracking-wide shrink-0 w-28 font-medium">
          {TYPE_LABEL[item.type]}
        </span>
      )}

      <span className={`flex-1 text-[13px] truncate ${
        isActive ? "text-foreground font-medium" : "text-foreground/70"
      }`}>
        {item.title}
      </span>

      {isActive && (
        <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
          now
        </span>
      )}

      {item.source === "google" && !isActive && (
        <span className="text-[9px] text-muted shrink-0">
          gcal
        </span>
      )}
    </li>
  );
}

/* ── Task row — completable inline ── */

function TaskRow({ item, onComplete }: { item: TimelineItem; onComplete?: (id: string) => void }) {
  const [done, setDone] = useState(false);
  const canComplete = item.type === "chosen" || item.type === "focus";

  async function handleComplete() {
    if (!canComplete || done) return;
    setDone(true);
    await toggleTaskCompleted(item.id, false);
    onComplete?.(item.id);
  }

  return (
    <li className={`flex items-center gap-3 rounded-lg px-3 py-1.5 transition-all hover:bg-surface-raised ${done ? "opacity-30" : ""}`}>
      {canComplete ? (
        <button
          type="button"
          onClick={handleComplete}
          className={`size-4 shrink-0 rounded border-[1.5px] transition-colors flex items-center justify-center ${
            done
              ? "border-accent/40 bg-accent/20"
              : "border-muted/25 hover:border-accent/40"
          }`}
          aria-label="Mark complete"
        >
          {done && (
            <svg viewBox="0 0 16 16" className="size-2.5 text-accent">
              <path d="M4.5 8.5L7 11l4.5-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      ) : (
        <span className={`size-2 shrink-0 rounded-full ${TYPE_DOT[item.type]}`} />
      )}

      <span className="text-[10px] text-muted uppercase tracking-wide shrink-0 w-28 font-medium">
        {TYPE_LABEL[item.type]}
      </span>

      <span className={`flex-1 text-[13px] truncate ${done ? "text-muted line-through" : "text-foreground/70"}`}>
        {item.title}
      </span>

      {item.projectName && (
        <span className="text-[9px] text-muted shrink-0 truncate max-w-[80px]">
          {item.projectName}
        </span>
      )}

      {item.priority && !done && (
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
            PRIORITY_STYLE[item.priority] ?? "text-muted"
          }`}
        >
          {item.priority}
        </span>
      )}
    </li>
  );
}

/* ── Life Context row ── */

function LifeContextRow({ item }: { item: LifeContextItem }) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-raised">
      <span
        className={`size-1.5 shrink-0 rounded-full ${LIFE_CAT_DOT[item.category] ?? "bg-gray-400"}`}
      />
      <span className="flex-1 text-[13px] text-foreground/60 truncate">
        {item.title}
      </span>
      {item.recurring && (
        <span className="text-[9px] text-violet-400/50 shrink-0">
          recurring
        </span>
      )}
      <span className="text-[9px] text-muted shrink-0">
        {item.category === "life-admin" ? "life admin" : item.category}
      </span>
    </li>
  );
}

/* ── Admin Context row ── */

function AdminContextRow({ item }: { item: AdminItem }) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-raised">
      <span className={`size-1.5 shrink-0 rounded-full ${ADMIN_CAT_DOT[item.category] ?? "bg-blue-400"}`} />
      <span className="flex-1 text-[13px] text-foreground/60 truncate">
        {item.title}
      </span>
      {item.recurring && (
        <span className="text-[9px] text-violet-400/50 shrink-0">
          recurring
        </span>
      )}
      <span className="text-[9px] text-muted shrink-0">
        {ADMIN_CAT_LABEL[item.category] ?? "ops"}
      </span>
    </li>
  );
}

/* ── Teach nudge — classroom quick-access ── */

function TeachNudge() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-surface-raised group">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400/50 shrink-0">
        <rect x="3" y="1" width="10" height="14" rx="1.5" />
        <path d="M5.5 5h5M5.5 8h3" />
      </svg>
      <Link
        href="/lesson-plans"
        className="flex-1 text-[12px] text-foreground/50 group-hover:text-foreground/70 transition-colors"
      >
        Lesson Plans
      </Link>
      <Link
        href="/materials"
        className="text-[10px] text-muted hover:text-muted/60 transition-colors"
      >
        Materials
      </Link>
      <span className="text-muted/15">·</span>
      <a
        href="https://sparklearningstudio.ai"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-amber-400/40 hover:text-amber-400/70 transition-colors font-medium"
      >
        Spark ↗
      </a>
    </div>
  );
}

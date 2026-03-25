"use client";

import { useEffect, useState, useRef } from "react";
import {
  generateDailyPlan,
  type DailyPlan,
  type TimelineItem,
  type LifeContextItem,
} from "@/lib/orchestration";
import { formatDailyCardText } from "@/lib/daily-card-format";
import { createCapture } from "@/lib/captures";
import { PRIORITY_STYLE } from "@/lib/shared";
import { shareOrCopy, copyToClipboard } from "@/lib/platform";
import { toggleTaskCompleted } from "@/lib/tasks";
import {
  DAY_MODE_META,
  TYPE_DOT,
  TYPE_LABEL,
  LIFE_CAT_DOT,
  fmtCardTime,
  fmtCardDate,
} from "@/lib/daily-card-constants";
import Link from "next/link";

/* ── Now/Next selection — matches desktop logic ── */

const NEAR_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

function getActiveItem(timeline: TimelineItem[]): TimelineItem | null {
  const now = new Date();

  const active = timeline.find(
    (i) =>
      i.type === "schedule" &&
      i.startTime &&
      i.endTime &&
      i.startTime.toDate() <= now &&
      i.endTime.toDate() > now
  );
  if (active) return active;

  const nearUpcoming = timeline.find(
    (i) =>
      i.type === "schedule" &&
      i.startTime &&
      i.startTime.toDate() > now &&
      i.startTime.toDate().getTime() - now.getTime() <= NEAR_THRESHOLD_MS
  );
  if (nearUpcoming) return nearUpcoming;

  const task = timeline.find(
    (i) => i.type === "chosen" || i.type === "focus"
  );
  if (task) return task;

  const upcoming = timeline.find(
    (i) => i.type === "schedule" && i.startTime && i.startTime.toDate() > now
  );
  if (upcoming) return upcoming;

  return timeline.find((i) => i.type === "daily-action") ?? null;
}

function getNextItem(timeline: TimelineItem[], currentId: string): TimelineItem | null {
  const now = new Date();
  const idx = timeline.findIndex((i) => `${i.type}-${i.id}` === currentId);
  if (idx === -1) return null;

  for (let i = idx + 1; i < timeline.length; i++) {
    const item = timeline[i];
    if (item.type === "schedule" && item.endTime && item.endTime.toDate() <= now) {
      continue;
    }
    return item;
  }
  return null;
}

function getRelativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  if (diffMs < 0) return "";
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "starting now";
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (remaining === 0) return `in ${hrs}h`;
  return `in ${hrs}h ${remaining}m`;
}

/* ── Page ── */

export default function MobileDailyCard() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    generateDailyPlan().then(setPlan);
  }, []);

  async function handleCopy() {
    if (!plan) return;
    const text = formatDailyCardText(plan);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (!plan) return;
    const text = formatDailyCardText(plan);
    const result = await shareOrCopy({ title: `RamseyOS — ${fmtCardDate()}`, text });
    if (result === "shared") {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } else if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!plan) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted/40">Loading your day…</span>
        </div>
      </div>
    );
  }

  const mode = DAY_MODE_META[plan.dayMode];
  const nowItem = getActiveItem(plan.timeline);
  const nowKey = nowItem ? `${nowItem.type}-${nowItem.id}` : "";
  const nextItem = nowItem ? getNextItem(plan.timeline, nowKey) : null;

  const scheduleItems = plan.timeline.filter((i) => i.type === "schedule");
  const taskItems = plan.timeline.filter(
    (i) => i.type === "chosen" || i.type === "focus"
  );
  const dailyActions = plan.timeline.filter((i) => i.type === "daily-action");

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-5 pt-safe-top pb-safe-bottom">
      <div className="py-6 sm:py-8 space-y-6">
        {/* Header */}
        <header className="px-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent/70">
              RamseyOS
            </p>
            {/* Delivery actions */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-lg text-muted/40 hover:text-foreground/70 hover:bg-surface-raised/50 transition-colors active:scale-95"
                aria-label="Copy daily card"
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="5" width="8" height="8" rx="1.5" />
                    <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-lg text-muted/40 hover:text-foreground/70 hover:bg-surface-raised/50 transition-colors active:scale-95"
                aria-label="Share daily card"
              >
                {shared ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 8v5a1 1 0 001 1h6a1 1 0 001-1V8" />
                    <path d="M8 2v8M5 5l3-3 3 3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-foreground mt-1">{fmtCardDate()}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={mode.color}>
              <path d={mode.icon} />
            </svg>
            <span className={`text-[12px] font-medium ${mode.color}`}>
              {mode.label}
            </span>
            <span className="text-[10px] text-muted/25 tabular-nums">
              · {plan.timeline.length} item{plan.timeline.length !== 1 ? "s" : ""}
            </span>
          </div>
        </header>

        {/* Now / Next */}
        {nowItem && (
          <section className="space-y-2">
            <MobileNowCard item={nowItem} />
            {nextItem && <MobileNextCard item={nextItem} />}
          </section>
        )}

        {/* Schedule */}
        {scheduleItems.length > 0 && (
          <section>
            <SectionHeader label="Schedule" count={scheduleItems.length} />
            <ul className="space-y-1.5">
              {scheduleItems.map((item) => (
                <ScheduleRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
        )}

        {/* Tasks */}
        {taskItems.length > 0 && (
          <section>
            <SectionHeader label="Tasks" count={taskItems.length} />
            <ul className="space-y-1.5">
              {taskItems.map((item) => (
                <TaskRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
        )}

        {/* Daily Actions */}
        {dailyActions.length > 0 && (
          <section>
            <SectionHeader label="Daily" count={dailyActions.length} />
            <ul className="space-y-1.5">
              {dailyActions.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-surface/50 backdrop-blur-sm border border-border/50 px-4 py-3.5"
                >
                  <span className="size-2 shrink-0 rounded-full bg-gray-400" />
                  <span className="flex-1 text-[14px] text-foreground/70">
                    {item.title}
                  </span>
                  <span className="text-[9px] text-muted/30 shrink-0">routine</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Life Context */}
        {plan.lifeContext.length > 0 && (
          <section>
            <SectionHeader label="Life" count={plan.lifeContext.length} />
            <ul className="space-y-1.5">
              {plan.lifeContext.map((item) => (
                <LifeRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
        )}

        {/* Inbox nudge */}
        {plan.inboxItems.length > 0 && (
          <Link
            href="/inbox"
            className="flex items-center gap-3 rounded-xl bg-amber-500/[0.06] backdrop-blur-sm border border-amber-500/15 px-4 py-3.5 transition-colors active:bg-amber-500/10"
          >
            <span className="size-2 shrink-0 rounded-full bg-amber-500" />
            <span className="flex-1 text-[14px] text-foreground/70">
              {plan.inboxItems.length} inbox item{plan.inboxItems.length !== 1 ? "s" : ""} to review
            </span>
            <span className="text-[10px] text-accent/60 font-medium shrink-0">
              Review
            </span>
          </Link>
        )}

        {/* Empty state */}
        {plan.timeline.length === 0 && plan.inboxItems.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted/20">
              <path d="M8 2a6 6 0 100 12A6 6 0 008 2z" />
              <path d="M8 5v3l2 1" />
            </svg>
            <p className="text-[14px] text-muted/40">Nothing planned for today</p>
            <p className="text-[12px] text-muted/25">Capture something to get started.</p>
          </div>
        )}

        {/* Quick capture */}
        <MobileQuickCapture />

        {/* Footer navigation */}
        <footer className="pt-2 pb-4 space-y-3">
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/capture"
              className="text-[12px] text-accent/60 hover:text-accent transition-colors font-medium"
            >
              Full Capture
            </Link>
            <span className="text-muted/20">·</span>
            <Link
              href="/"
              className="text-[12px] text-muted/40 hover:text-muted/70 transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-muted/20">·</span>
            <Link
              href="/inbox"
              className="text-[12px] text-muted/40 hover:text-muted/70 transition-colors"
            >
              Inbox
            </Link>
          </div>
          <p className="text-[10px] text-muted/25 tracking-wide text-center">
            RamseyOS · {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ── Mobile Quick Capture ── */

function MobileQuickCapture() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      await createCapture({ text: trimmed, source: "mobile" });
      setText("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted/40 shrink-0">
          <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Quick capture…"
          className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted/40 outline-none"
          disabled={saving}
        />
        {saved ? (
          <span className="text-[12px] text-emerald-400/70 flex items-center gap-1.5 shrink-0">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Sent → inbox
          </span>
        ) : text.trim() ? (
          <button
            type="submit"
            disabled={saving}
            className="text-[13px] font-medium text-accent hover:text-accent/80 transition-colors px-2 py-1 rounded-lg active:scale-95 shrink-0"
          >
            {saving ? "…" : "Add"}
          </button>
        ) : null}
      </form>
    </section>
  );
}

/* ── Section header ── */

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">
        {label}
      </h2>
      <span className="text-[10px] text-muted/35 tabular-nums">{count}</span>
    </div>
  );
}

/* ── Now card ── */

function MobileNowCard({ item }: { item: TimelineItem }) {
  const now = new Date();
  const isInProgress =
    item.type === "schedule" &&
    item.startTime &&
    item.endTime &&
    item.startTime.toDate() <= now &&
    item.endTime.toDate() > now;

  const startsIn =
    item.type === "schedule" && item.startTime && !isInProgress
      ? getRelativeTime(item.startTime.toDate())
      : null;

  return (
    <div className="rounded-2xl border border-accent/20 bg-surface/70 backdrop-blur-sm p-5 shadow-[var(--glow-accent)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent/70">
          Now
        </span>
        {isInProgress && (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            In progress
          </span>
        )}
        {startsIn && (
          <span className="text-[9px] font-medium text-muted/40">
            {startsIn}
          </span>
        )}
      </div>
      <div className="flex items-start gap-3">
        <span className={`size-2.5 shrink-0 rounded-full mt-1.5 ${TYPE_DOT[item.type]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-medium text-foreground leading-snug">
            {item.title}
          </p>
          <p className="text-[12px] text-muted/50 mt-1">
            {item.startTime && item.endTime
              ? `${fmtCardTime(item.startTime)} – ${fmtCardTime(item.endTime)}`
              : TYPE_LABEL[item.type]}
            {item.projectName && (
              <span className="text-muted/35"> · {item.projectName}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Next card ── */

function MobileNextCard({ item }: { item: TimelineItem }) {
  const startsIn =
    item.type === "schedule" && item.startTime
      ? getRelativeTime(item.startTime.toDate())
      : null;

  return (
    <div className="rounded-2xl border border-border/50 bg-surface/50 backdrop-blur-sm px-5 py-3.5">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/40 shrink-0">
          Next
        </span>
        <span className={`size-2 shrink-0 rounded-full ${TYPE_DOT[item.type]}`} />
        <p className="flex-1 text-[14px] text-foreground/80 truncate">
          {item.title}
        </p>
        {startsIn ? (
          <span className="text-[10px] text-muted/40 tabular-nums shrink-0">
            {startsIn}
          </span>
        ) : item.startTime && item.endTime ? (
          <span className="text-[11px] text-muted/40 tabular-nums shrink-0">
            {fmtCardTime(item.startTime)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ── Schedule row ── */

function ScheduleRow({ item }: { item: TimelineItem }) {
  const now = new Date();
  const isPast = item.endTime ? item.endTime.toDate() < now : false;
  const isActive =
    item.startTime && item.endTime
      ? item.startTime.toDate() <= now && item.endTime.toDate() > now
      : false;

  return (
    <li
      className={`flex items-center gap-3 rounded-xl bg-surface/50 backdrop-blur-sm border border-border/50 px-4 py-3.5 ${
        isPast ? "opacity-30" : ""
      } ${isActive ? "border-emerald-500/20 bg-emerald-500/[0.04]" : ""}`}
    >
      {isActive ? (
        <span className="size-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
      ) : (
        <span className="size-2 shrink-0 rounded-full bg-sky-500" />
      )}
      <span className={`text-[12px] tabular-nums shrink-0 min-w-[6rem] ${
        isActive ? "text-emerald-400/80 font-medium" : "text-muted/60"
      }`}>
        {item.startTime && item.endTime
          ? `${fmtCardTime(item.startTime)} – ${fmtCardTime(item.endTime)}`
          : ""}
      </span>
      <span className={`flex-1 text-[14px] truncate ${
        isActive ? "text-foreground font-medium" : "text-foreground/80"
      }`}>
        {item.title}
      </span>
      {isActive && (
        <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
          now
        </span>
      )}
    </li>
  );
}

/* ── Task row — completable inline ── */

function TaskRow({ item }: { item: TimelineItem }) {
  const [done, setDone] = useState(false);

  async function handleComplete() {
    if (done) return;
    setDone(true);
    await toggleTaskCompleted(item.id, false);
  }

  return (
    <li className={`flex items-center gap-3 rounded-xl bg-surface/50 backdrop-blur-sm border border-border/50 px-4 py-3.5 transition-all ${done ? "opacity-30" : ""}`}>
      <button
        type="button"
        onClick={handleComplete}
        className={`size-5 shrink-0 rounded-lg border-2 transition-colors flex items-center justify-center active:scale-95 ${
          done
            ? "border-accent/40 bg-accent/20"
            : "border-muted/25 active:border-accent/40"
        }`}
        aria-label="Mark complete"
      >
        {done && (
          <svg viewBox="0 0 16 16" className="size-3 text-accent">
            <path d="M4.5 8.5L7 11l4.5-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <span className={`flex-1 text-[14px] truncate ${done ? "text-muted/40 line-through" : "text-foreground/80"}`}>
        {item.title}
      </span>
      {item.projectName && !done && (
        <span className="text-[10px] text-muted/40 shrink-0 truncate max-w-[80px]">
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

/* ── Life row ── */

function LifeRow({ item }: { item: LifeContextItem }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-surface/50 backdrop-blur-sm border border-border/50 px-4 py-3.5">
      <span
        className={`size-2 shrink-0 rounded-full ${LIFE_CAT_DOT[item.category] ?? "bg-gray-400"}`}
      />
      <span className="flex-1 text-[14px] text-foreground/70 truncate">
        {item.title}
      </span>
      {item.recurring && (
        <span className="text-[9px] text-violet-400/60 shrink-0">recurring</span>
      )}
    </li>
  );
}

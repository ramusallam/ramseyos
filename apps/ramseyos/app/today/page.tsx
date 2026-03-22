"use client";

import { useEffect, useState } from "react";
import {
  generateDailyPlan,
  type DailyPlan,
  type DayMode,
  type TimelineItem,
  type TimelineItemType,
  type LifeContextItem,
} from "@/lib/orchestration";
import { type Timestamp } from "firebase/firestore";

/* ── Constants ── */

const DAY_MODE_META: Record<DayMode, { label: string; icon: string; color: string }> = {
  scheduled: { label: "Scheduled day", icon: "M2 7h12M5 1.5v3M11 1.5v3", color: "text-sky-400" },
  "deep-work": { label: "Deep work day", icon: "M8 2v12M4 6l4-4 4 4", color: "text-violet-400" },
  "life-focus": { label: "Life focus day", icon: "M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z", color: "text-rose-400" },
  balanced: { label: "Balanced day", icon: "M2 8h12M8 2v12", color: "text-emerald-400" },
  light: { label: "Light day", icon: "M8 2a6 6 0 100 12A6 6 0 008 2z", color: "text-amber-400" },
};

const TYPE_DOT: Record<TimelineItemType, string> = {
  schedule: "bg-sky-500",
  chosen: "bg-indigo-500",
  focus: "bg-rose-500",
  "daily-action": "bg-gray-400",
};

const TYPE_LABEL: Record<TimelineItemType, string> = {
  schedule: "event",
  chosen: "today",
  focus: "priority",
  "daily-action": "daily",
};

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-rose-500/10 text-rose-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-sky-500/10 text-sky-400",
};

const LIFE_CAT_DOT: Record<string, string> = {
  family: "bg-rose-400",
  home: "bg-amber-400",
  reminder: "bg-blue-400",
  "life-admin": "bg-slate-400",
};

function formatTime(ts: Timestamp): string {
  return ts.toDate().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/* ── Now/Next selection ── */

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

  const upcoming = timeline.find(
    (i) => i.type === "schedule" && i.startTime && i.startTime.toDate() > now
  );
  if (upcoming) return upcoming;

  return timeline.find((i) => i.type !== "schedule") ?? null;
}

function getNextItem(timeline: TimelineItem[], currentId: string): TimelineItem | null {
  const idx = timeline.findIndex((i) => `${i.type}-${i.id}` === currentId);
  if (idx === -1 || idx + 1 >= timeline.length) return null;
  return timeline[idx + 1];
}

/* ── Page ── */

export default function MobileDailyCard() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);

  useEffect(() => {
    generateDailyPlan().then(setPlan);
  }, []);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
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
    <div className="max-w-lg mx-auto px-5 py-8 pb-16 space-y-8">
      {/* Header */}
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-1">
          RamseyOS
        </p>
        <h1 className="text-lg font-semibold text-foreground">{formatDate()}</h1>
        <div className="flex items-center gap-2 mt-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={mode.color}>
            <path d={mode.icon} />
          </svg>
          <span className={`text-[12px] font-medium ${mode.color}`}>
            {mode.label}
          </span>
        </div>
      </header>

      {/* Now / Next */}
      {nowItem && (
        <section className="space-y-3">
          <MobileNowCard item={nowItem} />
          {nextItem && <MobileNextCard item={nextItem} />}
        </section>
      )}

      {/* Schedule */}
      {scheduleItems.length > 0 && (
        <section>
          <SectionHeader label="Schedule" count={scheduleItems.length} />
          <ul className="space-y-1">
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
          <ul className="space-y-1">
            {taskItems.map((item) => (
              <TaskRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}

      {/* Daily Actions */}
      {dailyActions.length > 0 && (
        <section>
          <SectionHeader label="Daily Actions" count={dailyActions.length} />
          <ul className="space-y-1">
            {dailyActions.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl bg-surface border border-border px-4 py-3"
              >
                <span className="size-2 shrink-0 rounded-full bg-gray-400" />
                <span className="flex-1 text-[14px] text-foreground/70">
                  {item.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Life Context */}
      {plan.lifeContext.length > 0 && (
        <section>
          <SectionHeader label="Life" count={plan.lifeContext.length} />
          <ul className="space-y-1">
            {plan.lifeContext.map((item) => (
              <LifeRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}

      {/* Inbox nudge */}
      {plan.inboxItems.length > 0 && (
        <section className="rounded-xl bg-amber-500/5 border border-amber-500/10 px-4 py-3 flex items-center gap-3">
          <span className="size-2 shrink-0 rounded-full bg-amber-500" />
          <span className="flex-1 text-[13px] text-foreground/70">
            {plan.inboxItems.length} inbox item{plan.inboxItems.length !== 1 ? "s" : ""} need attention
          </span>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center pt-4">
        <p className="text-[10px] text-muted/40 tracking-wide">
          RamseyOS · {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </p>
      </footer>
    </div>
  );
}

/* ── Section header ── */

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </h2>
      <span className="text-[11px] text-muted/50 tabular-nums">{count}</span>
    </div>
  );
}

/* ── Now card ── */

function MobileNowCard({ item }: { item: TimelineItem }) {
  const isLive =
    item.type === "schedule" &&
    item.startTime &&
    item.endTime &&
    item.startTime.toDate() <= new Date() &&
    item.endTime.toDate() > new Date();

  return (
    <div className="rounded-2xl border border-accent/20 bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
          Now
        </span>
        {isLive && (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            Live
          </span>
        )}
      </div>
      <div className="flex items-start gap-3">
        <span className={`size-2.5 shrink-0 rounded-full mt-1.5 ${TYPE_DOT[item.type]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-medium text-foreground leading-snug">
            {item.title}
          </p>
          <p className="text-[12px] text-muted mt-1">
            {item.startTime && item.endTime
              ? `${formatTime(item.startTime)} – ${formatTime(item.endTime)}`
              : TYPE_LABEL[item.type]}
            {item.projectName && (
              <span className="text-muted/50"> · {item.projectName}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Next card ── */

function MobileNextCard({ item }: { item: TimelineItem }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          Next
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`size-2 shrink-0 rounded-full ${TYPE_DOT[item.type]}`} />
        <p className="flex-1 text-[14px] text-foreground/80 truncate">
          {item.title}
        </p>
        {item.startTime && item.endTime && (
          <span className="text-[11px] text-muted tabular-nums shrink-0">
            {formatTime(item.startTime)}
          </span>
        )}
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
      className={`flex items-center gap-3 rounded-xl bg-surface border border-border px-4 py-3 ${
        isPast ? "opacity-40" : ""
      }`}
    >
      {isActive ? (
        <span className="size-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
      ) : (
        <span className="size-2 shrink-0 rounded-full bg-sky-500" />
      )}
      <span className="text-[11px] text-muted tabular-nums shrink-0 w-24">
        {item.startTime && item.endTime
          ? `${formatTime(item.startTime)} – ${formatTime(item.endTime)}`
          : ""}
      </span>
      <span className="flex-1 text-[14px] text-foreground/80 truncate">
        {item.title}
      </span>
    </li>
  );
}

/* ── Task row ── */

function TaskRow({ item }: { item: TimelineItem }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-surface border border-border px-4 py-3">
      <span className={`size-2 shrink-0 rounded-full ${TYPE_DOT[item.type]}`} />
      <span className="flex-1 text-[14px] text-foreground/80 truncate">
        {item.title}
      </span>
      {item.projectName && (
        <span className="text-[10px] text-muted/50 shrink-0 truncate max-w-[80px]">
          {item.projectName}
        </span>
      )}
      {item.priority && (
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
    <li className="flex items-center gap-3 rounded-xl bg-surface border border-border px-4 py-3">
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

"use client";

import {
  type DailyPlan,
  type DayMode,
  type TimelineItem,
  type TimelineItemType,
  type LifeContextItem,
} from "@/lib/orchestration";
import { type AdminItem } from "@/lib/admin-templates";
import { type Timestamp } from "firebase/firestore";
import Link from "next/link";

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-rose-500/10 text-rose-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-sky-500/10 text-sky-400",
};

const DAY_MODE_META: Record<DayMode, { label: string; icon: string; color: string }> = {
  scheduled: { label: "Scheduled day", icon: "M2 7h12M5 1.5v3M11 1.5v3", color: "text-sky-400/70" },
  "deep-work": { label: "Deep work day", icon: "M8 2v12M4 6l4-4 4 4", color: "text-violet-400/70" },
  "life-focus": { label: "Life focus day", icon: "M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z", color: "text-rose-400/70" },
  balanced: { label: "Balanced day", icon: "M2 8h12M8 2v12", color: "text-emerald-400/70" },
  light: { label: "Light day", icon: "M8 2a6 6 0 100 12A6 6 0 008 2z", color: "text-amber-400/70" },
};

const TYPE_LABEL: Record<TimelineItemType, string> = {
  schedule: "event",
  chosen: "selected",
  focus: "priority",
  "daily-action": "routine",
};

const TYPE_DOT: Record<TimelineItemType, string> = {
  schedule: "bg-sky-500",
  chosen: "bg-accent",
  focus: "bg-rose-500",
  "daily-action": "bg-gray-400",
};

function formatTime(ts: Timestamp): string {
  return ts.toDate().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

interface DailyCardProps {
  plan: DailyPlan;
  adminActive: AdminItem[];
}

export function DailyCard({ plan, adminActive }: DailyCardProps) {
  const mode = DAY_MODE_META[plan.dayMode];

  const scheduleItems = plan.timeline.filter((i) => i.type === "schedule");
  const taskItems = plan.timeline.filter(
    (i) => i.type === "chosen" || i.type === "focus" || i.type === "daily-action"
  );

  const hasContext = plan.lifeContext.length > 0 || adminActive.length > 0;

  return (
    <div className="space-y-5">
      {/* Day profile */}
      <div className="flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={mode.color}>
          <path d={mode.icon} />
        </svg>
        <span className={`text-[11px] font-medium ${mode.color}`}>
          {mode.label}
        </span>
        <div className="flex-1 border-t border-border/30 mx-2" />
        <span className="text-[10px] text-muted/35 tabular-nums">
          {plan.timeline.length} items
        </span>
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
          />
          <ul className="space-y-0.5">
            {taskItems.map((item) => (
              <TaskRow key={`${item.type}-${item.id}`} item={item} />
            ))}
          </ul>
        </div>
      )}

      {plan.timeline.length === 0 && (
        <p className="text-sm text-muted/40 italic py-4 text-center">
          Nothing planned for today.
        </p>
      )}

      {/* Inbox nudge */}
      <InboxNudge count={plan.inboxItems.length} />

      {/* Context — life + ops merged */}
      {hasContext && (
        <div>
          <SectionLabel
            icon="M8 2a6 6 0 100 12A6 6 0 008 2z"
            label="Context"
            count={plan.lifeContext.length + adminActive.length}
          />
          <ul className="space-y-0.5">
            {plan.lifeContext.map((item) => (
              <LifeContextRow key={`life-${item.id}`} item={item} />
            ))}
            {adminActive.map((item) => (
              <li key={`ops-${item.id}`} className="flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-raised">
                <span className="size-1.5 shrink-0 rounded-full bg-blue-400" />
                <span className="flex-1 text-[13px] text-foreground/60 truncate">
                  {item.title}
                </span>
                <span className="text-[9px] text-blue-400/40 shrink-0">ops</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3 mt-2 px-3">
            {plan.lifeContext.length > 0 && (
              <Link
                href="/life"
                className="text-[10px] text-muted/40 hover:text-muted/60 transition-colors"
              >
                Life &rarr;
              </Link>
            )}
            {adminActive.length > 0 && (
              <Link
                href="/admin"
                className="text-[10px] text-muted/40 hover:text-muted/60 transition-colors"
              >
                Admin &rarr;
              </Link>
            )}
          </div>
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
}: {
  icon: string;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/30">
        <path d={icon} />
      </svg>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted/60">
        {label}
      </h3>
      {count !== undefined && (
        <span className="text-[9px] text-muted/30 tabular-nums">{count}</span>
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
        <span className="text-[12px] text-muted/40 italic">Inbox clear</span>
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
          {formatTime(item.startTime)} – {formatTime(item.endTime)}
        </span>
      ) : (
        <span className="text-[10px] text-muted/40 uppercase tracking-wide shrink-0 w-28 font-medium">
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
        <span className="text-[9px] text-muted/25 shrink-0">
          gcal
        </span>
      )}
    </li>
  );
}

/* ── Task row ── */

function TaskRow({ item }: { item: TimelineItem }) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-3 py-1.5 transition-colors hover:bg-surface-raised">
      <span
        className={`size-2 shrink-0 rounded-full ${TYPE_DOT[item.type]}`}
      />

      <span className="text-[10px] text-muted/40 uppercase tracking-wide shrink-0 w-28 font-medium">
        {TYPE_LABEL[item.type]}
      </span>

      <span className="flex-1 text-[13px] text-foreground/70 truncate">
        {item.title}
      </span>

      {item.projectName && (
        <span className="text-[9px] text-muted/40 shrink-0 truncate max-w-[80px]">
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

/* ── Life Context row ── */

const LIFE_CAT_DOT: Record<string, string> = {
  family: "bg-rose-400",
  home: "bg-amber-400",
  reminder: "bg-blue-400",
  "life-admin": "bg-slate-400",
};

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
      <span className="text-[9px] text-muted/30 shrink-0">
        {item.category === "life-admin" ? "life admin" : item.category}
      </span>
    </li>
  );
}

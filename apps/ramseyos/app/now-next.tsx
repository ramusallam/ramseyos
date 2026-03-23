"use client";

import {
  type DailyPlan,
  type TimelineItem,
  type TimelineItemType,
} from "@/lib/orchestration";
import { type Timestamp } from "firebase/firestore";
import Link from "next/link";

const TYPE_LABEL: Record<TimelineItemType, string> = {
  schedule: "Scheduled",
  chosen: "Selected task",
  focus: "Priority task",
  "daily-action": "Daily routine",
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

/* ── Action resolution ── */

interface ActionTarget {
  href: string;
  label: string;
  icon: string;
}

function resolveAction(item: TimelineItem): ActionTarget {
  if (item.projectId && (item.type === "chosen" || item.type === "focus")) {
    return {
      href: `/projects/${item.projectId}`,
      label: "Open project",
      icon: "M2 5V4a1 1 0 011-1h3l1.5 2H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5z",
    };
  }

  if (item.type === "schedule") {
    return {
      href: "/calendar",
      label: "Open calendar",
      icon: "M2 7h12M5 1.5v3M11 1.5v3M2 3h12a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z",
    };
  }

  if (item.type === "chosen" || item.type === "focus") {
    return {
      href: "/tasks",
      label: "Open tasks",
      icon: "M2 2h12a1 1 0 011 1v10a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1zM5 6h6M5 9h4",
    };
  }

  return {
    href: "/",
    label: "View plan",
    icon: "M8 2v1M8 13v1M3.5 8H2.5M13.5 8H12.5M8 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z",
  };
}

/* ── Smarter item selection ── */

const NEAR_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

function getActiveItem(timeline: TimelineItem[]): TimelineItem | null {
  const now = new Date();

  const active = timeline.find(
    (item) =>
      item.type === "schedule" &&
      item.startTime &&
      item.endTime &&
      item.startTime.toDate() <= now &&
      item.endTime.toDate() > now
  );
  if (active) return active;

  const nearUpcoming = timeline.find(
    (item) =>
      item.type === "schedule" &&
      item.startTime &&
      item.startTime.toDate() > now &&
      item.startTime.toDate().getTime() - now.getTime() <= NEAR_THRESHOLD_MS
  );
  if (nearUpcoming) return nearUpcoming;

  const task = timeline.find(
    (item) => item.type === "chosen" || item.type === "focus"
  );
  if (task) return task;

  const upcoming = timeline.find(
    (item) =>
      item.type === "schedule" &&
      item.startTime &&
      item.startTime.toDate() > now
  );
  if (upcoming) return upcoming;

  return timeline.find((item) => item.type === "daily-action") ?? null;
}

function getNextItem(
  timeline: TimelineItem[],
  currentId: string
): TimelineItem | null {
  const now = new Date();
  const idx = timeline.findIndex(
    (item) => `${item.type}-${item.id}` === currentId
  );
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

/* ── Component ── */

interface NowNextProps {
  plan: DailyPlan;
}

export function NowNext({ plan }: NowNextProps) {
  const now = getActiveItem(plan.timeline);
  const nowKey = now ? `${now.type}-${now.id}` : "";
  const next = now ? getNextItem(plan.timeline, nowKey) : null;

  const hasInbox = plan.inboxItems.length > 0;

  if (!now && !hasInbox) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Now */}
      {now ? (
        <FocusCard item={now} label="Now" isPrimary />
      ) : hasInbox ? (
        <InboxCard count={plan.inboxItems.length} label="Now" isPrimary />
      ) : null}

      {/* Next */}
      {next ? (
        <FocusCard item={next} label="Next" isPrimary={false} />
      ) : hasInbox && now ? (
        <InboxCard
          count={plan.inboxItems.length}
          label="Next"
          isPrimary={false}
        />
      ) : (
        <div className="bg-surface/60 rounded-xl border border-border/60 p-5 flex items-center justify-center">
          <p className="text-sm text-muted/40 italic">Nothing else lined up.</p>
        </div>
      )}
    </div>
  );
}

function FocusCard({
  item,
  label,
  isPrimary,
}: {
  item: TimelineItem;
  label: string;
  isPrimary: boolean;
}) {
  const action = resolveAction(item);
  const isInProgress =
    item.type === "schedule" &&
    item.startTime &&
    item.endTime &&
    item.startTime.toDate() <= new Date() &&
    item.endTime.toDate() > new Date();

  const startsIn = item.type === "schedule" && item.startTime && !isInProgress
    ? getRelativeTime(item.startTime.toDate())
    : null;

  return (
    <div
      className={`rounded-xl border p-5 ${
        isPrimary
          ? "bg-surface/80 border-accent/20"
          : "bg-surface/60 border-border/60"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${
          isPrimary ? "text-accent/60" : "text-muted/50"
        }`}>
          {label}
        </span>
        {isInProgress && (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            In progress
          </span>
        )}
        {startsIn && (
          <span className="text-[9px] font-medium text-muted/50">
            {startsIn}
          </span>
        )}
      </div>

      <div className="flex items-start gap-3 mb-4">
        <span
          className={`size-2.5 shrink-0 rounded-full mt-1 ${TYPE_DOT[item.type]}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-foreground truncate">
            {item.title}
          </p>
          <p className="text-[11px] text-muted/60 mt-0.5">
            {item.startTime && item.endTime
              ? `${formatTime(item.startTime)} – ${formatTime(item.endTime)}`
              : TYPE_LABEL[item.type]}
            {item.projectName && (
              <span className="text-muted/40"> · {item.projectName}</span>
            )}
          </p>
        </div>
      </div>

      <Link
        href={action.href}
        className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-surface-raised/30 px-3 py-1.5 text-[11px] font-medium text-foreground/60 hover:bg-surface-raised hover:text-foreground/80 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-accent/60">
          <path d={action.icon} />
        </svg>
        {action.label}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted/30">
          <path d="M6 4l4 4-4 4" />
        </svg>
      </Link>
    </div>
  );
}

function InboxCard({
  count,
  label,
  isPrimary,
}: {
  count: number;
  label: string;
  isPrimary: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        isPrimary
          ? "bg-surface/80 border-accent/20"
          : "bg-surface/60 border-border/60"
      }`}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${
        isPrimary ? "text-accent/60" : "text-muted/50"
      }`}>
        {label}
      </p>

      <div className="flex items-start gap-3 mb-4">
        <span className="size-2.5 shrink-0 rounded-full mt-1 bg-amber-500" />
        <div>
          <p className="text-[15px] font-medium text-foreground">
            Review inbox
          </p>
          <p className="text-[11px] text-muted/60 mt-0.5">
            {count} item{count !== 1 ? "s" : ""} need attention
          </p>
        </div>
      </div>

      <Link
        href="/inbox"
        className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-surface-raised/30 px-3 py-1.5 text-[11px] font-medium text-foreground/60 hover:bg-surface-raised hover:text-foreground/80 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-accent/60">
          <rect x="2" y="3" width="12" height="10" rx="2" />
          <path d="M2 9h3.5a1 1 0 011 1v0a1 1 0 001 1h1a1 1 0 001-1v0a1 1 0 011-1H14" />
        </svg>
        Review inbox
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted/30">
          <path d="M6 4l4 4-4 4" />
        </svg>
      </Link>
    </div>
  );
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

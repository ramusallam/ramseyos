"use client";

import {
  type DailyPlan,
  type TimelineItem,
} from "@/lib/orchestration";
import {
  resolveNowItem,
  resolveNextItem,
  getRelativeTime,
} from "@/lib/now-next";
import {
  TYPE_DOT,
  NOWNEXT_TYPE_LABEL,
  fmtCardTime,
} from "@/lib/daily-card-constants";
import Link from "next/link";

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
      label: "Work on this",
      icon: "M2 5V4a1 1 0 011-1h3l1.5 2H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5z",
    };
  }

  if (item.type === "schedule") {
    return {
      href: "/calendar",
      label: "View schedule",
      icon: "M2 7h12M5 1.5v3M11 1.5v3M2 3h12a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z",
    };
  }

  if (item.type === "chosen" || item.type === "focus") {
    return {
      href: "/tasks",
      label: "Start this",
      icon: "M2 2h12a1 1 0 011 1v10a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1zM5 6h6M5 9h4",
    };
  }

  return {
    href: "/",
    label: "View plan",
    icon: "M8 2v1M8 13v1M3.5 8H2.5M13.5 8H12.5M8 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z",
  };
}

/* ── Component ── */

interface NowNextProps {
  plan: DailyPlan;
}

export function NowNext({ plan }: NowNextProps) {
  const now = resolveNowItem(plan.timeline);
  const next = now ? resolveNextItem(plan.timeline, now) : null;

  const hasInbox = plan.inboxItems.length > 0;

  if (!now && !hasInbox) return null;

  const hasNext = next || (hasInbox && now);

  return (
    <div className={`grid grid-cols-1 gap-4 ${hasNext ? "sm:grid-cols-2" : ""}`}>
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
      ) : null}
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
      className={`rounded-xl border p-5 backdrop-blur-sm transition-all ${
        isPrimary
          ? "bg-surface/70 border-accent/15 shadow-[var(--glow-accent)]"
          : "bg-surface border-border"
      }`}
    >
      {/* Label row */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-[10px] font-semibold uppercase tracking-widest ${
          isPrimary ? "text-accent/70" : "text-muted"
        }`}>
          {label}
        </span>
        {isInProgress && (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            In progress
          </span>
        )}
        {startsIn && (
          <span className="text-[9px] font-medium text-muted">
            {startsIn}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex items-start gap-3 mb-5">
        <span
          className={`size-2.5 shrink-0 rounded-full mt-1.5 ${TYPE_DOT[item.type]}`}
        />
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-foreground truncate ${
            isPrimary ? "text-[16px]" : "text-[15px] text-foreground/80"
          }`}>
            {item.title}
          </p>
          <p className="text-[11px] text-muted/50 mt-1">
            {item.startTime && item.endTime
              ? `${fmtCardTime(item.startTime)} – ${fmtCardTime(item.endTime)}`
              : NOWNEXT_TYPE_LABEL[item.type]}
            {item.projectName && (
              <span className="text-muted"> · {item.projectName}</span>
            )}
          </p>
        </div>
      </div>

      {/* Action */}
      <Link
        href={action.href}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors ${
          isPrimary
            ? "border-accent/20 bg-accent/[0.06] text-foreground/70 hover:bg-accent/[0.12] hover:text-foreground/90"
            : "border-border bg-surface-raised/30 text-foreground/50 hover:bg-surface-raised hover:text-foreground/70"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={isPrimary ? "text-accent/70" : "text-accent/50"}>
          <path d={action.icon} />
        </svg>
        {action.label}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
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
      className={`rounded-xl border p-5 backdrop-blur-sm transition-all ${
        isPrimary
          ? "bg-surface/70 border-accent/15 shadow-[var(--glow-accent)]"
          : "bg-surface border-border"
      }`}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-4 ${
        isPrimary ? "text-accent/70" : "text-muted"
      }`}>
        {label}
      </p>

      <div className="flex items-start gap-3 mb-5">
        <span className="size-2.5 shrink-0 rounded-full mt-1.5 bg-amber-500" />
        <div>
          <p className={`font-medium text-foreground ${
            isPrimary ? "text-[16px]" : "text-[15px] text-foreground/80"
          }`}>
            Review inbox
          </p>
          <p className="text-[11px] text-muted/50 mt-1">
            {count} item{count !== 1 ? "s" : ""} need attention
          </p>
        </div>
      </div>

      <Link
        href="/inbox"
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors ${
          isPrimary
            ? "border-accent/20 bg-accent/[0.06] text-foreground/70 hover:bg-accent/[0.12] hover:text-foreground/90"
            : "border-border bg-surface-raised/30 text-foreground/50 hover:bg-surface-raised hover:text-foreground/70"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={isPrimary ? "text-accent/70" : "text-accent/50"}>
          <rect x="2" y="3" width="12" height="10" rx="2" />
          <path d="M2 9h3.5a1 1 0 011 1v0a1 1 0 001 1h1a1 1 0 001-1v0a1 1 0 011-1H14" />
        </svg>
        Review inbox
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <path d="M6 4l4 4-4 4" />
        </svg>
      </Link>
    </div>
  );
}


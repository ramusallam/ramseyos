"use client";

import { useEffect, useState } from "react";
import {
  generateDailyPlan,
  type DailyPlan,
  type TimelineItem,
  type TimelineItemType,
} from "@/lib/orchestration";
import { type Timestamp } from "firebase/firestore";
import Link from "next/link";

const TYPE_LABEL: Record<TimelineItemType, string> = {
  schedule: "Event",
  chosen: "Chosen for today",
  focus: "High priority",
  "daily-action": "Daily action",
};

const TYPE_DOT: Record<TimelineItemType, string> = {
  schedule: "bg-sky-500",
  chosen: "bg-accent",
  focus: "bg-rose-500",
  "daily-action": "bg-gray-400",
};

const TYPE_ROUTE: Record<TimelineItemType, { href: string; label: string }> = {
  schedule: { href: "/", label: "View schedule" },
  chosen: { href: "/tasks", label: "Open tasks" },
  focus: { href: "/tasks", label: "Open tasks" },
  "daily-action": { href: "/", label: "View plan" },
};

function formatTime(ts: Timestamp): string {
  return ts.toDate().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getActiveItem(timeline: TimelineItem[]): TimelineItem | null {
  const now = new Date();

  // First: find an in-progress schedule event
  const active = timeline.find(
    (item) =>
      item.type === "schedule" &&
      item.startTime &&
      item.endTime &&
      item.startTime.toDate() <= now &&
      item.endTime.toDate() > now
  );
  if (active) return active;

  // Second: find the next upcoming schedule event
  const upcoming = timeline.find(
    (item) =>
      item.type === "schedule" &&
      item.startTime &&
      item.startTime.toDate() > now
  );
  if (upcoming) return upcoming;

  // Third: first non-schedule item (chosen > focus > daily)
  const task = timeline.find((item) => item.type !== "schedule");
  return task ?? null;
}

function getNextItem(
  timeline: TimelineItem[],
  currentId: string
): TimelineItem | null {
  const idx = timeline.findIndex(
    (item) => `${item.type}-${item.id}` === currentId
  );
  if (idx === -1 || idx + 1 >= timeline.length) return null;
  return timeline[idx + 1];
}

export function NowNext() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);

  useEffect(() => {
    generateDailyPlan().then(setPlan);
  }, []);

  if (!plan) return null;

  const now = getActiveItem(plan.timeline);
  const nowKey = now ? `${now.type}-${now.id}` : "";
  const next = now ? getNextItem(plan.timeline, nowKey) : null;

  // Also check inbox
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
        <div className="bg-surface rounded-xl border border-border p-5 shadow-card flex items-center justify-center">
          <p className="text-sm text-muted italic">Nothing else lined up.</p>
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
  const route = TYPE_ROUTE[item.type];
  const isInProgress =
    item.type === "schedule" &&
    item.startTime &&
    item.endTime &&
    item.startTime.toDate() <= new Date() &&
    item.endTime.toDate() > new Date();

  return (
    <div
      className={`rounded-xl border p-5 shadow-card ${
        isPrimary
          ? "bg-surface border-accent/20"
          : "bg-surface border-border"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </span>
        {isInProgress && (
          <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            In progress
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
          <p className="text-[11px] text-muted mt-0.5">
            {item.startTime && item.endTime
              ? `${formatTime(item.startTime)} – ${formatTime(item.endTime)}`
              : TYPE_LABEL[item.type]}
          </p>
        </div>
      </div>

      <Link
        href={route.href}
        className="inline-flex items-center text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
      >
        {route.label} &rarr;
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
      className={`rounded-xl border p-5 shadow-card ${
        isPrimary
          ? "bg-surface border-accent/20"
          : "bg-surface border-border"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">
        {label}
      </p>

      <div className="flex items-start gap-3 mb-4">
        <span className="size-2.5 shrink-0 rounded-full mt-1 bg-amber-500" />
        <div>
          <p className="text-[15px] font-medium text-foreground">
            Review inbox
          </p>
          <p className="text-[11px] text-muted mt-0.5">
            {count} item{count !== 1 ? "s" : ""} need attention
          </p>
        </div>
      </div>

      <Link
        href="/inbox"
        className="inline-flex items-center text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
      >
        Open inbox &rarr;
      </Link>
    </div>
  );
}

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

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-rose-50 text-rose-600",
  medium: "bg-amber-50 text-amber-600",
  low: "bg-sky-50 text-sky-600",
};

const TYPE_LABEL: Record<TimelineItemType, string> = {
  schedule: "event",
  chosen: "today",
  focus: "priority",
  "daily-action": "daily",
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

export function DailyCard() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);

  useEffect(() => {
    generateDailyPlan().then(setPlan);
  }, []);

  if (!plan) return null;

  return (
    <div className="space-y-6">
      {/* Timeline header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Today&apos;s plan
          </h3>
          <span className="text-[11px] text-muted/60 tabular-nums">
            {plan.timeline.length} items
          </span>
        </div>

        {plan.timeline.length === 0 ? (
          <p className="text-sm text-muted italic py-4 text-center">
            Nothing planned for today.
          </p>
        ) : (
          <ul className="space-y-1">
            {plan.timeline.map((item) => (
              <TimelineRow key={`${item.type}-${item.id}`} item={item} />
            ))}
          </ul>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Inbox */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Inbox
            {plan.inboxItems.length > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-accent-dim text-accent text-[10px] font-semibold tabular-nums size-5">
                {plan.inboxItems.length}
              </span>
            )}
          </h3>
          <Link
            href="/inbox"
            className="text-[11px] text-accent hover:text-accent/80 transition-colors font-medium"
          >
            Review &rarr;
          </Link>
        </div>
        {plan.inboxItems.length === 0 ? (
          <p className="text-sm text-muted italic">Inbox clear.</p>
        ) : (
          <ul className="space-y-1">
            {plan.inboxItems.slice(0, 3).map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-raised"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-gray-300" />
                <span className="flex-1 text-[13px] text-foreground/70 truncate">
                  {item.text}
                </span>
                {item.priority && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                      PRIORITY_STYLE[item.priority] ?? "text-muted"
                    }`}
                  >
                    {item.priority}
                  </span>
                )}
              </li>
            ))}
            {plan.inboxItems.length > 3 && (
              <li className="px-3 py-1">
                <Link
                  href="/inbox"
                  className="text-[11px] text-muted hover:text-foreground transition-colors"
                >
                  +{plan.inboxItems.length - 3} more
                </Link>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Timeline row ── */

function TimelineRow({ item }: { item: TimelineItem }) {
  const isPast =
    item.type === "schedule" && item.endTime
      ? item.endTime.toDate() < new Date()
      : false;

  return (
    <li
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-raised ${
        isPast ? "opacity-40" : ""
      }`}
    >
      <span
        className={`size-2 shrink-0 rounded-full ${TYPE_DOT[item.type]}`}
      />

      {item.startTime && item.endTime ? (
        <span className="text-[11px] text-muted tabular-nums shrink-0 w-28">
          {formatTime(item.startTime)} – {formatTime(item.endTime)}
        </span>
      ) : (
        <span className="text-[10px] text-muted/50 uppercase tracking-wide shrink-0 w-28 font-medium">
          {TYPE_LABEL[item.type]}
        </span>
      )}

      <span className="flex-1 text-[13px] text-foreground/80 truncate">
        {item.title}
      </span>

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

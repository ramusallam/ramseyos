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
  high: "bg-rose-500/15 text-rose-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-blue-500/15 text-blue-400",
};

const TYPE_LABEL: Record<TimelineItemType, string> = {
  schedule: "event",
  chosen: "today",
  focus: "priority",
  "daily-action": "daily",
};

const TYPE_DOT: Record<TimelineItemType, string> = {
  schedule: "bg-sky-400/60",
  chosen: "bg-accent/50",
  focus: "bg-rose-400/60",
  "daily-action": "bg-zinc-500/50",
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
      {/* Timeline — unified daily flow */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-medium uppercase tracking-widest text-muted/70">
            Today&apos;s plan
          </h3>
          <span className="text-[10px] text-muted/40 tabular-nums">
            {plan.timeline.length} items
          </span>
        </div>

        {plan.timeline.length === 0 ? (
          <p className="text-sm text-muted/50 italic">
            Nothing planned for today.
          </p>
        ) : (
          <ul className="space-y-px">
            {plan.timeline.map((item) => (
              <TimelineRow key={`${item.type}-${item.id}`} item={item} />
            ))}
          </ul>
        )}
      </div>

      {/* Inbox — kept separate, not part of the timeline */}
      <CardSection
        label="Inbox"
        count={plan.inboxItems.length}
        action={{ href: "/inbox", text: "Review" }}
      >
        {plan.inboxItems.length === 0 ? (
          <p className="text-sm text-muted/50 italic">Inbox clear.</p>
        ) : (
          <ul className="space-y-px">
            {plan.inboxItems.slice(0, 3).map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded px-2.5 py-2 -mx-2.5 transition-colors hover:bg-surface"
              >
                <span className="size-1 shrink-0 rounded-full bg-zinc-500" />
                <span className="flex-1 text-[13px] text-zinc-300 truncate">
                  {item.text}
                </span>
                {item.priority && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded ${
                      PRIORITY_STYLE[item.priority] ?? "text-muted/50"
                    }`}
                  >
                    {item.priority}
                  </span>
                )}
              </li>
            ))}
            {plan.inboxItems.length > 3 && (
              <li className="px-2.5 py-1">
                <Link
                  href="/inbox"
                  className="text-[11px] text-muted/50 hover:text-zinc-400 transition-colors"
                >
                  +{plan.inboxItems.length - 3} more
                </Link>
              </li>
            )}
          </ul>
        )}
      </CardSection>
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
      className={`flex items-center gap-3 rounded px-2.5 py-1.5 -mx-2.5 transition-colors hover:bg-surface ${
        isPast ? "opacity-40" : ""
      }`}
    >
      <span
        className={`size-1.5 shrink-0 rounded-full ${TYPE_DOT[item.type]}`}
      />

      {item.startTime && item.endTime ? (
        <span className="text-[11px] text-muted/60 tabular-nums shrink-0 w-24">
          {formatTime(item.startTime)} – {formatTime(item.endTime)}
        </span>
      ) : (
        <span className="text-[9px] text-muted/40 uppercase tracking-wide shrink-0 w-24">
          {TYPE_LABEL[item.type]}
        </span>
      )}

      <span className="flex-1 text-[13px] text-zinc-300 truncate">
        {item.title}
      </span>

      {item.priority && (
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
            PRIORITY_STYLE[item.priority] ?? "text-muted/50"
          }`}
        >
          {item.priority}
        </span>
      )}
    </li>
  );
}

/* ── Card primitives ── */

function CardSection({
  label,
  count,
  action,
  children,
}: {
  label: string;
  count?: number;
  action?: { href: string; text: string };
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted/70">
          {label}
          {count !== undefined && count > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-accent-dim text-accent text-[9px] font-medium tabular-nums size-4">
              {count}
            </span>
          )}
        </h3>
        {action && (
          <Link
            href={action.href}
            className="text-[10px] text-muted/50 hover:text-zinc-400 transition-colors"
          >
            {action.text} &rarr;
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { generateDailyPlan, type DailyPlan } from "@/lib/orchestration";
import { type Timestamp } from "firebase/firestore";
import Link from "next/link";

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-blue-500/15 text-blue-400",
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
      {/* 1. Schedule — time-sensitive, soonest first */}
      <CardSection label="Schedule" count={plan.schedule.length}>
        {plan.schedule.length === 0 ? (
          <Placeholder>Nothing on the schedule today.</Placeholder>
        ) : (
          <ul className="space-y-px">
            {plan.schedule.map((event) => {
              const isPast = event.endTime.toDate() < new Date();
              return (
                <li
                  key={event.id}
                  className={`flex items-center gap-3 rounded px-2.5 py-1.5 -mx-2.5 transition-colors hover:bg-surface ${
                    isPast ? "opacity-40" : ""
                  }`}
                >
                  <span className="text-[11px] text-muted/60 tabular-nums shrink-0 w-24">
                    {formatTime(event.startTime)} – {formatTime(event.endTime)}
                  </span>
                  <span className="flex-1 text-[13px] text-zinc-300 truncate">
                    {event.title}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardSection>

      {/* 2. Chosen Tasks — intentional picks, high priority first */}
      <CardSection label="Chosen for today">
        {plan.chosenTasks.length === 0 ? (
          <Placeholder>No tasks chosen for today.</Placeholder>
        ) : (
          <ul className="space-y-px">
            {plan.chosenTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded px-2.5 py-2 -mx-2.5 transition-colors hover:bg-surface"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-accent/50" />
                <span className="flex-1 text-[13px] text-zinc-300 truncate">
                  {task.title}
                </span>
                {task.priority && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
                      PRIORITY_STYLE[task.priority] ?? "text-muted/50"
                    }`}
                  >
                    {task.priority}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardSection>

      {/* 3. Focus — high-priority tasks not already chosen */}
      {plan.focusTasks.length > 0 && (
        <CardSection label="Focus">
          <ul className="space-y-px">
            {plan.focusTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded px-2.5 py-2 -mx-2.5 transition-colors hover:bg-surface"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-rose-400/60" />
                <span className="flex-1 text-[13px] text-zinc-300 truncate">
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        </CardSection>
      )}

      {/* 4. Daily Actions */}
      <CardSection label="Daily actions">
        {plan.dailyActions.length === 0 ? (
          <Placeholder>No daily actions set.</Placeholder>
        ) : (
          <ul className="space-y-px">
            {plan.dailyActions.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded px-2.5 py-1.5 -mx-2.5 transition-colors hover:bg-surface"
              >
                <span className="size-1 shrink-0 rounded-full bg-accent/40" />
                <span className="text-[13px] text-zinc-300">
                  {item.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardSection>

      {/* 5. Inbox — prioritized items first */}
      <CardSection
        label="Inbox"
        count={plan.inboxItems.length}
        action={{ href: "/inbox", text: "Review" }}
      >
        {plan.inboxItems.length === 0 ? (
          <Placeholder>Inbox clear.</Placeholder>
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

function Placeholder({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted/50 italic">{children}</p>;
}

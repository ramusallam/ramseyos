import {
  type DailyPlan,
  type DayMode,
  type TimelineItem,
  type LifeContextItem,
} from "./orchestration";
import { type Timestamp } from "firebase/firestore";

const DAY_MODE_LABEL: Record<DayMode, string> = {
  scheduled: "Scheduled day",
  "deep-work": "Deep work day",
  "life-focus": "Life focus day",
  balanced: "Balanced day",
  light: "Light day",
};

const TYPE_PREFIX: Record<string, string> = {
  schedule: "",
  chosen: "[today]",
  focus: "[priority]",
  "daily-action": "[daily]",
};

function fmtTime(ts: Timestamp): string {
  return ts.toDate().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/* ── Plain text summary ── */

export function formatDailyCardText(plan: DailyPlan): string {
  const lines: string[] = [];

  lines.push(`RamseyOS — ${fmtDate()}`);
  lines.push(DAY_MODE_LABEL[plan.dayMode]);
  lines.push("");

  // Now / Next
  const nowItem = resolveNow(plan.timeline);
  if (nowItem) {
    lines.push(`▸ NOW: ${itemLine(nowItem)}`);
    const nextItem = resolveNext(plan.timeline, nowItem);
    if (nextItem) {
      lines.push(`▹ NEXT: ${itemLine(nextItem)}`);
    }
    lines.push("");
  }

  // Schedule
  const schedule = plan.timeline.filter((i) => i.type === "schedule");
  if (schedule.length > 0) {
    lines.push("SCHEDULE");
    for (const item of schedule) {
      const time =
        item.startTime && item.endTime
          ? `${fmtTime(item.startTime)}–${fmtTime(item.endTime)}`
          : "";
      lines.push(`  ${time}  ${item.title}`);
    }
    lines.push("");
  }

  // Tasks
  const tasks = plan.timeline.filter(
    (i) => i.type === "chosen" || i.type === "focus"
  );
  if (tasks.length > 0) {
    lines.push("TASKS");
    for (const item of tasks) {
      const prefix = TYPE_PREFIX[item.type] ?? "";
      const priority = item.priority ? ` (${item.priority})` : "";
      const project = item.projectName ? ` · ${item.projectName}` : "";
      lines.push(`  ${prefix} ${item.title}${priority}${project}`);
    }
    lines.push("");
  }

  // Daily actions
  const actions = plan.timeline.filter((i) => i.type === "daily-action");
  if (actions.length > 0) {
    lines.push("DAILY ACTIONS");
    for (const item of actions) {
      lines.push(`  ○ ${item.title}`);
    }
    lines.push("");
  }

  // Life context
  if (plan.lifeContext.length > 0) {
    lines.push("LIFE");
    for (const item of plan.lifeContext) {
      const tag = item.recurring ? " (recurring)" : "";
      lines.push(`  · ${item.title}${tag}`);
    }
    lines.push("");
  }

  // Inbox
  if (plan.inboxItems.length > 0) {
    lines.push(
      `${plan.inboxItems.length} inbox item${plan.inboxItems.length !== 1 ? "s" : ""} need attention`
    );
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

/* ── Structured summary (for future API/webhook use) ── */

export interface DailyCardSummary {
  date: string;
  dayMode: string;
  now: { title: string; detail: string } | null;
  next: { title: string; detail: string } | null;
  schedule: { time: string; title: string }[];
  tasks: { title: string; type: string; priority: string | null }[];
  dailyActions: string[];
  lifeContext: { title: string; recurring: boolean }[];
  inboxCount: number;
}

export function buildDailyCardSummary(plan: DailyPlan): DailyCardSummary {
  const nowItem = resolveNow(plan.timeline);
  const nextItem = nowItem ? resolveNext(plan.timeline, nowItem) : null;

  return {
    date: fmtDate(),
    dayMode: DAY_MODE_LABEL[plan.dayMode],
    now: nowItem
      ? { title: nowItem.title, detail: itemDetail(nowItem) }
      : null,
    next: nextItem
      ? { title: nextItem.title, detail: itemDetail(nextItem) }
      : null,
    schedule: plan.timeline
      .filter((i) => i.type === "schedule")
      .map((i) => ({
        time:
          i.startTime && i.endTime
            ? `${fmtTime(i.startTime)}–${fmtTime(i.endTime)}`
            : "",
        title: i.title,
      })),
    tasks: plan.timeline
      .filter((i) => i.type === "chosen" || i.type === "focus")
      .map((i) => ({
        title: i.title,
        type: i.type,
        priority: i.priority ?? null,
      })),
    dailyActions: plan.timeline
      .filter((i) => i.type === "daily-action")
      .map((i) => i.title),
    lifeContext: plan.lifeContext.map((i) => ({
      title: i.title,
      recurring: i.recurring,
    })),
    inboxCount: plan.inboxItems.length,
  };
}

/* ── Internal helpers ── */

function itemLine(item: TimelineItem): string {
  const time =
    item.startTime && item.endTime
      ? `${fmtTime(item.startTime)}–${fmtTime(item.endTime)} `
      : "";
  return `${time}${item.title}`;
}

function itemDetail(item: TimelineItem): string {
  if (item.startTime && item.endTime) {
    return `${fmtTime(item.startTime)}–${fmtTime(item.endTime)}`;
  }
  return TYPE_PREFIX[item.type] ?? item.type;
}

function resolveNow(timeline: TimelineItem[]): TimelineItem | null {
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

function resolveNext(
  timeline: TimelineItem[],
  current: TimelineItem
): TimelineItem | null {
  const key = `${current.type}-${current.id}`;
  const idx = timeline.findIndex((i) => `${i.type}-${i.id}` === key);
  if (idx === -1 || idx + 1 >= timeline.length) return null;
  return timeline[idx + 1];
}

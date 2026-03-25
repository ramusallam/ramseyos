import { type DayMode, type TimelineItemType } from "./orchestration";

export const DAY_MODE_META: Record<
  DayMode,
  { label: string; icon: string; color: string }
> = {
  scheduled: {
    label: "Scheduled day",
    icon: "M2 7h12M5 1.5v3M11 1.5v3",
    color: "text-sky-400",
  },
  "deep-work": {
    label: "Deep work day",
    icon: "M8 2v12M4 6l4-4 4 4",
    color: "text-violet-400",
  },
  "life-focus": {
    label: "Life focus day",
    icon: "M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z",
    color: "text-rose-400",
  },
  balanced: {
    label: "Balanced day",
    icon: "M2 8h12M8 2v12",
    color: "text-emerald-400",
  },
  light: {
    label: "Light day",
    icon: "M8 2a6 6 0 100 12A6 6 0 008 2z",
    color: "text-amber-400",
  },
};

export const TYPE_DOT: Record<TimelineItemType, string> = {
  schedule: "bg-sky-500",
  chosen: "bg-indigo-500",
  focus: "bg-rose-500",
  "daily-action": "bg-gray-400",
};

export const TYPE_LABEL: Record<TimelineItemType, string> = {
  schedule: "event",
  chosen: "today",
  focus: "priority",
  "daily-action": "daily",
};

export const LIFE_CAT_DOT: Record<string, string> = {
  family: "bg-rose-400",
  home: "bg-amber-400",
  reminder: "bg-blue-400",
  "life-admin": "bg-slate-400",
};

export function fmtCardTime(ts: { toDate: () => Date }): string {
  return ts.toDate().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtCardDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

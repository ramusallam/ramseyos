import { type TimelineItem } from "./orchestration";

export const NEAR_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Resolve the current "Now" item from the timeline.
 * Priority: active event → near-upcoming event → task → upcoming event → daily action.
 */
export function resolveNowItem(timeline: TimelineItem[]): TimelineItem | null {
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

  const nearUpcoming = timeline.find(
    (i) =>
      i.type === "schedule" &&
      i.startTime &&
      i.startTime.toDate() > now &&
      i.startTime.toDate().getTime() - now.getTime() <= NEAR_THRESHOLD_MS
  );
  if (nearUpcoming) return nearUpcoming;

  const task = timeline.find(
    (i) => i.type === "chosen" || i.type === "focus"
  );
  if (task) return task;

  const upcoming = timeline.find(
    (i) => i.type === "schedule" && i.startTime && i.startTime.toDate() > now
  );
  if (upcoming) return upcoming;

  return timeline.find((i) => i.type === "daily-action") ?? null;
}

/**
 * Resolve the "Next" item after the current item, skipping past events.
 */
export function resolveNextItem(
  timeline: TimelineItem[],
  current: TimelineItem
): TimelineItem | null {
  const now = new Date();
  const key = `${current.type}-${current.id}`;
  const idx = timeline.findIndex((i) => `${i.type}-${i.id}` === key);
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

/**
 * Format a future date as relative time (e.g., "in 5m", "in 1h 30m").
 */
export function getRelativeTime(date: Date): string {
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

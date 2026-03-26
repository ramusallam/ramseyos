/**
 * Recent activity tracker — localStorage-based continuity layer.
 * Tracks recently visited pages and recently touched items
 * so the command palette and dashboard can surface them.
 */

export interface RecentItem {
  id: string;
  label: string;
  href: string;
  category: "task" | "project" | "lesson" | "page";
  detail?: string;
  timestamp: number;
}

const STORAGE_KEY = "ramseyos:recents";
const MAX_ITEMS = 20;

function load(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentItem[];
  } catch {
    return [];
  }
}

function save(items: RecentItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/** Record a visit to a page or item. Deduplicates by id, keeps most recent first. */
export function trackRecent(item: Omit<RecentItem, "timestamp">): void {
  const list = load().filter((r) => r.id !== item.id);
  list.unshift({ ...item, timestamp: Date.now() });
  save(list.slice(0, MAX_ITEMS));
}

/** Get the N most recent items, optionally filtered by category. */
export function getRecents(
  count = 8,
  category?: RecentItem["category"]
): RecentItem[] {
  const list = load();
  const filtered = category ? list.filter((r) => r.category === category) : list;
  return filtered.slice(0, count);
}

/** Clear all recent items. */
export function clearRecents(): void {
  save([]);
}

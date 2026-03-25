/**
 * shared.ts — Cross-system types, constants, and utilities for RamseyOS.
 *
 * This module centralizes patterns that repeat across multiple pages and
 * lib files so they stay consistent as the system grows. Import from here
 * instead of redefining locally.
 */

import { type Timestamp } from "firebase/firestore";

/* ─────────────────────────── Shared Types ─────────────────────────── */

/** Priority levels used by tasks, captures, and inbox triage. */
export type Priority = "low" | "medium" | "high" | null;

/** Common status pattern for operational items (admin, life, etc.). */
export type OperationalStatus = "pending" | "in_progress" | "done";

/* ─────────────────────────── Styling Constants ─────────────────────────── */

/** Priority badge styles — shared across tasks, inbox, projects, dashboard. */
export const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-rose-500/10 text-rose-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-sky-500/10 text-sky-400",
};

/** Project/entity status badge styles. */
export const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Active" },
  paused: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Paused" },
  completed: { bg: "bg-sky-500/10", text: "text-sky-400", label: "Complete" },
};

/* ─────────────────────────── Timestamp Utilities ─────────────────────────── */

/**
 * Safely convert a Firestore Timestamp (or null/undefined) to a JS Date.
 * Handles the common pattern of `d.data().createdAt?.toDate() ?? null`.
 */
export function toDate(ts: Timestamp | null | undefined): Date | null {
  if (!ts) return null;
  if (typeof (ts as Timestamp).toDate === "function") {
    return (ts as Timestamp).toDate();
  }
  return null;
}

/**
 * Format a Firestore Timestamp for display: "Mar 23, 1:45 PM"
 */
export function formatTimestamp(ts: Timestamp | null | undefined): string {
  const d = toDate(ts);
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format a Firestore Timestamp as time only: "1:45 PM"
 */
export function formatTime(ts: Timestamp | null | undefined): string {
  const d = toDate(ts);
  if (!d) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ─────────────────────────── Collection Utilities ─────────────────────────── */

/**
 * Map a Firestore snapshot doc to a typed object with `id` injected.
 * Replaces the repeated `{ id: d.id, ...d.data() } as T` pattern.
 */
export function docToObject<T extends { id: string }>(
  d: { id: string; data: () => Record<string, unknown> }
): T {
  return { id: d.id, ...d.data() } as T;
}

/* ─────────────────────────── Null-safe Helpers ─────────────────────────── */

/**
 * Safely coerce a value to string, returning "" for null/undefined.
 */
export function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

/**
 * Safely coerce a value to an array, returning [] for null/undefined.
 */
export function arr<T>(v: T[] | null | undefined): T[] {
  return v ?? [];
}

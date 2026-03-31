/**
 * activity-log.ts — Persistent activity log for RamseyOS.
 *
 * Tracks meaningful user/system events (create, update, complete, status change)
 * and stores them in Firestore so the OS can answer "what changed recently?"
 *
 * Designed for a single-user system: lightweight, no multi-tenant overhead.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ── Types ── */

export type ActivityAction =
  | "created"
  | "updated"
  | "completed"
  | "archived"
  | "deleted"
  | "status_changed"
  | "approved"
  | "sent"
  | "pinned"
  | "unpinned";

export type ActivityObjectType =
  | "task"
  | "project"
  | "lesson-plan"
  | "capture"
  | "draft"
  | "recommendation"
  | "knowledge"
  | "rubric"
  | "grading-job"
  | "reflection"
  | "weekly-review";

export interface ActivityEntry {
  id: string;
  action: ActivityAction;
  objectType: ActivityObjectType;
  objectId: string;
  label: string;
  detail?: string;
  workspace?: string;
  href?: string;
  createdAt: Timestamp | null;
}

/* ── Collection reference ── */

const COLLECTION = "activityLog";

/* ── Write ── */

/**
 * Log an activity event. Fire-and-forget by default — callers should NOT
 * await this in the critical path of user actions.
 */
export function logActivity(entry: Omit<ActivityEntry, "id" | "createdAt">): void {
  addDoc(collection(db, COLLECTION), {
    ...entry,
    createdAt: serverTimestamp(),
  }).catch((err) => {
    console.error("[activity-log] write failed", err);
  });
}

/* ── Read ── */

/**
 * Get the most recent activity entries, optionally filtered by object type.
 */
export async function getRecentActivity(
  count = 20,
  objectType?: ActivityObjectType
): Promise<ActivityEntry[]> {
  try {
    const q = objectType
      ? query(
          collection(db, COLLECTION),
          where("objectType", "==", objectType),
          orderBy("createdAt", "desc"),
          limit(count)
        )
      : query(
          collection(db, COLLECTION),
          orderBy("createdAt", "desc"),
          limit(count)
        );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityEntry));
  } catch (err) {
    console.error("[activity-log] read failed", err);
    return [];
  }
}

/**
 * Get activity entries for a specific object (e.g., all events for a project).
 */
export async function getActivityForObject(
  objectId: string,
  count = 20
): Promise<ActivityEntry[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("objectId", "==", objectId),
      orderBy("createdAt", "desc"),
      limit(count)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityEntry));
  } catch (err) {
    console.error("[activity-log] object read failed", err);
    return [];
  }
}

/* ── Convenience loggers ── */

export function logCreated(
  objectType: ActivityObjectType,
  objectId: string,
  label: string,
  opts?: { detail?: string; workspace?: string; href?: string }
) {
  logActivity({
    action: "created",
    objectType,
    objectId,
    label,
    href: opts?.href,
    detail: opts?.detail,
    workspace: opts?.workspace,
  });
}

export function logUpdated(
  objectType: ActivityObjectType,
  objectId: string,
  label: string,
  opts?: { detail?: string; href?: string }
) {
  logActivity({
    action: "updated",
    objectType,
    objectId,
    label,
    href: opts?.href,
    detail: opts?.detail,
  });
}

export function logCompleted(
  objectType: ActivityObjectType,
  objectId: string,
  label: string,
  opts?: { href?: string }
) {
  logActivity({
    action: "completed",
    objectType,
    objectId,
    label,
    href: opts?.href,
  });
}

export function logStatusChanged(
  objectType: ActivityObjectType,
  objectId: string,
  label: string,
  detail: string,
  opts?: { href?: string }
) {
  logActivity({
    action: "status_changed",
    objectType,
    objectId,
    label,
    detail,
    href: opts?.href,
  });
}

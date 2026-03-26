import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Timestamp;
  endTime: Timestamp;
  source: string;
  googleEventId: string | null;
  lastSyncedAt: Timestamp | null;
  createdAt: unknown;
}

const COLLECTION = "calendarEvents";

export async function createCalendarEvent(fields: {
  title: string;
  startTime: Date;
  endTime: Date;
  source?: string;
  googleEventId?: string | null;
}): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    title: fields.title,
    startTime: fields.startTime,
    endTime: fields.endTime,
    source: fields.source ?? "manual",
    googleEventId: fields.googleEventId ?? null,
    lastSyncedAt: fields.googleEventId ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCalendarEvent(
  eventId: string,
  fields: {
    title?: string;
    startTime?: Date;
    endTime?: Date;
    lastSyncedAt?: true;
  }
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (fields.title !== undefined) updates.title = fields.title;
  if (fields.startTime !== undefined) updates.startTime = fields.startTime;
  if (fields.endTime !== undefined) updates.endTime = fields.endTime;
  if (fields.lastSyncedAt) updates.lastSyncedAt = serverTimestamp();
  await updateDoc(doc(db, COLLECTION, eventId), updates);
}

export async function getCalendarEvents(date: Date): Promise<CalendarEvent[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, COLLECTION),
    where("startTime", ">=", start),
    where("startTime", "<=", end),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CalendarEvent[];
}

export async function getCalendarEventsRange(
  start: Date,
  end: Date
): Promise<CalendarEvent[]> {
  const q = query(
    collection(db, COLLECTION),
    where("startTime", ">=", start),
    where("startTime", "<=", end),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CalendarEvent[];
}

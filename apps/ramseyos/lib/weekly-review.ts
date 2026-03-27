import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { toDate } from "./shared";

/* ── Types ── */

export interface WeeklyReview {
  id: string;
  weekOf: string; // "YYYY-MM-DD" (Monday of the week)
  wins: string;
  challenges: string;
  lessonsLearned: string;
  nextWeekPriorities: string;
  energyLevel: "high" | "medium" | "low" | null;
  overallRating: number | null; // 1-5
  createdAt: Date | null;
  updatedAt: Date | null;
}

/* ── Queries ── */

export async function getWeeklyReviews(): Promise<WeeklyReview[]> {
  const q = query(collection(db, "weeklyReviews"), orderBy("weekOf", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    weekOf: d.data().weekOf ?? "",
    wins: d.data().wins ?? "",
    challenges: d.data().challenges ?? "",
    lessonsLearned: d.data().lessonsLearned ?? "",
    nextWeekPriorities: d.data().nextWeekPriorities ?? "",
    energyLevel: d.data().energyLevel ?? null,
    overallRating: d.data().overallRating ?? null,
    createdAt: toDate(d.data().createdAt),
    updatedAt: toDate(d.data().updatedAt),
  }));
}

export async function getWeeklyReview(id: string): Promise<WeeklyReview | null> {
  const { getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(db, "weeklyReviews", id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    weekOf: d.weekOf ?? "",
    wins: d.wins ?? "",
    challenges: d.challenges ?? "",
    lessonsLearned: d.lessonsLearned ?? "",
    nextWeekPriorities: d.nextWeekPriorities ?? "",
    energyLevel: d.energyLevel ?? null,
    overallRating: d.overallRating ?? null,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export async function createWeeklyReview(weekOf: string): Promise<string> {
  const ref = await addDoc(collection(db, "weeklyReviews"), {
    weekOf,
    wins: "",
    challenges: "",
    lessonsLearned: "",
    nextWeekPriorities: "",
    energyLevel: null,
    overallRating: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateWeeklyReview(
  id: string,
  fields: Partial<Omit<WeeklyReview, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
  await updateDoc(doc(db, "weeklyReviews", id), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

/* ── Helpers ── */

/** Get Monday of the current week as "YYYY-MM-DD". */
export function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().slice(0, 10);
}

/** Format a week label like "Mar 24 – Mar 30". */
export function formatWeekLabel(weekOf: string): string {
  const d = new Date(weekOf + "T00:00:00");
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${d.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

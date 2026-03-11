import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type SparkStatus = "not-started" | "in-progress" | "deployed";

export interface LessonPlan {
  id: string;
  title: string;
  course: string;
  description: string;
  tags: string[];
  reflection: string;
  linkedResourceIds: string[];
  sparkLink: string;
  sparkStatus: SparkStatus;
  lastTaughtAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export async function getLessonPlans(): Promise<LessonPlan[]> {
  const q = query(
    collection(db, "lessonPlans"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    course: d.data().course,
    description: d.data().description,
    tags: d.data().tags ?? [],
    reflection: d.data().reflection ?? "",
    linkedResourceIds: d.data().linkedResourceIds ?? [],
    sparkLink: d.data().sparkLink ?? "",
    sparkStatus: d.data().sparkStatus ?? "not-started",
    lastTaughtAt: d.data().lastTaughtAt ?? null,
    createdAt: d.data().createdAt ?? null,
    updatedAt: d.data().updatedAt ?? null,
  }));
}

export async function getLessonPlan(id: string): Promise<LessonPlan | null> {
  const snap = await getDoc(doc(db, "lessonPlans", id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    title: d.title,
    course: d.course,
    description: d.description,
    tags: d.tags ?? [],
    reflection: d.reflection ?? "",
    linkedResourceIds: d.linkedResourceIds ?? [],
    sparkLink: d.sparkLink ?? "",
    sparkStatus: d.sparkStatus ?? "not-started",
    lastTaughtAt: d.lastTaughtAt ?? null,
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
  };
}

export interface LessonPlanUpdate {
  title?: string;
  course?: string;
  description?: string;
  tags?: string[];
  reflection?: string;
  linkedResourceIds?: string[];
  sparkLink?: string;
  sparkStatus?: SparkStatus;
  lastTaughtAt?: Timestamp | null;
}

export async function updateLessonPlan(
  id: string,
  data: LessonPlanUpdate
): Promise<void> {
  await updateDoc(doc(db, "lessonPlans", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

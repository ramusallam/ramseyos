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

export interface LessonPlan {
  id: string;
  title: string;
  course: string;
  description: string;
  tags: string[];
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
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
  };
}

export interface LessonPlanUpdate {
  title?: string;
  course?: string;
  description?: string;
  tags?: string[];
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

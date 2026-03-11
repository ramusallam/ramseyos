import {
  collection,
  query,
  orderBy,
  getDocs,
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

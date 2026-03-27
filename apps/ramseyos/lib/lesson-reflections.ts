import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type EngagementLevel = "high" | "medium" | "low";

export interface LessonReflection {
  id: string;
  lessonId: string;
  dateTaught: string; // "YYYY-MM-DD"
  whatWorked: string;
  whatToChange: string;
  studentEngagement: EngagementLevel | null;
  notes: string;
  createdAt: Timestamp | null;
}

const COL = "lessonReflections";

export async function createLessonReflection(fields: {
  lessonId: string;
  dateTaught: string;
  whatWorked?: string;
  whatToChange?: string;
  studentEngagement?: EngagementLevel | null;
  notes?: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    lessonId: fields.lessonId,
    dateTaught: fields.dateTaught,
    whatWorked: fields.whatWorked ?? "",
    whatToChange: fields.whatToChange ?? "",
    studentEngagement: fields.studentEngagement ?? null,
    notes: fields.notes ?? "",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getReflectionsForLesson(
  lessonId: string
): Promise<LessonReflection[]> {
  const q = query(
    collection(db, COL),
    where("lessonId", "==", lessonId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    lessonId: d.data().lessonId,
    dateTaught: d.data().dateTaught ?? "",
    whatWorked: d.data().whatWorked ?? "",
    whatToChange: d.data().whatToChange ?? "",
    studentEngagement: d.data().studentEngagement ?? null,
    notes: d.data().notes ?? "",
    createdAt: d.data().createdAt ?? null,
  }));
}

export async function updateLessonReflection(
  id: string,
  data: Partial<Omit<LessonReflection, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data });
}

export async function deleteLessonReflection(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

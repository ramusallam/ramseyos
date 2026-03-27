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

export interface Unit {
  id: string;
  title: string;
  course: string;
  description: string;
  orderIndex: number;
  tags: string[];
  createdAt: Timestamp | null;
}

const COL = "units";

export async function createUnit(fields: {
  title: string;
  course: string;
  description?: string;
  orderIndex?: number;
  tags?: string[];
}): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    title: fields.title,
    course: fields.course,
    description: fields.description ?? "",
    orderIndex: fields.orderIndex ?? 0,
    tags: fields.tags ?? [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUnitsByCourse(course: string): Promise<Unit[]> {
  const q = query(
    collection(db, COL),
    where("course", "==", course),
    orderBy("orderIndex", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    course: d.data().course,
    description: d.data().description ?? "",
    orderIndex: d.data().orderIndex ?? 0,
    tags: d.data().tags ?? [],
    createdAt: d.data().createdAt ?? null,
  }));
}

export async function getAllUnits(): Promise<Unit[]> {
  const q = query(collection(db, COL), orderBy("course", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    course: d.data().course,
    description: d.data().description ?? "",
    orderIndex: d.data().orderIndex ?? 0,
    tags: d.data().tags ?? [],
    createdAt: d.data().createdAt ?? null,
  }));
}

export async function updateUnit(
  id: string,
  data: Partial<Omit<Unit, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data });
}

export async function deleteUnit(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

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

export interface Standard {
  id: string;
  framework: string; // "NGSS" | "AP-Chemistry" | "Custom"
  code: string; // "HS-PS1-1"
  description: string;
  course: string;
  createdAt: Timestamp | null;
}

const COL = "standards";

export async function createStandard(fields: {
  framework: string;
  code: string;
  description: string;
  course: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    framework: fields.framework,
    code: fields.code,
    description: fields.description,
    course: fields.course,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getStandardsByCourse(
  course: string
): Promise<Standard[]> {
  const q = query(
    collection(db, COL),
    where("course", "==", course),
    orderBy("framework", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    framework: d.data().framework,
    code: d.data().code,
    description: d.data().description,
    course: d.data().course,
    createdAt: d.data().createdAt ?? null,
  }));
}

export async function getAllStandards(): Promise<Standard[]> {
  const q = query(collection(db, COL), orderBy("framework", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    framework: d.data().framework,
    code: d.data().code,
    description: d.data().description,
    course: d.data().course,
    createdAt: d.data().createdAt ?? null,
  }));
}

export async function updateStandard(
  id: string,
  data: Partial<Omit<Standard, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data });
}

export async function deleteStandard(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

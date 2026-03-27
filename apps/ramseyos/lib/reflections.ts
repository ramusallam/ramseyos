import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Reflection {
  id: string;
  date: string; // "YYYY-MM-DD"
  wins: string;
  tomorrow: string;
  mood: "great" | "good" | "okay" | "rough";
  createdAt: Timestamp | null;
}

const COLLECTION = "reflections";

export async function createReflection(fields: {
  wins: string;
  tomorrow: string;
  mood: Reflection["mood"];
}): Promise<string> {
  const date = new Date().toISOString().slice(0, 10);
  const ref = await addDoc(collection(db, COLLECTION), {
    date,
    wins: fields.wins,
    tomorrow: fields.tomorrow,
    mood: fields.mood,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTodayReflection(): Promise<Reflection | null> {
  const date = new Date().toISOString().slice(0, 10);
  const q = query(
    collection(db, COLLECTION),
    where("date", "==", date),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Reflection;
}

export async function getReflectionsForWeek(
  startDate: Date,
  endDate: Date
): Promise<Reflection[]> {
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const q = query(
    collection(db, COLLECTION),
    where("date", ">=", startStr),
    where("date", "<=", endStr),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Reflection[];
}

export async function getRecentReflections(count = 7): Promise<Reflection[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy("date", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Reflection[];
}

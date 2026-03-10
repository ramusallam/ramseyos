import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface DailyTask {
  id: string;
  title: string;
  active: boolean;
  order: number | null;
  createdAt: unknown;
}

const COLLECTION = "dailyTasks";

export async function createDailyTask(fields: {
  title: string;
  active?: boolean;
  order?: number | null;
}): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    title: fields.title,
    active: fields.active ?? true,
    order: fields.order ?? null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

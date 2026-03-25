import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Re-export Priority from shared so all consumers get the same type.
export { type Priority } from "./shared";
import { type Priority } from "./shared";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  projectId: string | null;
  sourceCaptureId: string | null;
  notes: string | null;
  createdAt: unknown;
}

const COLLECTION = "tasks";

export async function createTask(fields: {
  title: string;
  priority?: Priority;
  projectId?: string | null;
  sourceCaptureId?: string | null;
  notes?: string | null;
}): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    title: fields.title,
    completed: false,
    priority: fields.priority ?? null,
    projectId: fields.projectId ?? null,
    sourceCaptureId: fields.sourceCaptureId ?? null,
    notes: fields.notes ?? null,
    chosenForToday: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTaskProject(
  taskId: string,
  projectId: string | null
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, taskId), { projectId });
}

export async function toggleTaskCompleted(
  taskId: string,
  current: boolean
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, taskId), {
    completed: !current,
  });
}

export async function toggleChosenForToday(
  taskId: string,
  current: boolean
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, taskId), {
    chosenForToday: !current,
  });
}

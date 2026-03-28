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
  try {
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
  } catch (err) {
    console.error("[createTask]", err);
    throw err;
  }
}

export async function updateTaskProject(
  taskId: string,
  projectId: string | null
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, taskId), { projectId });
  } catch (err) {
    console.error("[updateTaskProject]", err);
    throw err;
  }
}

export async function toggleTaskCompleted(
  taskId: string,
  current: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, taskId), {
      completed: !current,
    });
  } catch (err) {
    console.error("[toggleTaskCompleted]", err);
    throw err;
  }
}

export async function toggleChosenForToday(
  taskId: string,
  current: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, taskId), {
      chosenForToday: !current,
    });
  } catch (err) {
    console.error("[toggleChosenForToday]", err);
    throw err;
  }
}

export async function toggleTaskPinned(
  taskId: string,
  current: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, taskId), {
      pinned: !current,
    });
  } catch (err) {
    console.error("[toggleTaskPinned]", err);
    throw err;
  }
}

export async function updateTaskTitle(
  taskId: string,
  title: string
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, taskId), { title });
  } catch (err) {
    console.error("[updateTaskTitle]", err);
    throw err;
  }
}

export async function updateTaskNotes(
  taskId: string,
  notes: string | null
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, taskId), { notes });
  } catch (err) {
    console.error("[updateTaskNotes]", err);
    throw err;
  }
}

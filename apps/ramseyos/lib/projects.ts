import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type ProjectStatus = "active" | "paused" | "completed" | "archived";

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  workspaceId: string | null;
  archived: boolean;
  color: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

const COLLECTION = "projects";

export async function createProject(fields: {
  title: string;
  description?: string;
  workspaceId?: string | null;
  color?: string | null;
}): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      title: fields.title,
      description: fields.description ?? "",
      status: "active" as ProjectStatus,
      workspaceId: fields.workspaceId ?? null,
      archived: false,
      color: fields.color ?? null,
      owner: null,
      tags: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("[createProject]", err);
    throw err;
  }
}

export async function getProjects(opts?: {
  includeArchived?: boolean;
}): Promise<Project[]> {
  const q = opts?.includeArchived
    ? query(collection(db, COLLECTION), orderBy("createdAt", "desc"))
    : query(
        collection(db, COLLECTION),
        where("archived", "==", false),
        orderBy("createdAt", "desc")
      );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Project;
}

export async function archiveProject(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      archived: true,
      status: "archived" as ProjectStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[archiveProject]", err);
    throw err;
  }
}

export async function toggleProjectPinned(
  id: string,
  current: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      pinned: !current,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[toggleProjectPinned]", err);
    throw err;
  }
}

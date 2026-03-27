import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* ── Types ── */

export type RubricStatus = "draft" | "active" | "archived";

export interface RubricLevel {
  label: string; // "Exemplary" | "Proficient" | "Developing" | "Beginning"
  points: number;
  description: string;
}

export interface RubricCriterion {
  id: string; // stable UUID
  label: string;
  description: string;
  maxPoints: number;
  levels: RubricLevel[];
}

export interface Rubric {
  id: string;
  title: string;
  course: string;
  description: string;
  criteria: RubricCriterion[];
  totalPoints: number;
  tags: string[];
  status: RubricStatus;
  sourceRubricId: string | null;
  version: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/* ── Helpers ── */

const COL = "rubrics";

const DEFAULT_LEVELS: RubricLevel[] = [
  { label: "Exemplary", points: 4, description: "" },
  { label: "Proficient", points: 3, description: "" },
  { label: "Developing", points: 2, description: "" },
  { label: "Beginning", points: 1, description: "" },
];

export function makeDefaultLevels(maxPoints: number): RubricLevel[] {
  return DEFAULT_LEVELS.map((l, i) => ({
    ...l,
    points: Math.round((maxPoints * (4 - i)) / 4),
  }));
}

export function makeCriterionId(): string {
  return crypto.randomUUID();
}

function docToRubric(id: string, d: Record<string, unknown>): Rubric {
  return {
    id,
    title: (d.title as string) ?? "",
    course: (d.course as string) ?? "",
    description: (d.description as string) ?? "",
    criteria: (d.criteria as RubricCriterion[]) ?? [],
    totalPoints: (d.totalPoints as number) ?? 0,
    tags: (d.tags as string[]) ?? [],
    status: (d.status as RubricStatus) ?? "draft",
    sourceRubricId: (d.sourceRubricId as string) ?? null,
    version: (d.version as number) ?? 1,
    createdAt: (d.createdAt as Timestamp) ?? null,
    updatedAt: (d.updatedAt as Timestamp) ?? null,
  };
}

/* ── CRUD ── */

export async function createRubric(fields: {
  title: string;
  course?: string;
  description?: string;
  criteria?: RubricCriterion[];
  tags?: string[];
}): Promise<string> {
  const criteria = fields.criteria ?? [];
  const totalPoints = criteria.reduce((s, c) => s + c.maxPoints, 0);
  const ref = await addDoc(collection(db, COL), {
    title: fields.title,
    course: fields.course ?? "",
    description: fields.description ?? "",
    criteria,
    totalPoints,
    tags: fields.tags ?? [],
    status: "draft" as RubricStatus,
    sourceRubricId: null,
    version: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getRubrics(): Promise<Rubric[]> {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToRubric(d.id, d.data()));
}

export async function getRubricsByCourse(course: string): Promise<Rubric[]> {
  const q = query(
    collection(db, COL),
    where("course", "==", course),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToRubric(d.id, d.data()));
}

export async function getRubric(id: string): Promise<Rubric | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return docToRubric(snap.id, snap.data());
}

export async function updateRubric(
  id: string,
  data: Partial<Omit<Rubric, "id" | "createdAt">>
): Promise<void> {
  const update: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
  // Auto-calc totalPoints if criteria changed
  if (data.criteria) {
    update.totalPoints = data.criteria.reduce((s, c) => s + c.maxPoints, 0);
  }
  await updateDoc(doc(db, COL, id), update);
}

export async function duplicateRubric(id: string): Promise<string | null> {
  const original = await getRubric(id);
  if (!original) return null;
  const ref = await addDoc(collection(db, COL), {
    title: `${original.title} (v${original.version + 1})`,
    course: original.course,
    description: original.description,
    criteria: original.criteria,
    totalPoints: original.totalPoints,
    tags: original.tags,
    status: "draft" as RubricStatus,
    sourceRubricId: id,
    version: original.version + 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function archiveRubric(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "archived" as RubricStatus,
    updatedAt: serverTimestamp(),
  });
}

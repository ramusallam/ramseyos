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
import { logCreated, logUpdated, logActivity } from "./activity-log";

/* ── Types ── */

export type SparkStatus = "not-started" | "in-progress" | "deployed";
export type LessonStatus = "draft" | "ready" | "taught" | "revised" | "archived";

export interface MaterialItem {
  name: string;
  quantity: string;
  notes: string;
  sourceName: string;
  sourceUrl: string;
  vendorId?: string;
  favorite?: boolean;
  recurring?: boolean;
  needToBuy?: boolean;
  purchaseNotes?: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  course: string;
  unitId: string | null;
  status: LessonStatus;

  // Structured content (5E aligned)
  objective: string;
  warmUp: string;
  activities: string;
  assessment: string;
  keyQuestions: string[];
  differentiation: string;
  closingNotes: string;

  // Legacy / overflow
  description: string;
  tags: string[];
  reflection: string;

  // Links
  linkedResourceIds: string[];
  rubricIds: string[];
  standardIds: string[];

  // Materials
  materials: MaterialItem[];

  // Spark
  sparkLink: string;
  sparkStatus: SparkStatus;
  sparkExportedAt: string | null;

  // Dates
  taughtDates: string[];
  lastTaughtAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/* ── Helpers ── */

function docToLessonPlan(id: string, d: Record<string, unknown>): LessonPlan {
  return {
    id,
    title: (d.title as string) ?? "",
    course: (d.course as string) ?? "",
    unitId: (d.unitId as string) ?? null,
    status: (d.status as LessonStatus) ?? "draft",
    objective: (d.objective as string) ?? "",
    warmUp: (d.warmUp as string) ?? "",
    activities: (d.activities as string) ?? "",
    assessment: (d.assessment as string) ?? "",
    keyQuestions: (d.keyQuestions as string[]) ?? [],
    differentiation: (d.differentiation as string) ?? "",
    closingNotes: (d.closingNotes as string) ?? "",
    description: (d.description as string) ?? "",
    tags: (d.tags as string[]) ?? [],
    reflection: (d.reflection as string) ?? "",
    linkedResourceIds: (d.linkedResourceIds as string[]) ?? [],
    rubricIds: (d.rubricIds as string[]) ?? [],
    standardIds: (d.standardIds as string[]) ?? [],
    materials: (d.materials as MaterialItem[]) ?? [],
    sparkLink: (d.sparkLink as string) ?? "",
    sparkStatus: (d.sparkStatus as SparkStatus) ?? "not-started",
    sparkExportedAt: (d.sparkExportedAt as string) ?? null,
    taughtDates: (d.taughtDates as string[]) ?? [],
    lastTaughtAt: (d.lastTaughtAt as Timestamp) ?? null,
    createdAt: (d.createdAt as Timestamp) ?? null,
    updatedAt: (d.updatedAt as Timestamp) ?? null,
  };
}

/* ── CRUD ── */

const COL = "lessonPlans";

export async function createLessonPlan(fields: {
  title: string;
  course?: string;
  unitId?: string | null;
  status?: LessonStatus;
}): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COL), {
      title: fields.title,
      course: fields.course ?? "",
      unitId: fields.unitId ?? null,
      status: fields.status ?? "draft",
      objective: "",
      warmUp: "",
      activities: "",
      assessment: "",
      keyQuestions: [],
      differentiation: "",
      closingNotes: "",
      description: "",
      tags: [],
      reflection: "",
      linkedResourceIds: [],
      rubricIds: [],
      standardIds: [],
      materials: [],
      sparkLink: "",
      sparkStatus: "not-started" as SparkStatus,
      sparkExportedAt: null,
      taughtDates: [],
      lastTaughtAt: null,
      pinned: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    logCreated("lesson-plan", ref.id, fields.title, { href: `/lesson-plans/${ref.id}` });
    return ref.id;
  } catch (err) {
    console.error("[createLessonPlan]", err);
    throw err;
  }
}

export async function getLessonPlans(): Promise<LessonPlan[]> {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToLessonPlan(d.id, d.data()));
}

export async function getLessonPlansByCourse(course: string): Promise<LessonPlan[]> {
  const q = query(
    collection(db, COL),
    where("course", "==", course),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToLessonPlan(d.id, d.data()));
}

export async function getLessonPlan(id: string): Promise<LessonPlan | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return docToLessonPlan(snap.id, snap.data());
}

export interface LessonPlanUpdate {
  title?: string;
  course?: string;
  unitId?: string | null;
  status?: LessonStatus;
  objective?: string;
  warmUp?: string;
  activities?: string;
  assessment?: string;
  keyQuestions?: string[];
  differentiation?: string;
  closingNotes?: string;
  description?: string;
  tags?: string[];
  reflection?: string;
  linkedResourceIds?: string[];
  rubricIds?: string[];
  standardIds?: string[];
  materials?: MaterialItem[];
  sparkLink?: string;
  sparkStatus?: SparkStatus;
  sparkExportedAt?: string | null;
  taughtDates?: string[];
  lastTaughtAt?: Timestamp | null;
}

export async function updateLessonPlan(
  id: string,
  data: LessonPlanUpdate
): Promise<void> {
  try {
    await updateDoc(doc(db, COL, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    if (data.status) {
      logActivity({ action: "status_changed", objectType: "lesson-plan", objectId: id, label: data.title ?? "Lesson plan", detail: `Status → ${data.status}`, href: `/lesson-plans/${id}` });
    } else {
      logUpdated("lesson-plan", id, data.title ?? "Lesson plan", { href: `/lesson-plans/${id}` });
    }
  } catch (err) {
    console.error("[updateLessonPlan]", err);
    throw err;
  }
}

/* ── Duplicate ── */

export async function duplicateLessonPlan(id: string): Promise<string | null> {
  try {
    const original = await getLessonPlan(id);
    if (!original) return null;

    const ref = await addDoc(collection(db, COL), {
      title: `${original.title} (copy)`,
      course: original.course,
      unitId: original.unitId,
      status: "draft" as LessonStatus,
      objective: original.objective,
      warmUp: original.warmUp,
      activities: original.activities,
      assessment: original.assessment,
      keyQuestions: original.keyQuestions,
      differentiation: original.differentiation,
      closingNotes: original.closingNotes,
      description: original.description,
      tags: original.tags,
      reflection: "",
      linkedResourceIds: original.linkedResourceIds,
      rubricIds: original.rubricIds,
      standardIds: original.standardIds,
      materials: original.materials,
      sparkLink: "",
      sparkStatus: "not-started" as SparkStatus,
      sparkExportedAt: null,
      taughtDates: [],
      lastTaughtAt: null,
      pinned: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("[duplicateLessonPlan]", err);
    throw err;
  }
}

/* ── Archive ── */

export async function archiveLessonPlan(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, COL, id), {
      status: "archived" as LessonStatus,
      updatedAt: serverTimestamp(),
    });
    logActivity({ action: "archived", objectType: "lesson-plan", objectId: id, label: "Lesson plan archived", href: `/lesson-plans/${id}` });
  } catch (err) {
    console.error("[archiveLessonPlan]", err);
    throw err;
  }
}

export async function unarchiveLessonPlan(id: string): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "draft" as LessonStatus,
    updatedAt: serverTimestamp(),
  });
}

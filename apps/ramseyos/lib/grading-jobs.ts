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

export type IntakeMethod = "upload" | "webcam" | "typed";
export type GradingJobStatus = "pending" | "analyzing" | "review" | "approved" | "failed";

export interface CriterionScore {
  criterionId: string;
  criterionLabel: string;
  score: number;
  maxPoints: number;
  reasoning: string;
  feedback: string;
}

export interface AIGradingAnalysis {
  criterionScores: CriterionScore[];
  totalScore: number;
  totalPossible: number;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  confidence: "high" | "medium" | "low";
}

export interface GradingJob {
  id: string;
  studentName: string;
  groupId: string;
  lessonId: string | null;
  rubricId: string;
  assignmentName: string;
  intakeMethod: IntakeMethod;
  studentWork: string;
  status: GradingJobStatus;
  aiAnalysis: AIGradingAnalysis | null;
  finalScores: CriterionScore[] | null;
  finalFeedback: string | null;
  finalTotalScore: number | null;
  finalTotalPossible: number | null;
  reviewedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/* ── Helpers ── */

const COL = "gradingJobs";

function docToJob(id: string, d: Record<string, unknown>): GradingJob {
  return {
    id,
    studentName: (d.studentName as string) ?? "",
    groupId: (d.groupId as string) ?? "",
    lessonId: (d.lessonId as string) ?? null,
    rubricId: (d.rubricId as string) ?? "",
    assignmentName: (d.assignmentName as string) ?? "",
    intakeMethod: (d.intakeMethod as IntakeMethod) ?? "typed",
    studentWork: (d.studentWork as string) ?? "",
    status: (d.status as GradingJobStatus) ?? "pending",
    aiAnalysis: (d.aiAnalysis as AIGradingAnalysis) ?? null,
    finalScores: (d.finalScores as CriterionScore[]) ?? null,
    finalFeedback: (d.finalFeedback as string) ?? null,
    finalTotalScore: (d.finalTotalScore as number) ?? null,
    finalTotalPossible: (d.finalTotalPossible as number) ?? null,
    reviewedAt: (d.reviewedAt as Timestamp) ?? null,
    createdAt: (d.createdAt as Timestamp) ?? null,
    updatedAt: (d.updatedAt as Timestamp) ?? null,
  };
}

/* ── CRUD ── */

export async function createGradingJob(fields: {
  studentName: string;
  groupId: string;
  lessonId?: string | null;
  rubricId: string;
  assignmentName: string;
  intakeMethod: IntakeMethod;
  studentWork?: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    studentName: fields.studentName,
    groupId: fields.groupId,
    lessonId: fields.lessonId ?? null,
    rubricId: fields.rubricId,
    assignmentName: fields.assignmentName,
    intakeMethod: fields.intakeMethod,
    studentWork: fields.studentWork ?? "",
    status: "pending" as GradingJobStatus,
    aiAnalysis: null,
    finalScores: null,
    finalFeedback: null,
    finalTotalScore: null,
    finalTotalPossible: null,
    reviewedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getGradingJobs(): Promise<GradingJob[]> {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToJob(d.id, d.data()));
}

export async function getGradingJobsByRubric(rubricId: string): Promise<GradingJob[]> {
  const q = query(
    collection(db, COL),
    where("rubricId", "==", rubricId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToJob(d.id, d.data()));
}

export async function getGradingJob(id: string): Promise<GradingJob | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return docToJob(snap.id, snap.data());
}

export async function updateGradingJob(
  id: string,
  data: Partial<Omit<GradingJob, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/* ── Status transitions ── */

export async function markAnalyzing(id: string): Promise<void> {
  await updateGradingJob(id, { status: "analyzing" });
}

export async function markForReview(
  id: string,
  analysis: AIGradingAnalysis
): Promise<void> {
  await updateGradingJob(id, { status: "review", aiAnalysis: analysis });
}

export async function approveGradingJob(
  id: string,
  finals: {
    scores: CriterionScore[];
    feedback: string;
    totalScore: number;
    totalPossible: number;
  }
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    status: "approved",
    finalScores: finals.scores,
    finalFeedback: finals.feedback,
    finalTotalScore: finals.totalScore,
    finalTotalPossible: finals.totalPossible,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function markFailed(id: string): Promise<void> {
  await updateGradingJob(id, { status: "failed" });
}

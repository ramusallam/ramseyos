import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type RecommendationStatus = "request" | "drafting" | "review" | "final" | "sent" | "archived";

export interface Recommendation {
  id: string;
  studentName: string;
  institution: string;
  relationship: string;
  coursesWithStudent: string;
  strengths: string;
  anecdotes: string;
  additionalNotes: string;
  dueDate: string | null;
  status: RecommendationStatus;
  draftContent: string;
  workspaceId: string | null;
  approvalId: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export async function createRecommendation(fields: {
  studentName: string;
  institution?: string;
  relationship?: string;
  coursesWithStudent?: string;
  strengths?: string;
  anecdotes?: string;
  additionalNotes?: string;
  dueDate?: string;
  workspaceId?: string;
}): Promise<string> {
  try {
    const ref = await addDoc(collection(db, "recommendations"), {
      studentName: fields.studentName,
      institution: fields.institution || "",
      relationship: fields.relationship || "",
      coursesWithStudent: fields.coursesWithStudent || "",
      strengths: fields.strengths || "",
      anecdotes: fields.anecdotes || "",
      additionalNotes: fields.additionalNotes || "",
      dueDate: fields.dueDate || null,
      status: "request",
      draftContent: "",
      workspaceId: fields.workspaceId || null,
      approvalId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("[createRecommendation]", err);
    throw err;
  }
}

export async function getRecommendations(): Promise<Recommendation[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "recommendations"), orderBy("createdAt", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recommendation));
  } catch (err) {
    console.error("[getRecommendations]", err);
    return [];
  }
}

export async function getRecommendation(id: string): Promise<Recommendation | null> {
  try {
    const snap = await getDoc(doc(db, "recommendations", id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Recommendation;
  } catch (err) {
    console.error("[getRecommendation]", err);
    return null;
  }
}

export async function updateRecommendation(id: string, data: Partial<Omit<Recommendation, "id" | "createdAt">>): Promise<void> {
  try {
    await updateDoc(doc(db, "recommendations", id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[updateRecommendation]", err);
    throw err;
  }
}

export async function updateRecommendationStatus(id: string, status: RecommendationStatus): Promise<void> {
  try {
    await updateDoc(doc(db, "recommendations", id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[updateRecommendationStatus]", err);
    throw err;
  }
}

export async function deleteRecommendation(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "recommendations", id));
  } catch (err) {
    console.error("[deleteRecommendation]", err);
    throw err;
  }
}

export async function getActiveRecommendations(): Promise<Recommendation[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "recommendations"), where("status", "!=", "archived"), orderBy("status"), orderBy("createdAt", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recommendation));
  } catch (err) {
    console.error("[getActiveRecommendations]", err);
    return [];
  }
}

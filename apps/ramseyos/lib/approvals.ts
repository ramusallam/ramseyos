import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  type Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "revised";
export type ApprovalType = "grading" | "communication" | "lesson-plan" | "recommendation" | "ai-draft" | "other";

export interface ApprovalItem {
  id: string;
  title: string;
  type: ApprovalType;
  sourceWorkspace: string | null;
  sourceSystem: string;
  relatedObjectId: string | null;
  relatedRoute: string | null;
  content: string;
  status: ApprovalStatus;
  reviewNotes: string | null;
  createdAt: Timestamp | null;
  reviewedAt: Timestamp | null;
}

export async function createApproval(fields: {
  title: string;
  type: ApprovalType;
  sourceWorkspace?: string;
  sourceSystem: string;
  relatedObjectId?: string;
  relatedRoute?: string;
  content: string;
}): Promise<string> {
  try {
    const ref = await addDoc(collection(db, "approvals"), {
      title: fields.title,
      type: fields.type,
      sourceWorkspace: fields.sourceWorkspace || null,
      sourceSystem: fields.sourceSystem,
      relatedObjectId: fields.relatedObjectId || null,
      relatedRoute: fields.relatedRoute || null,
      content: fields.content,
      status: "pending",
      reviewNotes: null,
      createdAt: serverTimestamp(),
      reviewedAt: null,
    });
    return ref.id;
  } catch (err) {
    console.error("[createApproval]", err);
    throw err;
  }
}

export async function getPendingApprovals(): Promise<ApprovalItem[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "approvals"), where("status", "==", "pending"), orderBy("createdAt", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ApprovalItem));
  } catch (err) {
    console.error("[getPendingApprovals]", err);
    return [];
  }
}

export async function getAllApprovals(): Promise<ApprovalItem[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "approvals"), orderBy("createdAt", "desc"))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ApprovalItem));
  } catch (err) {
    console.error("[getAllApprovals]", err);
    return [];
  }
}

export async function approveItem(id: string, notes?: string): Promise<void> {
  try {
    await updateDoc(doc(db, "approvals", id), {
      status: "approved",
      reviewNotes: notes || null,
      reviewedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[approveItem]", err);
    throw err;
  }
}

export async function rejectItem(id: string, notes?: string): Promise<void> {
  try {
    await updateDoc(doc(db, "approvals", id), {
      status: "rejected",
      reviewNotes: notes || null,
      reviewedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[rejectItem]", err);
    throw err;
  }
}

export async function reviseItem(id: string, revisedContent: string, notes?: string): Promise<void> {
  try {
    await updateDoc(doc(db, "approvals", id), {
      status: "revised",
      content: revisedContent,
      reviewNotes: notes || null,
      reviewedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[reviseItem]", err);
    throw err;
  }
}

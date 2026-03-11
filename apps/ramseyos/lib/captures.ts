import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type CaptureSource = "manual" | "email" | "api" | "automation";

export interface CaptureInput {
  text: string;
  source?: CaptureSource;
  priority?: "low" | "medium" | "high" | null;
  type?: "capture" | "task" | "note" | "idea" | "resource";
  projectId?: string | null;
}

export async function createCapture(input: CaptureInput): Promise<string> {
  const ref = await addDoc(collection(db, "captures"), {
    text: input.text,
    source: input.source ?? "manual",
    type: input.type ?? "capture",
    priority: input.priority ?? null,
    projectId: input.projectId ?? null,
    processed: false,
    status: "unprocessed",
    createdAt: serverTimestamp(),
    tags: [],
  });
  return ref.id;
}

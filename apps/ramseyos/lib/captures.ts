import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { logCreated } from "./activity-log";

export type CaptureSource =
  | "manual"
  | "email"
  | "api"
  | "automation"
  | "mobile"
  | "siri"
  | "share"
  | "voice";

export type CaptureType = "capture" | "task" | "note" | "idea" | "resource";

export interface SourceMeta {
  label: string;
  icon: string;
  color: string;
}

export const SOURCE_META: Record<CaptureSource, SourceMeta> = {
  manual: { label: "Manual", icon: "M5 6h6M5 9h4", color: "text-muted/50" },
  email: { label: "Email", icon: "M1.5 3.5l6.5 5 6.5-5", color: "text-sky-400/60" },
  api: { label: "API", icon: "M4 4l8 4-8 4V4z", color: "text-violet-400/60" },
  automation: { label: "Auto", icon: "M2 8h12M8 2v12", color: "text-emerald-400/60" },
  mobile: { label: "Mobile", icon: "M5 2h6v12H5V2z", color: "text-sky-400/60" },
  siri: { label: "Siri", icon: "M8 2a6 6 0 100 12A6 6 0 008 2z", color: "text-violet-400/60" },
  share: { label: "Share", icon: "M4 9V13h8V9M8 2v8M5 5l3-3 3 3", color: "text-amber-400/60" },
  voice: { label: "Voice", icon: "M8 2v8M5 6v4M11 6v4M3 10a5 5 0 0010 0", color: "text-rose-400/60" },
};

export interface CaptureInput {
  text: string;
  source?: CaptureSource;
  priority?: "low" | "medium" | "high" | null;
  type?: CaptureType;
  projectId?: string | null;
}

export async function createCapture(input: CaptureInput): Promise<string> {
  try {
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
    logCreated("capture", ref.id, input.text.slice(0, 60), { href: "/inbox" });
    return ref.id;
  } catch (err) {
    console.error("[createCapture]", err);
    throw err;
  }
}

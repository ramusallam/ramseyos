import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type DraftStatus = "draft" | "ready" | "sent" | "failed";

export interface DraftItem {
  id: string;
  templateId: string;
  groupId: string;
  subject: string;
  body: string;
  status: DraftStatus;
  createdAt: string;
}

export async function getDrafts(): Promise<DraftItem[]> {
  const q = query(
    collection(db, "communicationDrafts"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    templateId: d.data().templateId ?? "",
    groupId: d.data().groupId ?? "",
    subject: d.data().subject ?? "",
    body: d.data().body ?? "",
    status: d.data().status ?? "draft",
    createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() ?? "",
  }));
}

export async function seedDrafts(): Promise<number> {
  const existing = await getDocs(collection(db, "communicationDrafts"));
  if (existing.size > 0) return 0;

  const seeds: Omit<DraftItem, "id" | "createdAt">[] = [
    {
      templateId: "",
      groupId: "",
      subject: "Quick update from class",
      body: "Dear families,\n\nI wanted to share a quick update on what we've been working on in class this week. Students have been engaged in hands-on inquiry and I'm excited about the progress I'm seeing.\n\nPlease don't hesitate to reach out if you have any questions.\n\nBest,\nRamsey",
      status: "draft",
    },
    {
      templateId: "",
      groupId: "",
      subject: "Upcoming lab schedule change",
      body: "Hi everyone,\n\nJust a heads-up that our lab schedule will shift next week due to the assembly. Please check the updated calendar and come prepared.\n\nThanks,\nRamsey",
      status: "ready",
    },
  ];

  for (const seed of seeds) {
    await addDoc(collection(db, "communicationDrafts"), {
      ...seed,
      createdAt: serverTimestamp(),
    });
  }

  return seeds.length;
}

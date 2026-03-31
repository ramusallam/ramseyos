import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { toDate } from "./shared";
import { logCreated, logActivity } from "./activity-log";

export type DraftStatus = "draft" | "ready" | "sent" | "failed";
export type GmailHandoffStatus = "not_prepared" | "ready_for_gmail" | "handed_off";

export interface DraftItem {
  id: string;
  templateId: string;
  groupId: string;
  subject: string;
  body: string;
  status: DraftStatus;
  gmailStatus: GmailHandoffStatus;
  createdAt: Date | null;
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
    gmailStatus: d.data().gmailStatus ?? "not_prepared",
    createdAt: toDate(d.data().createdAt),
  }));
}

export async function createDraft(fields: {
  subject: string;
  body?: string;
}): Promise<string> {
  try {
    const ref = await addDoc(collection(db, "communicationDrafts"), {
      templateId: "",
      groupId: "",
      subject: fields.subject,
      body: fields.body ?? "",
      status: "draft" as DraftStatus,
      gmailStatus: "not_prepared" as GmailHandoffStatus,
      createdAt: serverTimestamp(),
    });
    logCreated("draft", ref.id, fields.subject, { href: "/communications" });
    return ref.id;
  } catch (err) {
    console.error("[createDraft]", err);
    throw err;
  }
}

export async function updateDraftGmailStatus(
  id: string,
  gmailStatus: GmailHandoffStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, "communicationDrafts", id), { gmailStatus });
  } catch (err) {
    console.error("[updateDraftGmailStatus]", err);
    throw err;
  }
}

export async function updateDraft(
  id: string,
  fields: Partial<Pick<DraftItem, "subject" | "body" | "status" | "templateId" | "groupId">>
): Promise<void> {
  try {
    await updateDoc(doc(db, "communicationDrafts", id), fields);
    if (fields.status === "sent") {
      logActivity({ action: "sent", objectType: "draft", objectId: id, label: fields.subject ?? "Draft", href: "/communications" });
    } else if (fields.status === "ready") {
      logActivity({ action: "status_changed", objectType: "draft", objectId: id, label: fields.subject ?? "Draft", detail: "Marked ready", href: "/communications" });
    }
  } catch (err) {
    console.error("[updateDraft]", err);
    throw err;
  }
}

export async function createDraftFromTemplate(fields: {
  templateId: string;
  groupId: string;
  subject: string;
  body: string;
}): Promise<string> {
  try {
    const ref = await addDoc(collection(db, "communicationDrafts"), {
      templateId: fields.templateId,
      groupId: fields.groupId,
      subject: fields.subject,
      body: fields.body,
      status: "draft" as DraftStatus,
      gmailStatus: "not_prepared" as GmailHandoffStatus,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("[createDraftFromTemplate]", err);
    throw err;
  }
}

export async function deleteDraft(id: string): Promise<void> {
  try {
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "communicationDrafts", id));
  } catch (err) {
    console.error("[deleteDraft]", err);
    throw err;
  }
}

export async function seedDrafts(): Promise<number> {
  const existing = await getDocs(collection(db, "communicationDrafts"));
  if (existing.size > 0) return 0;

  const templateSnap = await getDocs(
    query(collection(db, "templates"), where("active", "==", true))
  );
  const templatesByTitle = new Map<string, string>();
  for (const d of templateSnap.docs) {
    templatesByTitle.set(d.data().title, d.id);
  }

  const groupSnap = await getDocs(
    query(collection(db, "groups"), where("active", "==", true))
  );
  const groupsByName = new Map<string, string>();
  for (const d of groupSnap.docs) {
    groupsByName.set(d.data().name, d.id);
  }

  const seeds: Omit<DraftItem, "id" | "createdAt">[] = [
    {
      templateId: templatesByTitle.get("Parent Update") ?? "",
      groupId: groupsByName.get("Parents — AP Chem") ?? "",
      subject: "Quick update from class",
      body: "Dear families,\n\nI wanted to share a quick update on what we've been working on in class this week. Students have been engaged in hands-on inquiry and I'm excited about the progress I'm seeing.\n\nPlease don't hesitate to reach out if you have any questions.\n\nBest,\nRamsey",
      status: "ready",
      gmailStatus: "not_prepared",
    },
    {
      templateId: templatesByTitle.get("Class Reminder") ?? "",
      groupId: groupsByName.get("AP Chemistry") ?? "",
      subject: "Upcoming lab schedule change",
      body: "Hi everyone,\n\nJust a heads-up that our lab schedule will shift next week due to the assembly. Please check the updated calendar and come prepared.\n\nThanks,\nRamsey",
      status: "draft",
      gmailStatus: "not_prepared",
    },
    {
      templateId: "",
      groupId: "",
      subject: "Quick note",
      body: "Just wanted to follow up on our conversation.",
      status: "draft",
      gmailStatus: "not_prepared",
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

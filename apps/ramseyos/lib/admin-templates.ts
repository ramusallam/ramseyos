import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface AdminTemplate {
  id: string;
  title: string;
  category: string;
  body: string;
  active: boolean;
  createdAt: Date | null;
}

export type AdminTemplateCategory =
  | "follow-up"
  | "tracking"
  | "reminder"
  | "operations";

export async function getActiveAdminTemplates(): Promise<AdminTemplate[]> {
  const q = query(
    collection(db, "adminTemplates"),
    where("active", "==", true),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    category: d.data().category,
    body: d.data().body,
    active: d.data().active,
    createdAt: d.data().createdAt?.toDate() ?? null,
  }));
}

export async function seedAdminTemplates(): Promise<number> {
  const existing = await getDocs(collection(db, "adminTemplates"));
  if (existing.size > 0) return 0;

  const seeds = [
    {
      title: "Recommendation Letter Follow-Up",
      category: "follow-up",
      body: "Check in on pending recommendation letter requests. Confirm deadlines, gather student brag sheets, and prioritize by due date. Flag any that are within 7 days of deadline.",
    },
    {
      title: "Purchasing Follow-Up",
      category: "follow-up",
      body: "Review open purchase orders and pending reimbursements. Confirm receipt of delivered items, follow up on delayed orders, and submit any outstanding receipts to the business office.",
    },
    {
      title: "Parent Communication Reminder",
      category: "reminder",
      body: "Send scheduled parent communications — progress updates, event reminders, or follow-ups from recent conversations. Check for any unanswered parent emails that need a response.",
    },
    {
      title: "Materials Inventory Check",
      category: "operations",
      body: "Walk through lab and classroom to check consumable supply levels. Note any items running low, cross-reference with upcoming labs, and add restock items to the purchasing queue.",
    },
  ];

  for (const seed of seeds) {
    await addDoc(collection(db, "adminTemplates"), {
      ...seed,
      active: true,
      createdAt: serverTimestamp(),
    });
  }

  return seeds.length;
}

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

/* ── Admin Templates (reference patterns) ── */

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

/* ── Admin Items (operational instances with status) ── */

export type AdminItemStatus = "pending" | "in_progress" | "done";

export interface AdminItem {
  id: string;
  title: string;
  category: string;
  body: string;
  status: AdminItemStatus;
  recurring: boolean;
  active: boolean;
  createdAt: Date | null;
}

export async function getActiveAdminItems(): Promise<AdminItem[]> {
  const q = query(
    collection(db, "adminItems"),
    where("active", "==", true),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    category: d.data().category,
    body: d.data().body,
    status: d.data().status ?? "pending",
    recurring: d.data().recurring ?? false,
    active: d.data().active,
    createdAt: d.data().createdAt?.toDate() ?? null,
  }));
}

export async function updateAdminItemStatus(
  id: string,
  status: AdminItemStatus
): Promise<void> {
  await updateDoc(doc(db, "adminItems", id), { status });
}

export async function seedAdminItems(): Promise<number> {
  const existing = await getDocs(collection(db, "adminItems"));
  if (existing.size > 0) return 0;

  const seeds: {
    title: string;
    category: string;
    body: string;
    status: AdminItemStatus;
    recurring: boolean;
  }[] = [
    {
      title: "Recommendation letters — spring deadline batch",
      category: "follow-up",
      body: "Three letters due by April 1. Two brag sheets received, one still pending from the student. Draft first two letters and send reminder for the third.",
      status: "in_progress",
      recurring: false,
    },
    {
      title: "Lab supply restock — Q3",
      category: "operations",
      body: "Sodium hydroxide, pH paper, and splash goggles are running low. Submit PO to Flinn Scientific and check delivery timeline against upcoming titration lab.",
      status: "pending",
      recurring: false,
    },
    {
      title: "Weekly parent email check",
      category: "reminder",
      body: "Scan inbox for unanswered parent emails from the past week. Respond to any that are older than 48 hours. Flag any that need a meeting follow-up.",
      status: "pending",
      recurring: true,
    },
    {
      title: "Monthly purchasing reconciliation",
      category: "follow-up",
      body: "Review all open POs and reimbursement requests. Confirm received items, close completed orders, and follow up on anything delayed past 14 days.",
      status: "pending",
      recurring: true,
    },
    {
      title: "Semester materials inventory",
      category: "operations",
      body: "Full walkthrough of lab and classroom consumables. Update the inventory spreadsheet, flag items below threshold, and queue restock orders for next semester.",
      status: "pending",
      recurring: true,
    },
    {
      title: "Textbook return reminder — seniors",
      category: "reminder",
      body: "Send reminder to graduating seniors about textbook and lab manual returns. Coordinate with the library on collection dates.",
      status: "done",
      recurring: false,
    },
  ];

  for (const seed of seeds) {
    await addDoc(collection(db, "adminItems"), {
      ...seed,
      active: true,
      createdAt: serverTimestamp(),
    });
  }

  return seeds.length;
}

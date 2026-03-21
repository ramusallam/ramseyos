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

export type LifeItemCategory = "family" | "home" | "reminder" | "life-admin";
export type LifeItemStatus = "pending" | "in_progress" | "done";

export interface LifeItem {
  id: string;
  title: string;
  category: LifeItemCategory | string;
  body: string;
  status: LifeItemStatus;
  recurring: boolean;
  active: boolean;
  createdAt: Date | null;
}

export async function getActiveLifeItems(): Promise<LifeItem[]> {
  const q = query(
    collection(db, "lifeItems"),
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

export async function updateLifeItemStatus(
  id: string,
  status: LifeItemStatus
): Promise<void> {
  await updateDoc(doc(db, "lifeItems", id), { status });
}

export async function seedLifeItems(): Promise<number> {
  const existing = await getDocs(collection(db, "lifeItems"));
  if (existing.size > 0) return 0;

  const seeds: {
    title: string;
    category: LifeItemCategory;
    body: string;
    status: LifeItemStatus;
    recurring: boolean;
  }[] = [
    {
      title: "Family calendar check",
      category: "family",
      body: "Review the family calendar for the week ahead. Confirm any shared events, kid activities, or appointments. Flag conflicts with work schedule early.",
      status: "pending",
      recurring: true,
    },
    {
      title: "Home supply reminder",
      category: "home",
      body: "Check household essentials — kitchen, bathroom, cleaning supplies. Add anything running low to the shopping list before the weekend run.",
      status: "pending",
      recurring: true,
    },
    {
      title: "Follow up on personal errand",
      category: "life-admin",
      body: "Follow up on the pending errand from earlier this week. Confirm appointment, check on delivery status, or close the loop on the open item.",
      status: "in_progress",
      recurring: false,
    },
    {
      title: "Review family plan for the week",
      category: "family",
      body: "Sit down and align on the week ahead — meals, logistics, pickups, and any special plans. Make sure nothing falls through the cracks.",
      status: "pending",
      recurring: true,
    },
    {
      title: "Schedule annual checkup",
      category: "reminder",
      body: "Call to schedule the annual physical. Check if any lab work needs to be done beforehand and block time on the calendar.",
      status: "pending",
      recurring: false,
    },
    {
      title: "Review subscriptions and bills",
      category: "life-admin",
      body: "Quick scan of active subscriptions and upcoming bills. Cancel anything unused, confirm auto-pays are set correctly, and note any price changes.",
      status: "done",
      recurring: false,
    },
  ];

  for (const seed of seeds) {
    await addDoc(collection(db, "lifeItems"), {
      ...seed,
      active: true,
      createdAt: serverTimestamp(),
    });
  }

  return seeds.length;
}

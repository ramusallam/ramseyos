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

export interface VendorItem {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  active: boolean;
}

export async function getActiveVendors(): Promise<VendorItem[]> {
  const q = query(
    collection(db, "vendors"),
    where("active", "==", true),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    description: d.data().description,
    category: d.data().category,
    url: d.data().url,
    active: d.data().active,
  }));
}

export async function seedVendors(): Promise<number> {
  const existing = await getDocs(collection(db, "vendors"));
  if (existing.size > 0) return 0;

  const seeds = [
    {
      name: "Amazon",
      description: "General lab supplies, equipment, and classroom materials.",
      category: "general",
      url: "https://www.amazon.com",
    },
    {
      name: "Flinn Scientific",
      description: "Science education chemicals, equipment, and safety supplies.",
      category: "science",
      url: "https://www.flinnsci.com",
    },
    {
      name: "Carolina Biological",
      description: "Living organisms, prepared slides, and biology lab supplies.",
      category: "science",
      url: "https://www.carolina.com",
    },
    {
      name: "Home Science Tools",
      description: "Hands-on science kits, supplies, and curriculum materials.",
      category: "science",
      url: "https://www.homesciencetools.com",
    },
  ];

  for (const seed of seeds) {
    await addDoc(collection(db, "vendors"), {
      ...seed,
      active: true,
      createdAt: serverTimestamp(),
    });
  }

  return seeds.length;
}

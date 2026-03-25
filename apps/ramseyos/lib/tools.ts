import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/** Where a tool can run. "web" = browser only, "desktop" = requires wrapper, "any" = both. */
export type ToolEnvironment = "web" | "desktop" | "any";

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  active: boolean;
  pinned: boolean;
  environment: ToolEnvironment;
}

export async function getActiveTools(): Promise<ToolItem[]> {
  const q = query(
    collection(db, "tools"),
    where("active", "==", true),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    description: d.data().description,
    category: d.data().category,
    url: d.data().url,
    active: d.data().active,
    pinned: d.data().pinned ?? false,
    environment: (d.data().environment as ToolEnvironment) ?? "web",
  }));
}

export async function toggleToolPinned(id: string, current: boolean): Promise<void> {
  await updateDoc(doc(db, "tools", id), { pinned: !current });
}

export async function seedTools(): Promise<number> {
  const existing = await getDocs(collection(db, "tools"));
  if (existing.size > 0) return 0;

  const seeds = [
    {
      title: "Spark Learning Inquiry Studio",
      description: "AI-powered inquiry lesson builder for science educators.",
      category: "teaching",
      url: "https://sparklearningstudio.ai",
      environment: "web",
    },
    {
      title: "Cycles of Learning Blog",
      description: "Research-backed writing on teaching, learning, and inquiry.",
      category: "publishing",
      url: "https://cyclesoflearning.com",
      environment: "web",
    },
    {
      title: "Xbox Adaptive Controller Emulator",
      description: "Accessibility controller emulator for inclusive classroom use.",
      category: "accessibility",
      url: "#",
      environment: "desktop",
    },
    {
      title: "Chemistry Simulation",
      description: "Interactive molecular and reaction simulations for students.",
      category: "simulation",
      url: "#",
      environment: "desktop",
    },
    {
      title: "Classroom Timer",
      description: "Minimal timer and pacing tool for class activities.",
      category: "classroom",
      url: "#",
      environment: "any",
    },
  ];

  for (const seed of seeds) {
    await addDoc(collection(db, "tools"), {
      ...seed,
      active: true,
      pinned: false,
      createdAt: serverTimestamp(),
    });
  }

  return seeds.length;
}

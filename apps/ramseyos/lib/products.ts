/**
 * Product / app inventory for RamseyOS.
 *
 * Tracks the products and apps Ramsey builds, maintains, or operates.
 * Each product is a lightweight record — not a full project management entity.
 */

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
import { toDate } from "./shared";

export type ProductStatus = "active" | "maintenance" | "paused" | "archived";
export type ProductCategory = "app" | "site" | "tool" | "content";

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  status: ProductStatus;
  url: string | null;
  /** Optional repo URL for development context. */
  repoUrl: string | null;
  /** Short note on current focus or next milestone. */
  currentFocus: string | null;
  active: boolean;
  createdAt: Date | null;
}

export async function getActiveProducts(): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("active", "==", true),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    description: d.data().description,
    category: (d.data().category as ProductCategory) ?? "app",
    status: (d.data().status as ProductStatus) ?? "active",
    url: d.data().url ?? null,
    repoUrl: d.data().repoUrl ?? null,
    currentFocus: d.data().currentFocus ?? null,
    active: true,
    createdAt: toDate(d.data().createdAt),
  }));
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "products", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function seedProducts(): Promise<number> {
  const existing = await getDocs(collection(db, "products"));
  if (existing.size > 0) return 0;

  const seeds: Omit<Product, "id" | "createdAt">[] = [
    {
      name: "Spark Learning Inquiry Studio",
      description:
        "AI-powered guided instructional design studio for science educators. Core product.",
      category: "app",
      status: "active",
      url: "https://sparklearningstudio.ai",
      repoUrl: "https://github.com/ramusallam/spark-learning-inquiry-studio",
      currentFocus: "Alpha refinement — practice/assessment goals, PDF export",
      active: true,
    },
    {
      name: "RamseyOS",
      description:
        "Personal AI operating system for professional life. Web-first, Firebase-backed.",
      category: "app",
      status: "active",
      url: null,
      repoUrl: null,
      currentFocus: "Build pack progression — workspace + knowledge foundations",
      active: true,
    },
    {
      name: "Cycles of Learning",
      description:
        "Research-backed blog on teaching, learning, and inquiry pedagogy.",
      category: "content",
      status: "active",
      url: "https://cyclesoflearning.com",
      repoUrl: null,
      currentFocus: null,
      active: true,
    },
    {
      name: "Xbox Adaptive Controller Tester",
      description:
        "Accessibility controller tester and endless runner game for inclusive classroom use.",
      category: "tool",
      status: "active",
      url: "https://xbac-tester.vercel.app",
      repoUrl: "https://github.com/ramusallam/xbac-test",
      currentFocus: null,
      active: true,
    },
    {
      name: "Artifact Portfolio",
      description:
        "AI-assisted artifact portfolio app for student reflection and showcase.",
      category: "app",
      status: "active",
      url: null,
      repoUrl: "https://github.com/ramusallam/artifact-portfolio",
      currentFocus: null,
      active: true,
    },
  ];

  for (const seed of seeds) {
    await addDoc(collection(db, "products"), {
      ...seed,
      createdAt: serverTimestamp(),
    });
  }

  return seeds.length;
}

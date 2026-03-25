/**
 * Build context / prompt registry for RamseyOS.
 *
 * Stores development prompts, build instructions, and operational context
 * tied to products. Lightweight first pass — no versioning or editor yet.
 */

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
import { toDate } from "./shared";

export type BuildContextCategory = "prompt" | "build-note" | "architecture" | "runbook";

export interface BuildContext {
  id: string;
  title: string;
  category: BuildContextCategory;
  body: string;
  /** Optional link to the product this context supports. */
  productId: string | null;
  active: boolean;
  createdAt: Date | null;
}

export async function getActiveBuildContexts(): Promise<BuildContext[]> {
  const q = query(
    collection(db, "buildContexts"),
    where("active", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    category: (d.data().category as BuildContextCategory) ?? "build-note",
    body: d.data().body,
    productId: d.data().productId ?? null,
    active: true,
    createdAt: toDate(d.data().createdAt),
  }));
}

export async function getBuildContextsForProduct(
  productId: string
): Promise<BuildContext[]> {
  const q = query(
    collection(db, "buildContexts"),
    where("active", "==", true),
    where("productId", "==", productId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    category: (d.data().category as BuildContextCategory) ?? "build-note",
    body: d.data().body,
    productId: d.data().productId ?? productId,
    active: true,
    createdAt: toDate(d.data().createdAt),
  }));
}

export async function seedBuildContexts(): Promise<number> {
  const existing = await getDocs(collection(db, "buildContexts"));
  if (existing.size > 0) return 0;

  const seeds: Omit<BuildContext, "id" | "createdAt">[] = [
    {
      title: "Spark Learning — Claude Code build prompt",
      category: "prompt",
      body: "You are working on Spark Learning Inquiry Studio, a guided instructional design studio for science educators. Stack: React + TypeScript, Vite, Firebase, Google Gemini AI. Deployed on Vercel at sparklearningstudio.ai. Always commit and push after deploy.",
      productId: null, // Will link once product IDs exist
      active: true,
    },
    {
      title: "RamseyOS — architecture runbook",
      category: "runbook",
      body: "RamseyOS is a Next.js App Router + TypeScript + Firebase + Tailwind app. Build packs are the unit of progress. Config-driven architecture. No premature abstraction. Web-first, desktop-ready. Dark theme with glassmorphic direction.",
      productId: null,
      active: true,
    },
  ];

  for (const seed of seeds) {
    await addDoc(collection(db, "buildContexts"), {
      ...seed,
      createdAt: serverTimestamp(),
    });
  }

  return seeds.length;
}

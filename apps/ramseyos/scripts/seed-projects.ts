/**
 * Seed script for initial RamseyOS projects.
 *
 * Run from the app directory:
 *   npx tsx --env-file=.env.local scripts/seed-projects.ts
 *
 * Uses Node's built-in --env-file flag to load .env.local.
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);

const SEED_PROJECTS = [
  {
    title: "Sonoma Teaching",
    description:
      "All teaching work at Sonoma Academy — lesson planning, grading, course design, and student support.",
    workspaceId: "sonoma",
    color: "indigo",
  },
  {
    title: "Concordia Courses",
    description:
      "Concordia University coursework — discussion boards, rubric feedback, course management.",
    workspaceId: "concordia",
    color: "emerald",
  },
  {
    title: "Spark Learning",
    description:
      "Spark Learning Inquiry Studio development — product, engineering, and launch work.",
    workspaceId: null,
    color: "amber",
  },
  {
    title: "Consulting",
    description:
      "Woven and Cycles of Learning consulting — workshops, keynotes, blog writing, outreach.",
    workspaceId: "woven",
    color: "rose",
  },
  {
    title: "Admin",
    description:
      "Administrative tasks — department leadership, communication, scheduling, and logistics.",
    workspaceId: "sonoma",
    color: null,
  },
];

async function seed() {
  const existing = await getDocs(collection(db, "projects"));
  if (existing.size > 0) {
    console.log(
      `Projects collection already has ${existing.size} documents. Skipping seed.`
    );
    return;
  }

  for (const project of SEED_PROJECTS) {
    const ref = await addDoc(collection(db, "projects"), {
      title: project.title,
      description: project.description,
      status: "active",
      workspaceId: project.workspaceId,
      archived: false,
      color: project.color,
      owner: null,
      tags: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`Created: ${project.title} (${ref.id})`);
  }

  console.log("Seed complete.");
}

seed().catch(console.error);

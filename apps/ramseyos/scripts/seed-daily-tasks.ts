/**
 * Seed script for daily tasks.
 *
 * Run from the app directory:
 *   npx tsx --env-file=.env.local scripts/seed-daily-tasks.ts
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

const DAILY_TASKS = [
  { title: "Review Inbox", order: 1 },
  { title: "Check Calendar", order: 2 },
  { title: "Morning Reflection", order: 3 },
];

async function seed() {
  const existing = await getDocs(collection(db, "dailyTasks"));
  if (existing.size > 0) {
    console.log(
      `dailyTasks already has ${existing.size} documents. Skipping seed.`
    );
    return;
  }

  for (const task of DAILY_TASKS) {
    const ref = await addDoc(collection(db, "dailyTasks"), {
      title: task.title,
      active: true,
      order: task.order,
      createdAt: serverTimestamp(),
    });
    console.log(`Created: ${task.title} (${ref.id})`);
  }

  console.log("Seed complete.");
}

seed().catch(console.error);

/**
 * Test script for the calendar sync pipeline.
 * Writes a test event into calendarEvents, then reads it back to confirm.
 *
 * Run from the app directory:
 *   npx tsx --env-file=.env.local scripts/test-calendar-sync.ts
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
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
const COLLECTION = "calendarEvents";

async function testCalendarSync() {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  // Step 1: Write test event
  console.log("Writing test event to calendarEvents...");
  const ref = await addDoc(collection(db, COLLECTION), {
    title: "RamseyOS Calendar Test Event",
    startTime: now,
    endTime: oneHourLater,
    source: "test",
    googleEventId: "test-event-1",
    lastSyncedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  console.log(`Created: ${ref.id}`);

  // Step 2: Read it back
  console.log("\nReading back from calendarEvents...");
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, COLLECTION),
    where("startTime", ">=", dayStart),
    where("startTime", "<=", dayEnd),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);

  console.log(`Found ${snap.size} event(s) for today:\n`);
  for (const doc of snap.docs) {
    const data = doc.data();
    console.log(`  id: ${doc.id}`);
    console.log(`  title: ${data.title}`);
    console.log(`  source: ${data.source}`);
    console.log(`  googleEventId: ${data.googleEventId}`);
    console.log(`  startTime: ${data.startTime?.toDate?.() ?? data.startTime}`);
    console.log(`  endTime: ${data.endTime?.toDate?.() ?? data.endTime}`);
    console.log();
  }

  const testDoc = snap.docs.find((d) => d.id === ref.id);
  if (testDoc) {
    console.log("Pipeline test PASSED — event written and read back successfully.");
  } else {
    console.error("Pipeline test FAILED — could not read back the test event.");
    process.exit(1);
  }
}

testCalendarSync().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

import { NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Check if today already has events
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await getDocs(
      query(
        collection(db, "calendarEvents"),
        where("startTime", ">=", dayStart),
        where("startTime", "<=", dayEnd)
      )
    );

    if (existing.size > 0) {
      return NextResponse.json({
        success: true,
        message: `Already have ${existing.size} events today — skipped seeding`,
        seeded: 0,
      });
    }

    // Seed realistic schedule events for today
    const today = new Date();
    const seeds = [
      {
        title: "Department Meeting",
        startHour: 8,
        startMin: 0,
        endHour: 8,
        endMin: 45,
      },
      {
        title: "AP Chemistry — Period 2",
        startHour: 9,
        startMin: 0,
        endHour: 10,
        endMin: 15,
      },
      {
        title: "Office Hours",
        startHour: 10,
        startMin: 30,
        endHour: 11,
        endMin: 15,
      },
      {
        title: "Honors Chemistry — Period 4",
        startHour: 11,
        startMin: 30,
        endHour: 12,
        endMin: 45,
      },
      {
        title: "Lunch",
        startHour: 12,
        startMin: 45,
        endHour: 13,
        endMin: 30,
      },
      {
        title: "Curriculum Planning",
        startHour: 14,
        startMin: 0,
        endHour: 15,
        endMin: 0,
      },
    ];

    let seeded = 0;
    for (const seed of seeds) {
      const startTime = new Date(today);
      startTime.setHours(seed.startHour, seed.startMin, 0, 0);
      const endTime = new Date(today);
      endTime.setHours(seed.endHour, seed.endMin, 0, 0);

      await addDoc(collection(db, "calendarEvents"), {
        title: seed.title,
        startTime,
        endTime,
        source: "seed",
        googleEventId: `seed-${seed.title.toLowerCase().replace(/\s+/g, "-")}`,
        lastSyncedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      seeded++;
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${seeded} events for today`,
      seeded,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

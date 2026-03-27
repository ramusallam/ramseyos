/**
 * Spark Learning integration bridge.
 *
 * Exports RamseyOS lesson data into a 5E-mapped format compatible
 * with Spark Learning's inquiry cycle structure.
 *
 * Level 1 (existing): Manual URL link + status enum on LessonPlan
 * Level 2 (this file): Structured 5E export (copy to clipboard / download JSON)
 * Level 3 (future): Live Spark API sync when import endpoint exists
 */

import type { LessonPlan } from "./lesson-plans";

/* ── 5E Export Types ── */

export interface Spark5EExport {
  title: string;
  course: string;
  objective: string;
  engage: string;
  explore: string;
  explain: string;
  elaborate: string;
  evaluate: string;
  keyQuestions: string[];
  materials: { name: string; quantity: string; notes: string }[];
  tags: string[];
  exportedAt: string;
  sourceSystem: "RamseyOS";
}

/* ── Export function ── */

export function lessonToSpark5E(lesson: LessonPlan): Spark5EExport {
  return {
    title: lesson.title,
    course: lesson.course,
    objective: lesson.objective,
    engage: lesson.warmUp,
    explore: lesson.activities,
    explain: lesson.activities, // activities maps to explore+explain+elaborate
    elaborate: lesson.activities,
    evaluate: lesson.assessment,
    keyQuestions: lesson.keyQuestions,
    materials: lesson.materials.map((m) => ({
      name: m.name,
      quantity: m.quantity,
      notes: m.notes,
    })),
    tags: lesson.tags,
    exportedAt: new Date().toISOString(),
    sourceSystem: "RamseyOS",
  };
}

/* ── Clipboard export ── */

export async function copySparkExportToClipboard(
  lesson: LessonPlan
): Promise<void> {
  const data = lessonToSpark5E(lesson);
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
}

/* ── File download ── */

export function downloadSparkExport(lesson: LessonPlan): void {
  const data = lessonToSpark5E(lesson);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spark-${lesson.title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

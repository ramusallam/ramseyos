/**
 * Knowledge layer for RamseyOS.
 *
 * Stores operational knowledge, playbooks, and reference entries that
 * inform how recurring work gets done. Entries can be linked to workflows
 * via tags, making them surfaceable in context.
 *
 * Types:
 *  - playbook: step-by-step guide for a recurring workflow
 *  - reference: factual resource (link, note, policy)
 *  - note: freeform operational knowledge
 */

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
import { toDate } from "./shared";

export type KnowledgeType = "playbook" | "reference" | "note";

export interface KnowledgeEntry {
  id: string;
  title: string;
  body: string;
  type: KnowledgeType;
  /** Tags for linking to workflows, workspaces, or topics. */
  tags: string[];
  /** Optional URL for external references (NotebookLM, Google Docs, etc). */
  url: string | null;
  /** Optional workflow ID this entry supports. */
  workflowId: string | null;
  active: boolean;
  createdAt: Date | null;
}

export async function getActiveKnowledge(): Promise<KnowledgeEntry[]> {
  const q = query(
    collection(db, "knowledge"),
    where("active", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    body: d.data().body,
    type: (d.data().type as KnowledgeType) ?? "note",
    tags: d.data().tags ?? [],
    url: d.data().url ?? null,
    workflowId: d.data().workflowId ?? null,
    active: true,
    createdAt: toDate(d.data().createdAt),
  }));
}

export async function getKnowledgeByTags(
  tags: string[]
): Promise<KnowledgeEntry[]> {
  if (tags.length === 0) return [];
  // Firestore array-contains can only match one value at a time.
  // Fetch by first tag, then filter client-side for any overlap.
  const q = query(
    collection(db, "knowledge"),
    where("active", "==", true),
    where("tags", "array-contains", tags[0]),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  const tagSet = new Set(tags);
  return snap.docs
    .map((d) => ({
      id: d.id,
      title: d.data().title,
      body: d.data().body,
      type: (d.data().type as KnowledgeType) ?? "note",
      tags: d.data().tags ?? [],
      url: d.data().url ?? null,
      workflowId: d.data().workflowId ?? null,
      active: true,
      createdAt: toDate(d.data().createdAt),
    }))
    .filter((entry) => entry.tags.some((t: string) => tagSet.has(t)));
}

export async function getKnowledgeForWorkflow(
  workflowId: string
): Promise<KnowledgeEntry[]> {
  const q = query(
    collection(db, "knowledge"),
    where("active", "==", true),
    where("workflowId", "==", workflowId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    body: d.data().body,
    type: (d.data().type as KnowledgeType) ?? "note",
    tags: d.data().tags ?? [],
    url: d.data().url ?? null,
    workflowId: d.data().workflowId ?? workflowId,
    active: true,
    createdAt: toDate(d.data().createdAt),
  }));
}

export async function createKnowledgeEntry(fields: {
  title: string;
  body: string;
  type: KnowledgeType;
  tags?: string[];
  url?: string;
  workflowId?: string;
}): Promise<string> {
  try {
    const ref = await addDoc(collection(db, "knowledge"), {
      title: fields.title,
      body: fields.body,
      type: fields.type,
      tags: fields.tags || [],
      url: fields.url || null,
      workflowId: fields.workflowId || null,
      active: true,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (err) {
    console.error("[createKnowledgeEntry]", err);
    throw err;
  }
}

export async function updateKnowledgeEntry(
  id: string,
  data: Partial<Omit<KnowledgeEntry, "id" | "createdAt">>
): Promise<void> {
  try {
    await updateDoc(doc(db, "knowledge", id), data);
  } catch (err) {
    console.error("[updateKnowledgeEntry]", err);
    throw err;
  }
}

export async function archiveKnowledgeEntry(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, "knowledge", id), { active: false });
  } catch (err) {
    console.error("[archiveKnowledgeEntry]", err);
    throw err;
  }
}

export async function seedKnowledge(): Promise<number> {
  const existing = await getDocs(collection(db, "knowledge"));
  if (existing.size > 0) return 0;

  const seeds: Omit<KnowledgeEntry, "id" | "createdAt">[] = [
    {
      title: "Lesson plan creation playbook",
      body: "1. Start from learning objective\n2. Choose inquiry hook (demo, question, phenomenon)\n3. Map 5E phases\n4. Attach materials list\n5. Link to Spark for AI augmentation\n6. Add reflection after teaching",
      type: "playbook",
      tags: ["teach", "lesson-planning"],
      url: null,
      workflowId: "new-lesson-plan",
      active: true,
    },
    {
      title: "Communication drafting playbook",
      body: "1. Pick template matching purpose\n2. Select recipient group\n3. Generate draft with personalization\n4. Review tone and accuracy\n5. Prepare for Gmail\n6. Confirm handoff",
      type: "playbook",
      tags: ["ops", "communications"],
      url: null,
      workflowId: "draft-communication",
      active: true,
    },
    {
      title: "Recommendation letter playbook",
      body: "1. Gather student data (grades, activities, interactions)\n2. Choose template tone (academic, personal, professional)\n3. Draft with specific examples\n4. Review for authenticity\n5. Export as PDF or email",
      type: "playbook",
      tags: ["ops", "communications"],
      url: null,
      workflowId: "draft-recommendation",
      active: true,
    },
    {
      title: "Material sourcing playbook",
      body: "1. List materials needed from lesson plan\n2. Check existing inventory\n3. Match to preferred vendors\n4. Create purchase request with notes\n5. Track delivery status",
      type: "playbook",
      tags: ["teach", "materials", "purchasing"],
      url: null,
      workflowId: "material-sourcing",
      active: true,
    },
    {
      title: "5E inquiry model reference",
      body: "Engage → Explore → Explain → Elaborate → Evaluate\n\nCore principle: students construct understanding through experience before formal explanation.",
      type: "reference",
      tags: ["teach", "lesson-planning", "pedagogy"],
      url: null,
      workflowId: null,
      active: true,
    },
    {
      title: "Spark Learning integration notes",
      body: "Spark uses the inquiry cycle as its core structure. When linking a lesson plan, ensure the learning objective matches the Spark module. Status flow: not-started → in-progress → deployed.",
      type: "note",
      tags: ["teach", "lesson-planning", "spark"],
      url: "https://sparklearningstudio.ai",
      workflowId: "new-lesson-plan",
      active: true,
    },
    {
      title: "Rubric grading best practices",
      body: "When grading with a rubric:\n1. Read the full student submission before scoring\n2. Score each criterion independently\n3. Use the rubric levels as anchors, not ceilings\n4. Write specific feedback that references the student's work\n5. Note both strengths and areas for growth\n6. Review your scores holistically before finalizing\n7. Be consistent across students — use the first few as calibration",
      type: "playbook",
      tags: ["teach", "grading"],
      url: null,
      workflowId: "grade-with-rubric",
      active: true,
    },
    {
      title: "Writing effective student feedback",
      body: "Effective feedback is:\n- Specific (reference exact parts of the work)\n- Actionable (tell the student what to do differently)\n- Balanced (acknowledge what works before suggesting changes)\n- Growth-oriented (frame as improvement, not correction)\n- Timely (return as quickly as possible while thoughtful)",
      type: "reference",
      tags: ["teach", "grading"],
      url: null,
      workflowId: null,
      active: true,
    },
  ];

  for (const seed of seeds) {
    await addDoc(collection(db, "knowledge"), {
      ...seed,
      createdAt: serverTimestamp(),
    });
  }

  return seeds.length;
}

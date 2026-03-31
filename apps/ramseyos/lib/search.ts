import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

export interface SearchResult {
  id: string;
  type:
    | "task"
    | "project"
    | "lesson-plan"
    | "material"
    | "tool"
    | "product"
    | "draft"
    | "capture"
    | "recommendation"
    | "knowledge";
  title: string;
  subtitle?: string;
  status?: string;
  href: string;
}

const TYPE_META: Record<SearchResult["type"], { label: string; color: string }> = {
  task: { label: "Task", color: "text-sky-400" },
  project: { label: "Project", color: "text-emerald-400" },
  "lesson-plan": { label: "Lesson Plan", color: "text-violet-400" },
  material: { label: "Material", color: "text-amber-400" },
  tool: { label: "Tool", color: "text-teal-400" },
  product: { label: "Product", color: "text-rose-400" },
  draft: { label: "Draft", color: "text-indigo-400" },
  capture: { label: "Capture", color: "text-white/50" },
  recommendation: { label: "Recommendation", color: "text-orange-400" },
  knowledge: { label: "Knowledge", color: "text-cyan-400" },
};

export function getTypeMeta(type: SearchResult["type"]) {
  return TYPE_META[type];
}

export async function globalSearch(q: string): Promise<SearchResult[]> {
  if (!q || q.length < 2) return [];
  const lower = q.toLowerCase();
  const results: SearchResult[] = [];

  // Search tasks
  try {
    const tasksSnap = await getDocs(collection(db, "tasks"));
    tasksSnap.forEach((doc) => {
      const d = doc.data();
      if ((d.title || "").toLowerCase().includes(lower)) {
        results.push({
          id: doc.id,
          type: "task",
          title: d.title,
          subtitle: d.completed ? "Completed" : d.priority ? `Priority: ${d.priority}` : undefined,
          status: d.completed ? "done" : "active",
          href: "/tasks",
        });
      }
    });
  } catch (e) { console.error("[search] tasks error", e); }

  // Search projects
  try {
    const projSnap = await getDocs(query(collection(db, "projects"), where("archived", "==", false)));
    projSnap.forEach((doc) => {
      const d = doc.data();
      if ((d.title || "").toLowerCase().includes(lower) || (d.description || "").toLowerCase().includes(lower)) {
        results.push({
          id: doc.id,
          type: "project",
          title: d.title,
          subtitle: d.description?.slice(0, 80),
          status: d.status,
          href: `/projects/${doc.id}`,
        });
      }
    });
  } catch (e) { console.error("[search] projects error", e); }

  // Search lesson plans
  try {
    const lpSnap = await getDocs(collection(db, "lessonPlans"));
    lpSnap.forEach((doc) => {
      const d = doc.data();
      if (
        (d.title || "").toLowerCase().includes(lower) ||
        (d.course || "").toLowerCase().includes(lower) ||
        (d.objective || "").toLowerCase().includes(lower)
      ) {
        results.push({
          id: doc.id,
          type: "lesson-plan",
          title: d.title,
          subtitle: d.course,
          status: d.status,
          href: `/lesson-plans/${doc.id}`,
        });
      }
    });
  } catch (e) { console.error("[search] lesson plans error", e); }

  // Search tools
  try {
    const toolsSnap = await getDocs(query(collection(db, "tools"), where("active", "==", true)));
    toolsSnap.forEach((doc) => {
      const d = doc.data();
      if ((d.title || "").toLowerCase().includes(lower) || (d.description || "").toLowerCase().includes(lower)) {
        results.push({
          id: doc.id,
          type: "tool",
          title: d.title,
          subtitle: d.category,
          href: "/tools",
        });
      }
    });
  } catch (e) { console.error("[search] tools error", e); }

  // Search products
  try {
    const prodSnap = await getDocs(query(collection(db, "products"), where("active", "==", true)));
    prodSnap.forEach((doc) => {
      const d = doc.data();
      if ((d.name || "").toLowerCase().includes(lower) || (d.description || "").toLowerCase().includes(lower)) {
        results.push({
          id: doc.id,
          type: "product",
          title: d.name,
          subtitle: d.category,
          status: d.status,
          href: "/product-ops",
        });
      }
    });
  } catch (e) { console.error("[search] products error", e); }

  // Search drafts
  try {
    const draftSnap = await getDocs(collection(db, "communicationDrafts"));
    draftSnap.forEach((doc) => {
      const d = doc.data();
      if ((d.subject || "").toLowerCase().includes(lower) || (d.body || "").toLowerCase().includes(lower)) {
        results.push({
          id: doc.id,
          type: "draft",
          title: d.subject || "Untitled Draft",
          subtitle: d.status,
          status: d.status,
          href: "/communications",
        });
      }
    });
  } catch (e) { console.error("[search] drafts error", e); }

  // Search captures
  try {
    const capSnap = await getDocs(collection(db, "captures"));
    capSnap.forEach((doc) => {
      const d = doc.data();
      if ((d.text || "").toLowerCase().includes(lower)) {
        results.push({
          id: doc.id,
          type: "capture",
          title: d.text?.slice(0, 80) || "Capture",
          subtitle: d.processed ? "Processed" : "Unprocessed",
          status: d.processed ? "processed" : "new",
          href: "/inbox",
        });
      }
    });
  } catch (e) { console.error("[search] captures error", e); }

  // Search recommendations
  try {
    const recSnap = await getDocs(collection(db, "recommendations"));
    recSnap.forEach((doc) => {
      const d = doc.data();
      if (
        (d.studentName || "").toLowerCase().includes(lower) ||
        (d.institution || "").toLowerCase().includes(lower)
      ) {
        results.push({
          id: doc.id,
          type: "recommendation",
          title: d.studentName || "Untitled Rec",
          subtitle: d.institution,
          status: d.status,
          href: `/recommendations/${doc.id}`,
        });
      }
    });
  } catch (e) { console.error("[search] recommendations error", e); }

  // Search knowledge (includes playbooks)
  try {
    const knSnap = await getDocs(collection(db, "knowledge"));
    knSnap.forEach((doc) => {
      const d = doc.data();
      if (
        (d.title || "").toLowerCase().includes(lower) ||
        (d.body || "").toLowerCase().includes(lower) ||
        ((d.tags as string[]) || []).some((t: string) => t.toLowerCase().includes(lower))
      ) {
        results.push({
          id: doc.id,
          type: "knowledge",
          title: d.title || "Untitled",
          subtitle: d.type === "playbook" ? "Playbook" : d.type,
          status: d.archived ? "archived" : "active",
          href: d.type === "playbook" ? "/playbooks" : "/knowledge",
        });
      }
    });
  } catch (e) { console.error("[search] knowledge error", e); }

  return results;
}

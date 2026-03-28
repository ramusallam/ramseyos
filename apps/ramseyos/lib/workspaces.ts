import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

export interface Workspace {
  id: string;
  name: string;
  shortName: string;
  domain: "school" | "consulting";
  color: string;
  accent: string;
  description: string;
}

export const WORKSPACES: Workspace[] = [
  {
    id: "sonoma",
    name: "Sonoma Academy",
    shortName: "Sonoma",
    domain: "school",
    color: "bg-emerald-500/10",
    accent: "text-emerald-400",
    description: "Teaching, lesson planning, grading, and school operations",
  },
  {
    id: "concordia",
    name: "Concordia University Irvine",
    shortName: "Concordia",
    domain: "school",
    color: "bg-sky-500/10",
    accent: "text-sky-400",
    description: "Graduate course instruction and curriculum design",
  },
  {
    id: "woven",
    name: "Woven",
    shortName: "Woven",
    domain: "consulting",
    color: "bg-violet-500/10",
    accent: "text-violet-400",
    description: "Workshop development, strategy, and consulting",
  },
  {
    id: "cycles",
    name: "Cycles of Learning",
    shortName: "Cycles",
    domain: "consulting",
    color: "bg-amber-500/10",
    accent: "text-amber-400",
    description: "Blog writing, keynotes, and educational outreach",
  },
];

export function getWorkspace(id: string): Workspace | undefined {
  return WORKSPACES.find((w) => w.id === id);
}

export interface WorkspaceData {
  projects: Array<{ id: string; title: string; status: string; color: string | null; taskCount: number }>;
  tasks: Array<{ id: string; title: string; completed: boolean; priority: string | null; projectId: string | null }>;
  lessonPlans: Array<{ id: string; title: string; course: string; status: string }>;
  drafts: Array<{ id: string; subject: string; status: string }>;
  adminItems: Array<{ id: string; title: string; status: string; category: string }>;
  products: Array<{ id: string; name: string; status: string; category: string }>;
}

export async function getWorkspaceData(workspaceId: string): Promise<WorkspaceData> {
  const data: WorkspaceData = {
    projects: [],
    tasks: [],
    lessonPlans: [],
    drafts: [],
    adminItems: [],
    products: [],
  };

  try {
    // Get projects for this workspace
    const projSnap = await getDocs(
      query(collection(db, "projects"), where("workspaceId", "==", workspaceId), where("archived", "==", false))
    );
    const projectIds: string[] = [];
    projSnap.forEach((doc) => {
      const d = doc.data();
      projectIds.push(doc.id);
      data.projects.push({
        id: doc.id,
        title: d.title,
        status: d.status || "active",
        color: d.color || null,
        taskCount: 0,
      });
    });

    // Get tasks for those projects
    if (projectIds.length > 0) {
      const tasksSnap = await getDocs(collection(db, "tasks"));
      tasksSnap.forEach((doc) => {
        const d = doc.data();
        if (projectIds.includes(d.projectId)) {
          data.tasks.push({
            id: doc.id,
            title: d.title,
            completed: d.completed || false,
            priority: d.priority || null,
            projectId: d.projectId,
          });
          // Update project task count
          const proj = data.projects.find((p) => p.id === d.projectId);
          if (proj) proj.taskCount++;
        }
      });
    }

    // Get lesson plans (filter by workspace-associated courses)
    const lpSnap = await getDocs(collection(db, "lessonPlans"));
    lpSnap.forEach((doc) => {
      const d = doc.data();
      if (d.status !== "archived") {
        data.lessonPlans.push({
          id: doc.id,
          title: d.title,
          course: d.course || "",
          status: d.status || "draft",
        });
      }
    });

    // Get drafts
    const draftSnap = await getDocs(collection(db, "communicationDrafts"));
    draftSnap.forEach((doc) => {
      const d = doc.data();
      data.drafts.push({
        id: doc.id,
        subject: d.subject || "Untitled",
        status: d.status || "draft",
      });
    });

    // Get admin items
    const adminSnap = await getDocs(query(collection(db, "adminItems"), where("active", "==", true)));
    adminSnap.forEach((doc) => {
      const d = doc.data();
      data.adminItems.push({
        id: doc.id,
        title: d.title,
        status: d.status || "pending",
        category: d.category || "",
      });
    });

    // Get products
    const prodSnap = await getDocs(query(collection(db, "products"), where("active", "==", true)));
    prodSnap.forEach((doc) => {
      const d = doc.data();
      data.products.push({
        id: doc.id,
        name: d.name,
        status: d.status || "active",
        category: d.category || "",
      });
    });
  } catch (err) {
    console.error("[getWorkspaceData]", err);
  }

  return data;
}

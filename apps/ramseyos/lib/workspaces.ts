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

/** Maps workspace IDs to the course names that belong in that workspace. */
export const WORKSPACE_COURSES: Record<string, string[]> = {
  sonoma: ["Chemistry", "Physics", "AP Chemistry", "Honors Chemistry"],
  concordia: ["EDUT 501", "EDUT 523"],
  woven: [],
  cycles: [],
};

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
  recommendations: Array<{ id: string; studentName: string; institution: string; status: string; dueDate: string | null }>;
  drafts: Array<{ id: string; subject: string; status: string }>;
  adminItems: Array<{ id: string; title: string; status: string; category: string }>;
  products: Array<{ id: string; name: string; status: string; category: string }>;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  projectCount: number;
  openTaskCount: number;
  lessonPlanCount: number;
  pendingRecommendations: number;
}

export async function getWorkspaceData(workspaceId: string): Promise<WorkspaceData> {
  const data: WorkspaceData = {
    projects: [],
    tasks: [],
    lessonPlans: [],
    recommendations: [],
    drafts: [],
    adminItems: [],
    products: [],
  };

  const courses = WORKSPACE_COURSES[workspaceId] ?? [];

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

    // Get lesson plans filtered by workspace-associated courses
    if (courses.length > 0) {
      const lpSnap = await getDocs(collection(db, "lessonPlans"));
      lpSnap.forEach((doc) => {
        const d = doc.data();
        const course = (d.course as string) || "";
        if (d.status !== "archived" && courses.includes(course)) {
          data.lessonPlans.push({
            id: doc.id,
            title: d.title,
            course,
            status: d.status || "draft",
          });
        }
      });
    }

    // Get recommendations for this workspace
    try {
      const recSnap = await getDocs(
        query(collection(db, "recommendations"), where("workspaceId", "==", workspaceId))
      );
      recSnap.forEach((doc) => {
        const d = doc.data();
        data.recommendations.push({
          id: doc.id,
          studentName: d.studentName || "",
          institution: d.institution || "",
          status: d.status || "pending",
          dueDate: d.dueDate || null,
        });
      });
    } catch {
      // Collection may not exist yet — that is fine
    }

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

/** Quick summary counts for a workspace — used by the workspace index page. */
export async function getWorkspaceSummary(workspaceId: string): Promise<WorkspaceSummary> {
  const ws = getWorkspace(workspaceId);
  const summary: WorkspaceSummary = {
    id: workspaceId,
    name: ws?.name ?? workspaceId,
    projectCount: 0,
    openTaskCount: 0,
    lessonPlanCount: 0,
    pendingRecommendations: 0,
  };

  try {
    // Projects
    const projSnap = await getDocs(
      query(collection(db, "projects"), where("workspaceId", "==", workspaceId), where("archived", "==", false))
    );
    summary.projectCount = projSnap.size;

    const projectIds: string[] = [];
    projSnap.forEach((d) => projectIds.push(d.id));

    // Open tasks across those projects
    if (projectIds.length > 0) {
      const tasksSnap = await getDocs(collection(db, "tasks"));
      tasksSnap.forEach((d) => {
        const data = d.data();
        if (projectIds.includes(data.projectId) && !data.completed) {
          summary.openTaskCount++;
        }
      });
    }

    // Lesson plans by course
    const courses = WORKSPACE_COURSES[workspaceId] ?? [];
    if (courses.length > 0) {
      const lpSnap = await getDocs(collection(db, "lessonPlans"));
      lpSnap.forEach((d) => {
        const data = d.data();
        if (data.status !== "archived" && courses.includes((data.course as string) || "")) {
          summary.lessonPlanCount++;
        }
      });
    }

    // Pending recommendations
    try {
      const recSnap = await getDocs(
        query(
          collection(db, "recommendations"),
          where("workspaceId", "==", workspaceId),
          where("status", "==", "pending")
        )
      );
      summary.pendingRecommendations = recSnap.size;
    } catch {
      // Collection may not exist yet
    }
  } catch (err) {
    console.error("[getWorkspaceSummary]", err);
  }

  return summary;
}

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { toDate } from "./shared";

/* ── Types ── */

export interface WeeklyTask {
  id: string;
  title: string;
  completed: boolean;
  priority: string | null;
  projectId: string | null;
  chosenForToday: boolean;
  pinned: boolean;
  createdAt: Date | null;
}

export interface WeeklyProject {
  id: string;
  title: string;
  status: string;
  color: string | null;
  taskCount: number;
}

export interface WeeklyAdminItem {
  id: string;
  title: string;
  category: string;
  status: string;
  recurring: boolean;
}

export interface WeeklyLifeItem {
  id: string;
  title: string;
  category: string;
  status: string;
  frequency: string;
}

export interface WeeklyDraft {
  id: string;
  subject: string;
  status: string;
}

export interface WeeklyLessonPlan {
  id: string;
  title: string;
  course: string;
  sparkStatus: string;
  materialCount: number;
  needToBuyCount: number;
}

export interface WeeklyScheduleDay {
  date: Date;
  label: string;
  events: { id: string; title: string; startTime: Date; endTime: Date }[];
}

export interface WeeklyPlan {
  weekLabel: string;
  weekStart: Date;
  weekEnd: Date;

  // Carry-forward: incomplete tasks that were chosen or high-priority
  carryForward: WeeklyTask[];

  // All open tasks (for the week view)
  openTasks: WeeklyTask[];

  // Active projects with task counts
  activeProjects: WeeklyProject[];

  // Admin items not done
  adminItems: WeeklyAdminItem[];

  // Life items not done
  lifeItems: WeeklyLifeItem[];

  // Drafts in progress
  pendingDrafts: WeeklyDraft[];

  // Lesson plans being worked on
  activeLessons: WeeklyLessonPlan[];

  // Schedule for the week (day-by-day)
  scheduleDays: WeeklyScheduleDay[];

  // Counts for summary
  counts: {
    openTasks: number;
    carryForward: number;
    activeProjects: number;
    adminPending: number;
    lifePending: number;
    pendingDrafts: number;
    activeLessons: number;
    weekEvents: number;
  };
}

/* ── Helpers ── */

function getWeekBounds(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const start = new Date(now);
  start.setDate(now.getDate() - day); // Sunday
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday
  end.setHours(23, 59, 59, 999);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const label = `${fmt(start)} – ${fmt(end)}`;

  return { start, end, label };
}

function getDayLabels(start: Date): { date: Date; label: string }[] {
  const days: { date: Date; label: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      date: d,
      label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    });
  }
  return days;
}

/* ── Main generator ── */

export async function generateWeeklyPlan(): Promise<WeeklyPlan> {
  const { start, end, label } = getWeekBounds();

  const [
    tasks,
    projects,
    adminItems,
    lifeItems,
    drafts,
    lessons,
    events,
  ] = await Promise.all([
    fetchOpenTasks(),
    fetchActiveProjects(),
    fetchActiveAdmin(),
    fetchActiveLife(),
    fetchPendingDrafts(),
    fetchActiveLessons(),
    fetchWeekEvents(start, end),
  ]);

  // Build project task counts
  const projectTaskCounts = new Map<string, number>();
  for (const t of tasks) {
    if (t.projectId) {
      projectTaskCounts.set(t.projectId, (projectTaskCounts.get(t.projectId) ?? 0) + 1);
    }
  }

  const weeklyProjects: WeeklyProject[] = projects.map((p) => ({
    ...p,
    taskCount: projectTaskCounts.get(p.id) ?? 0,
  }));

  // Carry-forward: chosen-for-today OR high-priority OR pinned — these are the important incomplete items
  const carryForward = tasks.filter(
    (t) => t.chosenForToday || t.priority === "high" || t.pinned
  );

  // Build schedule days
  const dayLabels = getDayLabels(start);
  const scheduleDays: WeeklyScheduleDay[] = dayLabels.map(({ date, label: dayLabel }) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayEvents = events.filter((e) => {
      return e.startTime >= dayStart && e.startTime <= dayEnd;
    });

    return { date, label: dayLabel, events: dayEvents };
  });

  const weekEvents = events.length;

  return {
    weekLabel: label,
    weekStart: start,
    weekEnd: end,
    carryForward,
    openTasks: tasks,
    activeProjects: weeklyProjects.filter((p) => p.status === "active"),
    adminItems,
    lifeItems,
    pendingDrafts: drafts,
    activeLessons: lessons,
    scheduleDays,
    counts: {
      openTasks: tasks.length,
      carryForward: carryForward.length,
      activeProjects: weeklyProjects.filter((p) => p.status === "active").length,
      adminPending: adminItems.filter((a) => a.status !== "done").length,
      lifePending: lifeItems.filter((l) => l.status !== "done").length,
      pendingDrafts: drafts.length,
      activeLessons: lessons.length,
      weekEvents,
    },
  };
}

/* ── Fetchers ── */

async function fetchOpenTasks(): Promise<WeeklyTask[]> {
  const q = query(
    collection(db, "tasks"),
    where("completed", "==", false),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    completed: false,
    priority: d.data().priority ?? null,
    projectId: d.data().projectId ?? null,
    chosenForToday: d.data().chosenForToday ?? false,
    pinned: d.data().pinned ?? false,
    createdAt: toDate(d.data().createdAt),
  }));
}

async function fetchActiveProjects(): Promise<
  { id: string; title: string; status: string; color: string | null }[]
> {
  const q = query(
    collection(db, "projects"),
    where("archived", "==", false),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    status: d.data().status ?? "active",
    color: d.data().color ?? null,
  }));
}

async function fetchActiveAdmin(): Promise<WeeklyAdminItem[]> {
  const q = query(
    collection(db, "adminItems"),
    where("active", "==", true),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({
      id: d.id,
      title: d.data().title,
      category: d.data().category ?? "",
      status: d.data().status ?? "pending",
      recurring: d.data().recurring ?? false,
    }))
    .filter((item) => item.status !== "done");
}

async function fetchActiveLife(): Promise<WeeklyLifeItem[]> {
  const q = query(
    collection(db, "lifeItems"),
    where("active", "==", true),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({
      id: d.id,
      title: d.data().title,
      category: d.data().category ?? "",
      status: d.data().status ?? "pending",
      frequency: d.data().frequency ?? "as-needed",
    }))
    .filter((item) => item.status !== "done");
}

async function fetchPendingDrafts(): Promise<WeeklyDraft[]> {
  const q = query(
    collection(db, "communicationDrafts"),
    orderBy("createdAt", "desc"),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({
      id: d.id,
      subject: d.data().subject ?? "",
      status: d.data().status ?? "draft",
    }))
    .filter((d) => d.status === "draft" || d.status === "ready");
}

async function fetchActiveLessons(): Promise<WeeklyLessonPlan[]> {
  const q = query(
    collection(db, "lessonPlans"),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const materials = d.data().materials ?? [];
      return {
        id: d.id,
        title: d.data().title,
        course: d.data().course ?? "",
        sparkStatus: d.data().sparkStatus ?? "not-started",
        materialCount: materials.length,
        needToBuyCount: materials.filter(
          (m: { needToBuy?: boolean }) => m.needToBuy
        ).length,
      };
    })
    .filter(
      (lp) => lp.sparkStatus === "in-progress" || lp.needToBuyCount > 0
    );
}

async function fetchWeekEvents(
  start: Date,
  end: Date
): Promise<{ id: string; title: string; startTime: Date; endTime: Date }[]> {
  const q = query(
    collection(db, "calendarEvents"),
    where("startTime", ">=", start),
    where("startTime", "<=", end),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    startTime: (d.data().startTime as Timestamp).toDate(),
    endTime: (d.data().endTime as Timestamp).toDate(),
  }));
}

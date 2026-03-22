import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

interface DailyAction {
  id: string;
  title: string;
  order: number | null;
}

interface TaskItem {
  id: string;
  title: string;
  priority: string | null;
  projectId: string | null;
  fromInbox: boolean;
}

interface ProjectInfo {
  id: string;
  title: string;
}

interface InboxItem {
  id: string;
  text: string;
  priority: string | null;
}

interface ScheduleItem {
  id: string;
  title: string;
  startTime: Timestamp;
  endTime: Timestamp;
}

export type TimelineItemType = "schedule" | "chosen" | "focus" | "daily-action";

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  title: string;
  startTime?: Timestamp;
  endTime?: Timestamp;
  priority?: string | null;
  projectName?: string | null;
  fromInbox?: boolean;
}

export interface LifeContextItem {
  id: string;
  title: string;
  category: string;
  recurring: boolean;
}

export interface DailyPlan {
  dailyActions: DailyAction[];
  chosenTasks: TaskItem[];
  focusTasks: TaskItem[];
  inboxItems: InboxItem[];
  schedule: ScheduleItem[];
  timeline: TimelineItem[];
  lifeContext: LifeContextItem[];
}

const MAX_FOCUS_TASKS = 5;

export async function generateDailyPlan(): Promise<DailyPlan> {
  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  const [dailyActions, chosenTasks, focusTasks, recentTasks, inboxItems, schedule, projects, lifeContext] =
    await Promise.all([
      fetchDailyActions(),
      fetchChosenTasks(),
      fetchFocusTasks(),
      fetchRecentTasks(),
      fetchInboxItems(),
      fetchSchedule(dayStart, dayEnd),
      fetchProjects(),
      fetchLifeContext(),
    ]);

  const projectMap = new Map<string, string>();
  for (const p of projects) projectMap.set(p.id, p.title);

  // Smart ordering: upcoming schedule first, past events last
  const now = new Date();
  const upcoming = schedule.filter((e) => e.endTime.toDate() >= now);
  const past = schedule.filter((e) => e.endTime.toDate() < now);
  const orderedSchedule = [...upcoming, ...past];

  const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

  // Score-based task ranking across all sources
  // Higher score = higher in the list
  function scoreTask(t: TaskItem, isChosen: boolean): number {
    let s = 0;
    if (isChosen) s += 100;                          // chosen for today
    if (t.priority === "high") s += 40;              // high priority
    else if (t.priority === "medium") s += 20;       // medium priority
    if (t.projectId) s += 10;                        // project-linked
    if (t.fromInbox) s += 5;                         // recently triaged from inbox
    return s;
  }

  // Merge all task sources, deduplicate by id, score and rank
  const seen = new Set<string>();
  const scored: { task: TaskItem; score: number; type: TimelineItemType }[] = [];

  for (const t of chosenTasks) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    scored.push({ task: t, score: scoreTask(t, true), type: "chosen" });
  }
  for (const t of focusTasks) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    scored.push({ task: t, score: scoreTask(t, false), type: "focus" });
  }
  for (const t of recentTasks) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    scored.push({ task: t, score: scoreTask(t, false), type: "focus" });
  }

  // Sort by score descending, then by priority as tiebreaker
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const pa = priorityRank[a.task.priority ?? ""] ?? 3;
    const pb = priorityRank[b.task.priority ?? ""] ?? 3;
    return pa - pb;
  });

  // Cap task items to MAX_FOCUS_TASKS
  const topTasks = scored.slice(0, MAX_FOCUS_TASKS);

  // Sort inbox: prioritized items first
  const orderedInbox = [...inboxItems].sort((a, b) => {
    const pa = priorityRank[a.priority ?? ""] ?? 3;
    const pb = priorityRank[b.priority ?? ""] ?? 3;
    return pa - pb;
  });

  // Build timeline: schedule → scored tasks → daily actions
  const timeline: TimelineItem[] = [
    ...orderedSchedule.map((e) => ({
      id: e.id,
      type: "schedule" as const,
      title: e.title,
      startTime: e.startTime,
      endTime: e.endTime,
    })),
    ...topTasks.map(({ task: t, type }) => ({
      id: t.id,
      type,
      title: t.title,
      priority: t.priority,
      projectName: t.projectId ? projectMap.get(t.projectId) ?? null : null,
      fromInbox: t.fromInbox,
    })),
    ...dailyActions.map((a) => ({
      id: a.id,
      type: "daily-action" as const,
      title: a.title,
    })),
  ];

  // Split for backward compat on the DailyPlan interface
  const orderedChosen = topTasks
    .filter((s) => s.type === "chosen")
    .map((s) => s.task);
  const orderedFocus = topTasks
    .filter((s) => s.type === "focus")
    .map((s) => s.task);

  return {
    dailyActions,
    chosenTasks: orderedChosen,
    focusTasks: orderedFocus,
    inboxItems: orderedInbox,
    schedule: orderedSchedule,
    timeline,
    lifeContext,
  };
}

async function fetchDailyActions(): Promise<DailyAction[]> {
  const q = query(
    collection(db, "dailyTasks"),
    where("active", "==", true),
    orderBy("order", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    order: d.data().order ?? null,
  }));
}

async function fetchChosenTasks(): Promise<TaskItem[]> {
  const q = query(
    collection(db, "tasks"),
    where("completed", "==", false),
    where("chosenForToday", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    priority: d.data().priority ?? null,
    projectId: d.data().projectId ?? null,
    fromInbox: !!d.data().sourceCaptureId,
  }));
}

async function fetchFocusTasks(): Promise<TaskItem[]> {
  const q = query(
    collection(db, "tasks"),
    where("completed", "==", false),
    where("priority", "==", "high"),
    orderBy("createdAt", "desc"),
    limit(5)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    priority: d.data().priority ?? null,
    projectId: d.data().projectId ?? null,
    fromInbox: !!d.data().sourceCaptureId,
  }));
}

async function fetchRecentTasks(): Promise<TaskItem[]> {
  const q = query(
    collection(db, "tasks"),
    where("completed", "==", false),
    orderBy("createdAt", "desc"),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    priority: d.data().priority ?? null,
    projectId: d.data().projectId ?? null,
    fromInbox: !!d.data().sourceCaptureId,
  }));
}

async function fetchProjects(): Promise<ProjectInfo[]> {
  const q = query(
    collection(db, "projects"),
    where("archived", "==", false)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
  }));
}

async function fetchInboxItems(): Promise<InboxItem[]> {
  const q = query(
    collection(db, "captures"),
    where("processed", "==", false),
    orderBy("createdAt", "desc"),
    limit(10)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    text: d.data().text,
    priority: d.data().priority ?? null,
  }));
}

async function fetchSchedule(
  dayStart: Date,
  dayEnd: Date
): Promise<ScheduleItem[]> {
  const q = query(
    collection(db, "calendarEvents"),
    where("startTime", ">=", dayStart),
    where("startTime", "<=", dayEnd),
    orderBy("startTime", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    startTime: d.data().startTime,
    endTime: d.data().endTime,
  }));
}

const MAX_LIFE_CONTEXT = 4;

async function fetchLifeContext(): Promise<LifeContextItem[]> {
  const q = query(
    collection(db, "lifeItems"),
    where("active", "==", true),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => ({
    id: d.id,
    title: d.data().title,
    category: d.data().category ?? "",
    status: d.data().status ?? "pending",
    recurring: d.data().recurring ?? false,
  }));

  // Only surface open items that are recurring or in the reminder category
  const relevant = all.filter(
    (i) => i.status !== "done" && (i.recurring || i.category === "reminder")
  );

  return relevant.slice(0, MAX_LIFE_CONTEXT).map(({ status: _s, ...rest }) => rest);
}

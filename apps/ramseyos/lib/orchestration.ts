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
  source: string;
}

export type TimelineItemType = "schedule" | "chosen" | "focus" | "daily-action";

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  title: string;
  startTime?: Timestamp;
  endTime?: Timestamp;
  priority?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  fromInbox?: boolean;
  source?: string;
}

export interface LifeContextItem {
  id: string;
  title: string;
  category: string;
  recurring: boolean;
}

export type DayMode = "scheduled" | "deep-work" | "life-focus" | "balanced" | "light";

export interface DailyPlan {
  dailyActions: DailyAction[];
  chosenTasks: TaskItem[];
  focusTasks: TaskItem[];
  inboxItems: InboxItem[];
  schedule: ScheduleItem[];
  timeline: TimelineItem[];
  lifeContext: LifeContextItem[];
  dayMode: DayMode;
}

const MAX_FOCUS_TASKS = 5;

export async function generateDailyPlan(): Promise<DailyPlan> {
  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  const [dailyActions, chosenTasks, focusTasks, inboxItems, schedule, projects, lifeContext] =
    await Promise.all([
      fetchDailyActions(),
      fetchChosenTasks(),
      fetchFocusTasks(),
      fetchInboxItems(),
      fetchSchedule(dayStart, dayEnd),
      fetchProjects(),
      fetchLifeContext(),
    ]);

  const projectMap = new Map<string, string>();
  for (const p of projects) projectMap.set(p.id, p.title);

  // Partition schedule by time relevance
  const now = new Date();
  const activeEvents = schedule.filter(
    (e) => e.startTime.toDate() <= now && e.endTime.toDate() > now
  );
  const upcomingEvents = schedule.filter(
    (e) => e.startTime.toDate() > now
  );
  const pastEvents = schedule.filter(
    (e) => e.endTime.toDate() <= now
  );

  // Ordered schedule: active → upcoming → past
  const orderedSchedule = [...activeEvents, ...upcomingEvents, ...pastEvents];

  const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

  // Score-based task ranking
  function scoreTask(t: TaskItem, isChosen: boolean): number {
    let s = 0;
    if (isChosen) s += 100;
    if (t.priority === "high") s += 40;
    else if (t.priority === "medium") s += 20;
    if (t.projectId) s += 10;
    if (t.fromInbox) s += 5;
    return s;
  }

  // Merge chosen + focus tasks, deduplicate by id
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

  // Sort by score descending, then by priority as tiebreaker
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const pa = priorityRank[a.task.priority ?? ""] ?? 3;
    const pb = priorityRank[b.task.priority ?? ""] ?? 3;
    return pa - pb;
  });

  const topTasks = scored.slice(0, MAX_FOCUS_TASKS);

  // Sort inbox: prioritized items first
  const orderedInbox = [...inboxItems].sort((a, b) => {
    const pa = priorityRank[a.priority ?? ""] ?? 3;
    const pb = priorityRank[b.priority ?? ""] ?? 3;
    return pa - pb;
  });

  // Build timeline: active events → upcoming events → tasks → daily actions → past events
  const timeline: TimelineItem[] = [
    ...activeEvents.map((e) => scheduleToTimeline(e)),
    ...upcomingEvents.map((e) => scheduleToTimeline(e)),
    ...topTasks.map(({ task: t, type }) => ({
      id: t.id,
      type,
      title: t.title,
      priority: t.priority,
      projectId: t.projectId ?? null,
      projectName: t.projectId ? projectMap.get(t.projectId) ?? null : null,
      fromInbox: t.fromInbox,
    })),
    ...dailyActions.map((a) => ({
      id: a.id,
      type: "daily-action" as const,
      title: a.title,
    })),
    ...pastEvents.map((e) => scheduleToTimeline(e)),
  ];

  const orderedChosen = topTasks
    .filter((s) => s.type === "chosen")
    .map((s) => s.task);
  const orderedFocus = topTasks
    .filter((s) => s.type === "focus")
    .map((s) => s.task);

  // Day mode uses only forward-looking counts
  const forwardSchedule = activeEvents.length + upcomingEvents.length;
  const dayMode = deriveDayMode(forwardSchedule, topTasks.length, lifeContext.length);

  return {
    dailyActions,
    chosenTasks: orderedChosen,
    focusTasks: orderedFocus,
    inboxItems: orderedInbox,
    schedule: orderedSchedule,
    timeline,
    lifeContext,
    dayMode,
  };
}

function scheduleToTimeline(e: ScheduleItem): TimelineItem {
  return {
    id: e.id,
    type: "schedule" as const,
    title: e.title,
    startTime: e.startTime,
    endTime: e.endTime,
    source: e.source,
  };
}

function deriveDayMode(
  forwardSchedule: number,
  taskCount: number,
  lifeCount: number
): DayMode {
  const total = forwardSchedule + taskCount + lifeCount;

  if (total <= 2) return "light";
  if (forwardSchedule >= 3 && forwardSchedule > taskCount) return "scheduled";
  if (lifeCount > 0 && lifeCount >= taskCount && lifeCount >= forwardSchedule) return "life-focus";
  if (taskCount >= 3 && forwardSchedule <= 1) return "deep-work";
  return "balanced";
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
    source: d.data().source ?? "manual",
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

  const relevant = all.filter(
    (i) => i.status !== "done" && (i.recurring || i.category === "reminder")
  );

  return relevant.slice(0, MAX_LIFE_CONTEXT).map(({ status: _s, ...rest }) => rest);
}

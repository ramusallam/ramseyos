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

export interface DailyPlan {
  dailyActions: DailyAction[];
  chosenTasks: TaskItem[];
  focusTasks: TaskItem[];
  inboxItems: InboxItem[];
  schedule: ScheduleItem[];
}

export async function generateDailyPlan(): Promise<DailyPlan> {
  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  const [dailyActions, chosenTasks, focusTasks, inboxItems, schedule] =
    await Promise.all([
      fetchDailyActions(),
      fetchChosenTasks(),
      fetchFocusTasks(),
      fetchInboxItems(),
      fetchSchedule(dayStart, dayEnd),
    ]);

  // Smart ordering: upcoming schedule first, past events last
  const now = new Date();
  const upcoming = schedule.filter((e) => e.endTime.toDate() >= now);
  const past = schedule.filter((e) => e.endTime.toDate() < now);
  const orderedSchedule = [...upcoming, ...past];

  // Sort chosen tasks: high > medium > low > null
  const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sortByPriority = (a: TaskItem, b: TaskItem) => {
    const pa = priorityRank[a.priority ?? ""] ?? 3;
    const pb = priorityRank[b.priority ?? ""] ?? 3;
    return pa - pb;
  };

  const orderedChosen = [...chosenTasks].sort(sortByPriority);

  // Deduplicate: remove focus tasks that are already in chosen
  const chosenIds = new Set(orderedChosen.map((t) => t.id));
  const dedupedFocus = focusTasks.filter((t) => !chosenIds.has(t.id));

  // Sort inbox: prioritized items first
  const orderedInbox = [...inboxItems].sort((a, b) => {
    const pa = priorityRank[a.priority ?? ""] ?? 3;
    const pb = priorityRank[b.priority ?? ""] ?? 3;
    return pa - pb;
  });

  return {
    dailyActions,
    chosenTasks: orderedChosen,
    focusTasks: dedupedFocus,
    inboxItems: orderedInbox,
    schedule: orderedSchedule,
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

"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getActiveTools, type ToolItem } from "@/lib/tools";
import Link from "next/link";

interface Capture {
  id: string;
  text: string;
  type?: string;
  priority?: string | null;
  processed?: boolean;
  createdAt: Timestamp | null;
}

interface Task {
  id: string;
  title: string;
  priority: string | null;
  projectId: string | null;
  completed: boolean;
}

interface Project {
  id: string;
  title: string;
}

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-rose-50 text-rose-600",
  medium: "bg-amber-50 text-amber-600",
  low: "bg-sky-50 text-sky-600",
};

export function TodayFocus() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      where("completed", "==", false),
      where("priority", "==", "high"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTasks(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[]
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      where("archived", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setProjects(
        snap.docs.map((d) => ({ id: d.id, title: d.data().title }))
      );
    });
    return unsub;
  }, []);

  if (loading) return null;

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted italic">
        No high-priority tasks right now.
      </p>
    );
  }

  const projectMap = new Map<string, string>();
  for (const p of projects) projectMap.set(p.id, p.title);

  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-raised"
        >
          <span className="size-2 shrink-0 rounded-full bg-rose-500" />
          <span className="flex-1 text-[13px] text-foreground/80 truncate">
            {task.title}
          </span>
          {task.projectId && projectMap.get(task.projectId) && (
            <span className="text-[10px] tracking-wider uppercase text-muted/60 shrink-0">
              {projectMap.get(task.projectId)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ChosenForToday() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      where("completed", "==", false),
      where("chosenForToday", "==", true),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTasks(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[]
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      where("archived", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setProjects(
        snap.docs.map((d) => ({ id: d.id, title: d.data().title }))
      );
    });
    return unsub;
  }, []);

  if (loading) return null;

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted italic">
        No tasks chosen for today.
      </p>
    );
  }

  const projectMap = new Map<string, string>();
  for (const p of projects) projectMap.set(p.id, p.title);

  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-raised"
        >
          <span className="size-2 shrink-0 rounded-full bg-accent" />
          <span className="flex-1 text-[13px] text-foreground/80 truncate">
            {task.title}
          </span>
          {task.projectId && projectMap.get(task.projectId) && (
            <span className="text-[10px] tracking-wider uppercase text-muted/60 shrink-0">
              {projectMap.get(task.projectId)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function InboxNeedsReview() {
  const [unprocessed, setUnprocessed] = useState<Capture[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "captures"),
      where("processed", "==", false),
      orderBy("createdAt", "desc"),
      limit(3)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnprocessed(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Capture[]
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "captures"),
      where("processed", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTotalCount(snap.size);
    });
    return unsub;
  }, []);

  if (loading) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Inbox
          {totalCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-accent-dim text-accent text-[10px] font-semibold tabular-nums size-5">
              {totalCount}
            </span>
          )}
        </h2>
        <Link
          href="/inbox"
          className="text-[11px] text-accent hover:text-accent/80 transition-colors font-medium"
        >
          Review &rarr;
        </Link>
      </div>
      {totalCount === 0 ? (
        <p className="text-sm text-muted italic">Inbox clear.</p>
      ) : (
        <ul className="space-y-1">
          {unprocessed.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-raised"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-gray-300" />
              <span className="flex-1 text-[13px] text-foreground/70 truncate">
                {item.text}
              </span>
              {item.priority && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    PRIORITY_STYLE[item.priority] ?? "text-muted"
                  }`}
                >
                  {item.priority}
                </span>
              )}
            </li>
          ))}
          {totalCount > 3 && (
            <li className="px-3 py-1">
              <Link
                href="/inbox"
                className="text-[11px] text-muted hover:text-foreground transition-colors"
              >
                +{totalCount - 3} more
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export function ProjectFocus() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      where("completed", "==", false),
      orderBy("createdAt", "desc"),
      limit(15)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTasks(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[]
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      where("archived", "==", false),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setProjects(
        snap.docs.map((d) => ({ id: d.id, title: d.data().title }))
      );
    });
    return unsub;
  }, []);

  if (loading) return null;

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted italic">No active tasks.</p>
    );
  }

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...tasks].sort((a, b) => {
    const pa = priorityOrder[a.priority ?? ""] ?? 3;
    const pb = priorityOrder[b.priority ?? ""] ?? 3;
    return pa - pb;
  });

  const projectMap = new Map<string, string>();
  for (const p of projects) projectMap.set(p.id, p.title);

  const byProject = new Map<string, Task[]>();
  for (const task of sorted) {
    const key = task.projectId ?? "__unassigned__";
    if (!byProject.has(key)) byProject.set(key, []);
    byProject.get(key)!.push(task);
  }

  const groups: { label: string; tasks: Task[] }[] = [];
  for (const p of projects) {
    const g = byProject.get(p.id);
    if (g) groups.push({ label: p.title, tasks: g });
  }
  const unassigned = byProject.get("__unassigned__");
  if (unassigned) groups.push({ label: "Unassigned", tasks: unassigned });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Project focus
        </h2>
        <Link
          href="/tasks"
          className="text-[11px] text-accent hover:text-accent/80 transition-colors font-medium"
        >
          All tasks &rarr;
        </Link>
      </div>
      <div className="space-y-5">
        {groups.map(({ label, tasks: groupTasks }) => (
          <div key={label}>
            <p className="text-[10px] uppercase tracking-wider text-muted/60 font-medium mb-2">
              {label}
            </p>
            <ul className="space-y-1">
              {groupTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-raised"
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${
                      task.priority === "high"
                        ? "bg-rose-500"
                        : task.priority === "medium"
                          ? "bg-amber-500"
                          : "bg-gray-400"
                    }`}
                  />
                  <span className="flex-1 text-[13px] text-foreground/80 truncate">
                    {task.title}
                  </span>
                  {task.priority && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        PRIORITY_STYLE[task.priority] ?? "text-muted"
                      }`}
                    >
                      {task.priority}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Today's Schedule ── */

interface ScheduleEvent {
  id: string;
  title: string;
  startTime: Timestamp;
  endTime: Timestamp;
  source: string;
}

function formatTime(ts: Timestamp): string {
  return ts.toDate().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TodaySchedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "calendarEvents"),
      where("startTime", ">=", start),
      where("startTime", "<=", end),
      orderBy("startTime", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setEvents(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ScheduleEvent[]
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return null;

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted italic">No schedule items yet.</p>
    );
  }

  return (
    <ul className="space-y-1">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-raised"
        >
          <span className="text-[11px] text-muted tabular-nums shrink-0 w-16">
            {formatTime(event.startTime)}
          </span>
          <span className="flex-1 text-[13px] text-foreground/80 truncate">
            {event.title}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ── Daily Actions ── */

interface DailyTaskItem {
  id: string;
  title: string;
  active: boolean;
  order: number | null;
}

export function DailyActions() {
  const [items, setItems] = useState<DailyTaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "dailyTasks"),
      where("active", "==", true),
      orderBy("order", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DailyTaskItem[]
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return null;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted italic">No daily actions set.</p>
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-raised"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-accent/60" />
          <span className="text-[13px] text-foreground/80">{item.title}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Suggested Tools ── */

const CATEGORY_STYLE: Record<string, string> = {
  teaching: "bg-sky-50 text-sky-600",
  publishing: "bg-violet-50 text-violet-600",
  accessibility: "bg-emerald-50 text-emerald-600",
  simulation: "bg-amber-50 text-amber-600",
  classroom: "bg-rose-50 text-rose-600",
};

const MAX_SUGGESTIONS = 5;

// Stop words to skip when matching project names to tools
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "at", "is",
  "it", "my", "v1", "v2", "app", "project",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_/]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function scoreToolForProjects(tool: ToolItem, projectTokens: string[]): number {
  if (projectTokens.length === 0) return 0;
  const haystack = `${tool.title} ${tool.description} ${tool.category}`.toLowerCase();
  let score = 0;
  for (const token of projectTokens) {
    if (haystack.includes(token)) score++;
  }
  return score;
}

export function SuggestedTools() {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveTools().then((t) => {
      setTools(t);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      where("completed", "==", false),
      where("chosenForToday", "==", true),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[]);
    });
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      where("archived", "==", false)
    );
    return onSnapshot(q, (snap) => {
      setProjects(
        snap.docs.map((d) => ({ id: d.id, title: d.data().title }))
      );
    });
  }, []);

  if (loading) return null;
  if (tools.length === 0) return null;

  // Build project name tokens from today's tasks
  const projectMap = new Map<string, string>();
  for (const p of projects) projectMap.set(p.id, p.title);

  const todayProjectNames = new Set<string>();
  for (const t of tasks) {
    if (t.projectId) {
      const name = projectMap.get(t.projectId);
      if (name) todayProjectNames.add(name);
    }
  }

  const projectTokens = [...todayProjectNames].flatMap(tokenize);

  // Score and rank: pinned always included, then by keyword match
  const scored = tools.map((tool) => ({
    tool,
    score: (tool.pinned ? 100 : 0) + scoreToolForProjects(tool, projectTokens),
  }));

  const suggestions = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS)
    .map((s) => s.tool);

  if (suggestions.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Suggested tools
          </h2>
          <Link
            href="/tools"
            className="text-[11px] text-accent hover:text-accent/80 transition-colors font-medium"
          >
            All tools &rarr;
          </Link>
        </div>
        <p className="text-sm text-muted italic">
          Choose tasks for today to surface relevant tools.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Suggested tools
        </h2>
        <Link
          href="/tools"
          className="text-[11px] text-accent hover:text-accent/80 transition-colors font-medium"
        >
          All tools &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((tool) => {
          const isExternal = tool.url !== "#";
          return (
            <a
              key={tool.id}
              href={tool.url}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="group flex items-start gap-3 rounded-lg border border-border bg-surface-raised/50 px-3.5 py-3 transition-all hover:border-border-strong hover:bg-surface-raised"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground/80 truncate group-hover:text-foreground transition-colors">
                  {tool.title}
                </p>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    CATEGORY_STYLE[tool.category] ?? "bg-gray-50 text-muted"
                  }`}
                >
                  {tool.category}
                </span>
              </div>
              {isExternal && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="text-muted/30 group-hover:text-muted/60 transition-colors shrink-0 mt-1"
                >
                  <path
                    d="M4.5 2H10v5.5M10 2L3 9"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

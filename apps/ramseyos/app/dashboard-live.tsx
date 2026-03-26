"use client";

import { useEffect, useState, useMemo } from "react";
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
import { PRIORITY_STYLE } from "@/lib/shared";
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
  chosenForToday?: boolean;
}

interface Project {
  id: string;
  title: string;
  color: string | null;
}

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
        snap.docs.map((d) => ({ id: d.id, title: d.data().title, color: d.data().color }))
      );
    });
    return unsub;
  }, []);

  if (loading) return null;

  if (tasks.length === 0) {
    return (
      <p className="text-[13px] text-muted/50 italic">
        No high-priority tasks right now.
      </p>
    );
  }

  const projectMap = new Map<string, Project>();
  for (const p of projects) projectMap.set(p.id, p);

  return (
    <ul className="space-y-1.5">
      {tasks.map((task) => {
        const proj = task.projectId ? projectMap.get(task.projectId) : null;
        return (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-xl bg-surface/50 border border-border/50 backdrop-blur-sm px-4 py-3 transition-colors hover:bg-surface-raised/30"
          >
            <span className="size-2 shrink-0 rounded-full bg-rose-500" />
            <span className="flex-1 text-[14px] text-foreground/80 truncate">
              {task.title}
            </span>
            {proj && (
              <Link
                href={`/projects/${proj.id}`}
                className="text-[10px] tracking-wider uppercase text-muted/50 hover:text-accent transition-colors shrink-0"
              >
                {proj.title}
              </Link>
            )}
          </li>
        );
      })}
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
        snap.docs.map((d) => ({ id: d.id, title: d.data().title, color: d.data().color }))
      );
    });
    return unsub;
  }, []);

  if (loading) return null;

  if (tasks.length === 0) {
    return (
      <p className="text-[13px] text-muted/50 italic">
        No tasks chosen for today.
      </p>
    );
  }

  const projectMap = new Map<string, Project>();
  for (const p of projects) projectMap.set(p.id, p);

  return (
    <ul className="space-y-1.5">
      {tasks.map((task) => {
        const proj = task.projectId ? projectMap.get(task.projectId) : null;
        return (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-xl bg-surface/50 border border-border/50 backdrop-blur-sm px-4 py-3 transition-colors hover:bg-surface-raised/30"
          >
            <span className="size-2 shrink-0 rounded-full bg-accent" />
            <span className="flex-1 text-[14px] text-foreground/80 truncate">
              {task.title}
            </span>
            {proj && (
              <Link
                href={`/projects/${proj.id}`}
                className="text-[10px] tracking-wider uppercase text-muted/50 hover:text-accent transition-colors shrink-0"
              >
                {proj.title}
              </Link>
            )}
          </li>
        );
      })}
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
        <p className="text-[13px] text-muted/50 italic">Inbox clear.</p>
      ) : (
        <ul className="space-y-1.5">
          {unprocessed.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl bg-surface/50 border border-border/50 backdrop-blur-sm px-4 py-3 transition-colors hover:bg-surface-raised/30"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-gray-400" />
              <span className="flex-1 text-[14px] text-foreground/70 truncate">
                {item.text}
              </span>
              {item.priority && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                    PRIORITY_STYLE[item.priority] ?? "text-muted"
                  }`}
                >
                  {item.priority}
                </span>
              )}
            </li>
          ))}
          {totalCount > 3 && (
            <li className="px-4 py-1">
              <Link
                href="/inbox"
                className="text-[11px] text-muted/50 hover:text-foreground transition-colors"
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
        snap.docs.map((d) => ({ id: d.id, title: d.data().title, color: d.data().color }))
      );
    });
    return unsub;
  }, []);

  if (loading) return null;

  if (tasks.length === 0) {
    return (
      <p className="text-[13px] text-muted/50 italic">No active tasks.</p>
    );
  }

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...tasks].sort((a, b) => {
    const pa = priorityOrder[a.priority ?? ""] ?? 3;
    const pb = priorityOrder[b.priority ?? ""] ?? 3;
    return pa - pb;
  });

  const projectMap = new Map<string, Project>();
  for (const p of projects) projectMap.set(p.id, p);

  const byProject = new Map<string, Task[]>();
  for (const task of sorted) {
    const key = task.projectId ?? "__unassigned__";
    if (!byProject.has(key)) byProject.set(key, []);
    byProject.get(key)!.push(task);
  }

  const groups: { project: Project | null; tasks: Task[] }[] = [];
  for (const p of projects) {
    const g = byProject.get(p.id);
    if (g) groups.push({ project: p, tasks: g });
  }
  const unassigned = byProject.get("__unassigned__");
  if (unassigned) groups.push({ project: null, tasks: unassigned });

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
        {groups.map(({ project, tasks: groupTasks }) => (
          <div key={project?.id ?? "unassigned"}>
            <div className="flex items-center gap-2 mb-2">
              {project?.color && (
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
              )}
              {project ? (
                <Link
                  href={`/projects/${project.id}`}
                  className="text-[10px] uppercase tracking-wider text-muted/60 font-medium hover:text-accent transition-colors"
                >
                  {project.title}
                </Link>
              ) : (
                <p className="text-[10px] uppercase tracking-wider text-muted/40 font-medium">
                  Unassigned
                </p>
              )}
            </div>
            <ul className="space-y-1.5">
              {groupTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl bg-surface/50 border border-border/50 backdrop-blur-sm px-4 py-3 transition-colors hover:bg-surface-raised/30"
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      task.priority === "high"
                        ? "bg-rose-500"
                        : task.priority === "medium"
                          ? "bg-amber-500"
                          : "bg-gray-400"
                    }`}
                  />
                  <span className="flex-1 text-[14px] text-foreground/80 truncate">
                    {task.title}
                  </span>
                  {task.chosenForToday && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-accent-dim text-accent font-medium shrink-0">
                      today
                    </span>
                  )}
                  {task.priority && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0 ${
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
      <p className="text-[13px] text-muted/50 italic">No schedule items yet.</p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex items-center gap-3 rounded-xl bg-surface/50 border border-border/50 backdrop-blur-sm px-4 py-3 transition-colors hover:bg-surface-raised/30"
        >
          <span className="text-[12px] text-muted tabular-nums shrink-0 w-16">
            {formatTime(event.startTime)}
          </span>
          <span className="flex-1 text-[14px] text-foreground/80 truncate">
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
      <p className="text-[13px] text-muted/50 italic">No daily actions set.</p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-xl bg-surface/50 border border-border/50 backdrop-blur-sm px-4 py-3 transition-colors hover:bg-surface-raised/30"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-accent/60" />
          <span className="text-[14px] text-foreground/80">{item.title}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Suggested Tools ── */

const CATEGORY_STYLE: Record<string, string> = {
  teaching: "bg-sky-500/10 text-sky-400",
  publishing: "bg-violet-500/10 text-violet-400",
  accessibility: "bg-emerald-500/10 text-emerald-400",
  simulation: "bg-amber-500/10 text-amber-400",
  classroom: "bg-rose-500/10 text-rose-400",
};

const MAX_SUGGESTIONS = 5;

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
        snap.docs.map((d) => ({ id: d.id, title: d.data().title, color: d.data().color }))
      );
    });
  }, []);

  if (loading) return null;
  if (tools.length === 0) return null;

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
        <p className="text-[13px] text-muted/50 italic">
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
          const isSpark = tool.title === "Spark Learning Inquiry Studio";
          return (
            <a
              key={tool.id}
              href={tool.url}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className={`group block rounded-xl border p-4 transition-all hover:bg-surface-raised/30 ${
                isSpark
                  ? "border-amber-500/20 bg-amber-500/[0.03] hover:border-amber-500/30"
                  : "border-border/50 bg-surface/50 hover:border-border-strong"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    isSpark
                      ? "bg-amber-500/10 text-amber-400"
                      : CATEGORY_STYLE[tool.category] ?? "bg-white/5 text-muted"
                  }`}
                >
                  {isSpark ? "companion" : tool.category}
                </span>
                {isExternal && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-muted/30 group-hover:text-muted/60 transition-colors shrink-0"
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
              </div>
              <h3 className="text-[13px] font-medium text-foreground/90 mb-1 group-hover:text-foreground transition-colors leading-snug">
                {tool.title}
              </h3>
              <p className="text-[12px] text-muted/60 leading-relaxed line-clamp-2">
                {tool.description}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ── Pinned / Active Work ── */

interface PinnedTask {
  id: string;
  title: string;
  priority: string | null;
  projectId: string | null;
}

interface PinnedProject {
  id: string;
  title: string;
  color: string | null;
  status: string;
}

interface PinnedLesson {
  id: string;
  title: string;
  course: string;
}

export function PinnedItems() {
  const [tasks, setTasks] = useState<PinnedTask[]>([]);
  const [projects, setProjects] = useState<PinnedProject[]>([]);
  const [lessons, setLessons] = useState<PinnedLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    let loaded = 0;
    const checkDone = () => {
      loaded++;
      if (loaded >= 3) setLoading(false);
    };

    const taskQ = query(
      collection(db, "tasks"),
      where("completed", "==", false),
      where("pinned", "==", true)
    );
    unsubs.push(
      onSnapshot(
        taskQ,
        (snap) => {
          setTasks(
            snap.docs.map((d) => ({
              id: d.id,
              title: d.data().title ?? "Untitled",
              priority: d.data().priority ?? null,
              projectId: d.data().projectId ?? null,
            }))
          );
          checkDone();
        },
        () => checkDone()
      )
    );

    const projQ = query(
      collection(db, "projects"),
      where("archived", "==", false),
      where("pinned", "==", true)
    );
    unsubs.push(
      onSnapshot(
        projQ,
        (snap) => {
          setProjects(
            snap.docs.map((d) => ({
              id: d.id,
              title: d.data().title ?? "Untitled",
              color: d.data().color ?? null,
              status: d.data().status ?? "active",
            }))
          );
          checkDone();
        },
        () => checkDone()
      )
    );

    const lessonQ = query(
      collection(db, "lessonPlans"),
      where("pinned", "==", true)
    );
    unsubs.push(
      onSnapshot(
        lessonQ,
        (snap) => {
          setLessons(
            snap.docs.map((d) => ({
              id: d.id,
              title: d.data().title ?? "Untitled",
              course: d.data().course ?? "",
            }))
          );
          checkDone();
        },
        () => checkDone()
      )
    );

    return () => unsubs.forEach((fn) => fn());
  }, []);

  const total = tasks.length + projects.length + lessons.length;

  if (loading || total === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-accent/60">
          <path d="M9.5 2.5L13.5 6.5 7 13H3V9L9.5 2.5z" />
        </svg>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">
          Active Work
        </h2>
        <span className="text-[10px] text-muted/40 tabular-nums">{total}</span>
      </div>

      <div className="space-y-1.5">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-foreground/70 hover:bg-surface-raised hover:text-foreground transition-colors group"
          >
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: p.color ?? "#f59e0b" }}
            />
            <span className="flex-1 truncate">{p.title}</span>
            <span className="text-[9px] text-muted/30">project</span>
          </Link>
        ))}

        {tasks.map((t) => (
          <Link
            key={t.id}
            href={t.projectId ? `/projects/${t.projectId}` : "/tasks"}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-foreground/70 hover:bg-surface-raised hover:text-foreground transition-colors group"
          >
            <span className="size-2 rounded-full shrink-0 bg-accent" />
            <span className="flex-1 truncate">{t.title}</span>
            {t.priority && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${PRIORITY_STYLE[t.priority] ?? ""}`}>
                {t.priority}
              </span>
            )}
          </Link>
        ))}

        {lessons.map((l) => (
          <Link
            key={l.id}
            href={`/lesson-plans/${l.id}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-foreground/70 hover:bg-surface-raised hover:text-foreground transition-colors group"
          >
            <span className="size-2 rounded-full shrink-0 bg-violet-400" />
            <span className="flex-1 truncate">{l.title}</span>
            {l.course && (
              <span className="text-[9px] text-muted/30 truncate max-w-[80px]">{l.course}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

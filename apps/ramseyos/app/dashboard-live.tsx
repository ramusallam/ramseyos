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
  high: "bg-rose-500/15 text-rose-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-blue-500/15 text-blue-400",
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
      <p className="text-sm text-muted/50 italic">
        No high-priority tasks right now.
      </p>
    );
  }

  const projectMap = new Map<string, string>();
  for (const p of projects) projectMap.set(p.id, p.title);

  return (
    <ul className="space-y-px">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center gap-3 rounded px-2.5 py-2 -mx-2.5 transition-colors hover:bg-surface"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-rose-400/60" />
          <span className="flex-1 text-[13px] text-zinc-300 truncate">
            {task.title}
          </span>
          {task.projectId && projectMap.get(task.projectId) && (
            <span className="text-[9px] tracking-wider uppercase text-muted/40 shrink-0">
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
        <h2 className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted/70">
          Inbox
          {totalCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-accent-dim text-accent text-[9px] font-medium tabular-nums size-4">
              {totalCount}
            </span>
          )}
        </h2>
        <Link
          href="/inbox"
          className="text-[10px] text-muted/50 hover:text-zinc-400 transition-colors"
        >
          Review &rarr;
        </Link>
      </div>
      {totalCount === 0 ? (
        <p className="text-sm text-muted/50 italic">Inbox clear.</p>
      ) : (
        <ul className="space-y-px">
          {unprocessed.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded px-2.5 py-2 -mx-2.5 transition-colors hover:bg-surface"
            >
              <span className="size-1 shrink-0 rounded-full bg-zinc-500" />
              <span className="flex-1 text-[13px] text-zinc-300 truncate">
                {item.text}
              </span>
              {item.priority && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded ${
                    PRIORITY_STYLE[item.priority] ?? "text-muted/50"
                  }`}
                >
                  {item.priority}
                </span>
              )}
            </li>
          ))}
          {totalCount > 3 && (
            <li className="px-2.5 py-1">
              <Link
                href="/inbox"
                className="text-[11px] text-muted/50 hover:text-zinc-400 transition-colors"
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
      <p className="text-sm text-muted/50 italic">No active tasks.</p>
    );
  }

  // Sort: high priority first, then medium, then rest
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...tasks].sort((a, b) => {
    const pa = priorityOrder[a.priority ?? ""] ?? 3;
    const pb = priorityOrder[b.priority ?? ""] ?? 3;
    return pa - pb;
  });

  // Group by project
  const projectMap = new Map<string, string>();
  for (const p of projects) projectMap.set(p.id, p.title);

  const byProject = new Map<string, Task[]>();
  for (const task of sorted) {
    const key = task.projectId ?? "__unassigned__";
    if (!byProject.has(key)) byProject.set(key, []);
    byProject.get(key)!.push(task);
  }

  // Ordered: projects first (in project order), unassigned last
  const groups: { label: string; tasks: Task[] }[] = [];
  for (const p of projects) {
    const g = byProject.get(p.id);
    if (g) groups.push({ label: p.title, tasks: g });
  }
  const unassigned = byProject.get("__unassigned__");
  if (unassigned) groups.push({ label: "Unassigned", tasks: unassigned });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[10px] font-medium uppercase tracking-widest text-muted/70">
          Project focus
        </h2>
        <Link
          href="/tasks"
          className="text-[10px] text-muted/50 hover:text-zinc-400 transition-colors"
        >
          All tasks &rarr;
        </Link>
      </div>
      <div className="space-y-4">
        {groups.map(({ label, tasks: groupTasks }) => (
          <div key={label}>
            <p className="text-[9px] uppercase tracking-wider text-muted/50 mb-1.5">
              {label}
            </p>
            <ul className="space-y-px">
              {groupTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded px-2.5 py-1.5 -mx-2.5 transition-colors hover:bg-surface"
                >
                  <span
                    className={`size-1 shrink-0 rounded-full ${
                      task.priority === "high"
                        ? "bg-rose-400/60"
                        : task.priority === "medium"
                          ? "bg-amber-400/60"
                          : "bg-zinc-500"
                    }`}
                  />
                  <span className="flex-1 text-[13px] text-zinc-300 truncate">
                    {task.title}
                  </span>
                  {task.priority && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
                        PRIORITY_STYLE[task.priority] ?? "text-muted/50"
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
      <p className="text-sm text-muted/50 italic">No daily actions set.</p>
    );
  }

  return (
    <ul className="space-y-px">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded px-2.5 py-1.5 -mx-2.5 transition-colors hover:bg-surface"
        >
          <span className="size-1 shrink-0 rounded-full bg-accent/40" />
          <span className="text-[13px] text-zinc-300">{item.title}</span>
        </li>
      ))}
    </ul>
  );
}

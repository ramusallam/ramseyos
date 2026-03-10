"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateTaskProject, toggleChosenForToday } from "@/lib/tasks";
import Link from "next/link";

type Priority = "low" | "medium" | "high" | null;

interface Task {
  id: string;
  title: string;
  createdAt: Timestamp | null;
  completed: boolean;
  priority: Priority;
  projectId: string | null;
  sourceCaptureId: string | null;
  notes: string | null;
  chosenForToday?: boolean;
}

interface Project {
  id: string;
  title: string;
  color: string | null;
}

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-blue-500/15 text-blue-400",
};

async function toggleCompleted(id: string, current: boolean) {
  await updateDoc(doc(db, "tasks", id), { completed: !current });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
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
        snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title,
          color: d.data().color,
        }))
      );
    });
    return unsub;
  }, []);

  const incomplete = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  // Group incomplete tasks by project
  const projectMap = new Map<string, Project>();
  for (const p of projects) projectMap.set(p.id, p);

  const grouped: { project: Project | null; tasks: Task[] }[] = [];
  const byProjectId = new Map<string | null, Task[]>();

  for (const task of incomplete) {
    const key = task.projectId ?? null;
    if (!byProjectId.has(key)) byProjectId.set(key, []);
    byProjectId.get(key)!.push(task);
  }

  // Projects with tasks first (in project order), then unassigned last
  for (const p of projects) {
    const projectTasks = byProjectId.get(p.id);
    if (projectTasks) grouped.push({ project: p, tasks: projectTasks });
  }
  const unassigned = byProjectId.get(null);
  if (unassigned) grouped.push({ project: null, tasks: unassigned });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-xl px-5 pt-12 pb-20">

        {/* Header */}
        <header className="mb-10">
          <Link
            href="/"
            className="text-[11px] tracking-wide text-muted hover:text-zinc-400 transition-colors"
          >
            &larr; Today
          </Link>
          <h1 className="text-xl font-normal text-zinc-100 mt-2">Tasks</h1>
        </header>

        {/* Content */}
        {loading ? (
          <p className="text-sm text-muted/60">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted/60">
            No tasks yet. Convert captures from the{" "}
            <Link href="/inbox" className="text-accent/70 hover:text-accent transition-colors">
              Inbox
            </Link>
            .
          </p>
        ) : (
          <>
            {grouped.map(({ project, tasks: groupTasks }) => (
              <div key={project?.id ?? "unassigned"} className="mb-8">
                <h2 className="text-[10px] font-medium uppercase tracking-widest text-muted/70 mb-3">
                  {project?.title ?? "Unassigned"}
                </h2>
                <ul className="space-y-1">
                  {groupTasks.map((task) => (
                    <TaskItem key={task.id} task={task} projects={projects} />
                  ))}
                </ul>
              </div>
            ))}

            {completed.length > 0 && (
              <div>
                <h2 className="text-[10px] font-medium uppercase tracking-widest text-muted/50 mb-3">
                  Completed
                </h2>
                <ul className="space-y-1">
                  {completed.map((task) => (
                    <TaskItem key={task.id} task={task} projects={projects} />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Task Item ── */

function TaskItem({ task, projects }: { task: Task; projects: Project[] }) {
  return (
    <li
      className={`rounded px-2.5 py-2.5 -mx-2.5 transition-colors hover:bg-surface ${
        task.completed ? "opacity-45" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => toggleCompleted(task.id, task.completed)}
          className={`size-4 shrink-0 rounded border transition-colors ${
            task.completed
              ? "border-accent/40 bg-accent/20"
              : "border-zinc-600 hover:border-zinc-400"
          }`}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed && (
            <svg viewBox="0 0 16 16" className="size-4 text-accent">
              <path
                d="M4.5 8.5L7 11l4.5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <span
          className={`flex-1 text-[13px] truncate ${
            task.completed ? "text-zinc-500 line-through" : "text-zinc-300"
          }`}
        >
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

        {!task.completed && (
          <button
            type="button"
            onClick={() =>
              toggleChosenForToday(task.id, !!task.chosenForToday)
            }
            className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 transition-colors ${
              task.chosenForToday
                ? "bg-accent/15 text-accent"
                : "text-muted/40 hover:text-muted/70"
            }`}
            aria-label={
              task.chosenForToday ? "Remove from today" : "Choose for today"
            }
          >
            {task.chosenForToday ? "today ✓" : "today"}
          </button>
        )}
      </div>

      {/* Project selector */}
      <div className="mt-1.5 ml-7">
        <select
          aria-label="Assign project"
          value={task.projectId ?? ""}
          onChange={(e) =>
            updateTaskProject(task.id, e.target.value || null)
          }
          className="bg-transparent text-[10px] text-muted/70 outline-none cursor-pointer hover:text-zinc-400 transition-colors"
        >
          <option value="" className="bg-surface text-foreground">
            No project
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id} className="bg-surface text-foreground">
              {p.title}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}

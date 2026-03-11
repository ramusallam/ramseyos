"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createTask, toggleChosenForToday } from "@/lib/tasks";
import Link from "next/link";
import { useRef } from "react";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  color: string | null;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string | null;
  chosenForToday?: boolean;
  createdAt: unknown;
}

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-rose-50 text-rose-600",
  medium: "bg-amber-50 text-amber-600",
  low: "bg-sky-50 text-sky-600",
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600",
  paused: "bg-amber-50 text-amber-600",
  completed: "bg-sky-50 text-sky-600",
};

async function toggleCompleted(id: string, current: boolean) {
  await updateDoc(doc(db, "tasks", id), { completed: !current });
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "projects", projectId), (snap) => {
      if (snap.exists()) {
        setProject({ id: snap.id, ...snap.data() } as Project);
      }
      setLoading(false);
    });
    return unsub;
  }, [projectId]);

  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[]);
    });
    return unsub;
  }, [projectId]);

  if (loading) {
    return (
      <div className="max-w-3xl px-8 pt-10">
        <p className="text-sm text-muted/60">Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-3xl px-8 pt-10">
        <Link
          href="/projects"
          className="text-[11px] text-muted hover:text-foreground transition-colors"
        >
          &larr; Projects
        </Link>
        <p className="text-sm text-muted mt-4">Project not found.</p>
      </div>
    );
  }

  const incomplete = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="max-w-3xl px-8 pt-10 pb-20">
      {/* Breadcrumb */}
      <Link
        href="/projects"
        className="text-[11px] text-muted hover:text-foreground transition-colors"
      >
        &larr; Projects
      </Link>

      {/* Project header */}
      <header className="mt-4 mb-8">
        <div className="flex items-center gap-3 mb-2">
          {project.color && (
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: project.color }}
            />
          )}
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {project.title}
          </h1>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
              STATUS_STYLE[project.status] ?? "bg-gray-50 text-muted"
            }`}
          >
            {project.status}
          </span>
        </div>
        {project.description && (
          <p className="text-[13px] text-muted leading-relaxed max-w-xl">
            {project.description}
          </p>
        )}
      </header>

      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-8 text-[12px] text-muted/70">
        <span className="tabular-nums">{incomplete.length} open</span>
        <span className="tabular-nums">{completed.length} completed</span>
        <span className="tabular-nums">{tasks.length} total</span>
      </div>

      {/* Quick Add Task */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-card mb-8">
        <QuickAddTask projectId={projectId} />
      </div>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 shadow-card text-center">
          <p className="text-sm text-muted">
            No tasks yet. Add one above to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Open tasks */}
          {incomplete.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5 shadow-card">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-4">
                Open tasks
              </h2>
              <ul className="space-y-0.5">
                {incomplete.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </ul>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5 shadow-card">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60 mb-4">
                Completed
              </h2>
              <ul className="space-y-0.5">
                {completed.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuickAddTask({ projectId }: { projectId: string }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      await createTask({
        title: trimmed,
        projectId,
      });
      setText("");
      inputRef.current?.focus();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <span className="text-sm text-muted">+</span>
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a task to this project..."
        className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted/50 outline-none"
        disabled={saving}
      />
      {text.trim() && (
        <button
          type="submit"
          disabled={saving}
          className="text-[11px] font-medium text-accent hover:text-accent/80 transition-colors"
        >
          {saving ? "..." : "Add"}
        </button>
      )}
    </form>
  );
}

function TaskRow({ task }: { task: Task }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-raised ${
        task.completed ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => toggleCompleted(task.id, task.completed)}
        className={`size-4 shrink-0 rounded border transition-colors ${
          task.completed
            ? "border-accent/40 bg-accent/15"
            : "border-border-strong hover:border-accent/40"
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
          task.completed
            ? "text-muted line-through"
            : "text-foreground/80"
        }`}
      >
        {task.title}
      </span>

      {task.priority && !task.completed && (
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
            PRIORITY_STYLE[task.priority] ?? "text-muted"
          }`}
        >
          {task.priority}
        </span>
      )}

      {!task.completed && (
        <button
          type="button"
          onClick={() => toggleChosenForToday(task.id, !!task.chosenForToday)}
          className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 transition-colors ${
            task.chosenForToday
              ? "bg-accent-dim text-accent"
              : "text-muted/40 hover:text-muted/70"
          }`}
          aria-label={
            task.chosenForToday ? "Remove from today" : "Choose for today"
          }
        >
          {task.chosenForToday ? "today \u2713" : "today"}
        </button>
      )}
    </li>
  );
}

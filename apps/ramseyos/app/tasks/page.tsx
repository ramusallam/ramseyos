"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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

  const incomplete = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

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
            {incomplete.length > 0 && (
              <ul className="space-y-1 mb-8">
                {incomplete.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </ul>
            )}

            {completed.length > 0 && (
              <div>
                <h2 className="text-[10px] font-medium uppercase tracking-widest text-muted/50 mb-3">
                  Completed
                </h2>
                <ul className="space-y-1">
                  {completed.map((task) => (
                    <TaskItem key={task.id} task={task} />
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

function TaskItem({ task }: { task: Task }) {
  return (
    <li
      className={`flex items-center gap-3 rounded px-2.5 py-2.5 -mx-2.5 transition-colors hover:bg-surface ${
        task.completed ? "opacity-45" : ""
      }`}
    >
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
    </li>
  );
}

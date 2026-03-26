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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createTask, toggleChosenForToday, toggleTaskCompleted, updateTaskTitle } from "@/lib/tasks";
import { toggleProjectPinned } from "@/lib/projects";
import { trackRecent } from "@/lib/recents";
import { PRIORITY_STYLE, STATUS_STYLE } from "@/lib/shared";
import Link from "next/link";
import { useRef } from "react";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  color: string | null;
  pinned?: boolean;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string | null;
  chosenForToday?: boolean;
  createdAt: unknown;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "projects", projectId), (snap) => {
      if (snap.exists()) {
        const proj = { id: snap.id, ...snap.data() } as Project;
        setProject(proj);
        trackRecent({ id: `project-${proj.id}`, label: proj.title, href: `/projects/${proj.id}`, category: "project" });
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
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading project…</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <Link
          href="/projects"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Projects
        </Link>
        <div className="rounded-xl border border-border bg-surface backdrop-blur-sm p-10 text-center mt-8">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted mb-4">
            <path d="M2 5V4a1 1 0 011-1h3l1.5 2H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5z" />
          </svg>
          <p className="text-sm text-muted/60">Project not found</p>
          <p className="text-[12px] text-muted mt-1">
            It may have been archived or removed.
          </p>
        </div>
      </div>
    );
  }

  const incomplete = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);
  const chosen = incomplete.filter((t) => t.chosenForToday);
  const highPriority = incomplete.filter((t) => t.priority === "high" && !t.chosenForToday);
  const hasFocusItems = chosen.length > 0 || highPriority.length > 0;

  const total = tasks.length;
  const doneCount = completed.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const status = STATUS_STYLE[project.status] ?? { bg: "bg-white/5", text: "text-muted", label: project.status };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* Breadcrumb */}
      <Link
        href="/projects"
        className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
      >
        &larr; Projects
      </Link>

      {/* Project header */}
      <header className="mt-4 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="size-3.5 shrink-0 rounded-full"
            style={{ backgroundColor: project.color ?? "#f59e0b" }}
          />
          <h1 className="text-2xl font-semibold text-foreground">
            {project.title}
          </h1>
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          <button
            type="button"
            onClick={() => toggleProjectPinned(project.id, !!project.pinned)}
            className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
              project.pinned
                ? "bg-violet-500/10 text-violet-400"
                : "text-muted hover:text-muted/60 hover:bg-surface-raised"
            }`}
          >
            {project.pinned ? "pinned" : "pin"}
          </button>
        </div>
        {project.description && (
          <p className="text-[13px] text-muted/50 leading-relaxed max-w-xl mt-1">
            {project.description}
          </p>
        )}

        {/* Stats bar */}
        <div className="flex items-center gap-5 mt-4">
          <div className="flex items-center gap-3 text-[12px] text-muted/50">
            <span className="tabular-nums">{incomplete.length} open</span>
            <span className="text-border/30">·</span>
            <span className="tabular-nums">{doneCount} done</span>
            <span className="text-border/30">·</span>
            <span className="tabular-nums">{total} total</span>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2 max-w-[120px] flex-1">
              <div className="flex-1 h-1 rounded-full bg-border/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent/50 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-muted tabular-nums">{progress}%</span>
            </div>
          )}
        </div>
      </header>

      {/* Focus panel */}
      {hasFocusItems && (
        <div className="rounded-xl border border-accent/15 bg-accent-soft p-5 mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-accent/60 mb-4">
            Focus
          </h2>
          <div className="space-y-4">
            {chosen.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-accent font-medium mb-2">
                  Chosen for today
                </p>
                <ul className="space-y-1">
                  {chosen.map((task) => (
                    <FocusRow key={task.id} task={task} />
                  ))}
                </ul>
              </div>
            )}
            {highPriority.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-rose-400/80 font-medium mb-2">
                  High priority
                </p>
                <ul className="space-y-1">
                  {highPriority.map((task) => (
                    <FocusRow key={task.id} task={task} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!hasFocusItems && incomplete.length > 0 && (
        <div className="rounded-xl border border-border bg-surface backdrop-blur-sm px-5 py-4 mb-6 flex items-center gap-3">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
            <path d="M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v3l2 1" />
          </svg>
          <p className="text-[13px] text-muted">
            Mark tasks as &ldquo;today&rdquo; or set high priority to surface them in Focus.
          </p>
        </div>
      )}

      {/* Quick Add Task */}
      <div className="rounded-xl border border-border bg-surface p-4 mb-6">
        <QuickAddTask projectId={projectId} />
      </div>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface backdrop-blur-sm p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted mb-4">
            <rect x="2" y="2" width="12" height="12" rx="3" />
            <path d="M5.5 8l2 2 3-4" />
          </svg>
          <p className="text-sm text-muted/60">No tasks yet</p>
          <p className="text-[12px] text-muted mt-1">
            Add one above to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Open tasks */}
          {incomplete.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Open tasks
                </h2>
                <span className="text-[10px] text-muted tabular-nums">{incomplete.length}</span>
                <div className="flex-1 border-t border-border ml-2" />
              </div>
              <ul className="space-y-1.5">
                {incomplete.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </ul>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 mb-3 group w-full"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <path d="M5.5 8l2 2 3-4" />
                </svg>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Completed
                </h2>
                <span className="text-[10px] text-muted tabular-nums">{completed.length}</span>
                <div className="flex-1 border-t border-border ml-2" />
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-muted transition-transform ${showCompleted ? "rotate-180" : ""}`}
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              {showCompleted && (
                <ul className="space-y-1.5">
                  {completed.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      {/* Cross-links */}
      <div className="flex items-center gap-3 mt-10 pt-6 border-t border-border">
        <Link
          href="/tasks"
          className="text-[11px] text-muted hover:text-muted/60 transition-colors"
        >
          All tasks &rarr;
        </Link>
        <Link
          href="/projects"
          className="text-[11px] text-muted hover:text-muted/60 transition-colors"
        >
          Projects &rarr;
        </Link>
        <Link
          href="/inbox"
          className="text-[11px] text-muted hover:text-muted/60 transition-colors"
        >
          Inbox &rarr;
        </Link>
      </div>
    </div>
  );
}

function FocusRow({ task }: { task: Task }) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-raised/30">
      <button
        type="button"
        onClick={() => toggleTaskCompleted(task.id, task.completed)}
        className="size-5 shrink-0 rounded-lg border-2 border-border-strong hover:border-accent/40 transition-colors flex items-center justify-center"
        aria-label="Mark complete"
      />
      <span className="flex-1 text-[14px] text-foreground/80 truncate">
        {task.title}
      </span>
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
  );
}

function QuickAddTask({ projectId }: { projectId: string }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      await createTask({ title: trimmed, projectId });
      setText("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      inputRef.current?.focus();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted shrink-0">
        <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a task to this project…"
        className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted outline-none"
        disabled={saving}
      />
      {saved ? (
        <span className="text-[12px] text-emerald-400/70 flex items-center gap-1.5 shrink-0">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          Added
        </span>
      ) : text.trim() ? (
        <button
          type="submit"
          disabled={saving}
          className="text-[13px] font-medium text-accent hover:text-accent/80 transition-colors px-2 py-1 rounded-lg hover:bg-accent-dim shrink-0"
        >
          {saving ? "…" : "Add"}
        </button>
      ) : null}
    </form>
  );
}

function TaskRow({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(task.title);
  const editRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    if (task.completed) return;
    setEditText(task.title);
    setEditing(true);
    setTimeout(() => editRef.current?.focus(), 0);
  }

  async function commitEdit() {
    setEditing(false);
    const trimmed = editText.trim();
    if (trimmed && trimmed !== task.title) {
      await updateTaskTitle(task.id, trimmed);
    }
  }

  return (
    <li
      className={`flex items-center gap-3 rounded-xl border border-border bg-surface backdrop-blur-sm px-4 py-3 transition-all hover:bg-surface-raised/30 ${
        task.completed ? "opacity-35" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => toggleTaskCompleted(task.id, task.completed)}
        className={`size-5 shrink-0 rounded-lg border-2 transition-colors flex items-center justify-center ${
          task.completed
            ? "border-accent/40 bg-accent/20"
            : "border-border-strong hover:border-accent/40"
        }`}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        {task.completed && (
          <svg viewBox="0 0 16 16" className="size-3.5 text-accent">
            <path
              d="M4.5 8.5L7 11l4.5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {editing ? (
        <input
          ref={editRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") setEditing(false);
          }}
          aria-label="Edit task title"
          className="flex-1 text-[14px] text-foreground/85 bg-transparent outline-none border-b border-accent/30 py-0"
        />
      ) : (
        <span
          className={`flex-1 text-[14px] truncate ${
            task.completed ? "text-muted/50 line-through" : "text-foreground/85 cursor-text"
          }`}
          onDoubleClick={startEditing}
          title={task.completed ? undefined : "Double-click to edit"}
        >
          {task.title}
        </span>
      )}

      {task.priority && !task.completed && (
        <span
          className={`text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0 ${
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
          className={`text-[10px] px-2 py-1 rounded-lg shrink-0 transition-colors ${
            task.chosenForToday
              ? "bg-accent-dim text-accent font-medium"
              : "text-muted hover:text-muted/60 hover:bg-surface-raised"
          }`}
          aria-label={
            task.chosenForToday ? "Remove from today" : "Choose for today"
          }
        >
          {task.chosenForToday ? "today ✓" : "today"}
        </button>
      )}
    </li>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateTaskProject, updateTaskTitle, toggleChosenForToday, toggleTaskCompleted, toggleTaskPinned } from "@/lib/tasks";
import { type Priority, PRIORITY_STYLE } from "@/lib/shared";
import Link from "next/link";

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
  pinned?: boolean;
}

interface Project {
  id: string;
  title: string;
  color: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTasks(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[]
        );
        setLoading(false);
      },
      (err) => {
        console.error("Tasks listener error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      where("archived", "==", false),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setProjects(
          snap.docs.map((d) => ({
            id: d.id,
            title: d.data().title ?? "Untitled",
            color: d.data().color ?? null,
          }))
        );
      },
      (err) => console.error("Projects listener error:", err)
    );
    return unsub;
  }, []);

  const { incomplete, completed, chosenCount, fromInboxCount, grouped } =
    useMemo(() => {
      const inc: Task[] = [];
      const comp: Task[] = [];
      let chosen = 0;
      let fromInbox = 0;

      for (const t of tasks) {
        if (t.completed) comp.push(t);
        else inc.push(t);
        if (!t.completed && t.chosenForToday) chosen++;
        if (t.sourceCaptureId) fromInbox++;
      }

      const byProjectId = new Map<string | null, Task[]>();
      for (const task of inc) {
        const key = task.projectId ?? null;
        const arr = byProjectId.get(key);
        if (arr) arr.push(task);
        else byProjectId.set(key, [task]);
      }

      const grp: { project: Project | null; tasks: Task[] }[] = [];
      for (const p of projects) {
        const projectTasks = byProjectId.get(p.id);
        if (projectTasks) grp.push({ project: p, tasks: projectTasks });
      }
      const unassigned = byProjectId.get(null);
      if (unassigned) grp.push({ project: null, tasks: unassigned });

      return {
        incomplete: inc,
        completed: comp,
        chosenCount: chosen,
        fromInboxCount: fromInbox,
        grouped: grp,
      };
    }, [tasks, projects]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading tasks…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* ── Header ── */}
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">
          Tasks
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          All tasks across every project. Grouped by context.
        </p>

        {/* Stat bar */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-sky-400" />
              <span className="tabular-nums">{incomplete.length} open</span>
            </span>
            {chosenCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-accent" />
                <span className="tabular-nums">{chosenCount} today</span>
              </span>
            )}
            {completed.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span className="tabular-nums">{completed.length} done</span>
              </span>
            )}
            {fromInboxCount > 0 && (
              <span className="tabular-nums">{fromInboxCount} from inbox</span>
            )}
          </div>
        )}

        {/* Cross-links */}
        <div className="flex items-center gap-3 mt-3">
          <Link href="/inbox" className="text-[11px] text-muted hover:text-muted/60 transition-colors">
            Inbox &rarr;
          </Link>
          <Link href="/projects" className="text-[11px] text-muted hover:text-muted/60 transition-colors">
            Projects &rarr;
          </Link>
        </div>
      </header>

      {/* ── Empty ── */}
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface backdrop-blur-sm p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted mb-4">
            <rect x="2" y="2" width="12" height="12" rx="3" />
            <path d="M5.5 8l2 2 3-4" />
          </svg>
          <p className="text-sm text-muted/60 font-medium">No tasks yet</p>
          <p className="text-[12px] text-muted mt-1">
            Convert captures from the{" "}
            <Link href="/inbox" className="text-accent/50 hover:text-accent transition-colors">
              Inbox
            </Link>{" "}
            or add tasks from a{" "}
            <Link href="/projects" className="text-accent/50 hover:text-accent transition-colors">
              project
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ project, tasks: groupTasks }) => (
            <section key={project?.id ?? "unassigned"}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-3">
                {project?.color && (
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                )}
                {project ? (
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-[11px] font-semibold uppercase tracking-wider text-muted hover:text-accent transition-colors"
                  >
                    {project.title}
                  </Link>
                ) : (
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted/50">
                    Unassigned
                  </h2>
                )}
                <span className="text-[10px] text-muted tabular-nums">{groupTasks.length}</span>
                <div className="flex-1 border-t border-border" />
                {project && (
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-[11px] text-muted hover:text-muted/60 transition-colors"
                  >
                    Open &rarr;
                  </Link>
                )}
              </div>

              {/* Tasks */}
              <ul className="space-y-1.5">
                {groupTasks.map((task) => (
                  <TaskItem key={task.id} task={task} projects={projects} />
                ))}
              </ul>
            </section>
          ))}

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
                <div className="flex-1 border-t border-border" />
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
                    <TaskItem key={task.id} task={task} projects={projects} />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Task Item ── */

function TaskItem({
  task,
  projects,
}: {
  task: Task;
  projects: Project[];
}) {
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
      className={`rounded-xl border border-border bg-surface backdrop-blur-sm px-4 py-3 transition-all hover:bg-surface-raised/30 ${
        task.completed ? "opacity-35" : ""
      }`}
    >
      <div className="flex items-center gap-3">
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

        {/* Inbox origin indicator */}
        {task.sourceCaptureId && !task.completed && (
          <span className="text-[10px] text-muted shrink-0">inbox</span>
        )}

        {task.priority && !task.completed && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0 ${
              PRIORITY_STYLE[task.priority] ?? "text-muted/50"
            }`}
          >
            {task.priority}
          </span>
        )}

        {!task.completed && (
          <>
            <button
              type="button"
              onClick={() => toggleTaskPinned(task.id, !!task.pinned)}
              className={`text-[10px] px-2 py-1 rounded-lg shrink-0 transition-colors ${
                task.pinned
                  ? "bg-violet-500/10 text-violet-400 font-medium"
                  : "text-muted hover:text-muted/60 hover:bg-surface-raised"
              }`}
              aria-label={task.pinned ? "Unpin" : "Pin"}
            >
              {task.pinned ? "pinned" : "pin"}
            </button>
            <button
              type="button"
              onClick={() =>
                toggleChosenForToday(task.id, !!task.chosenForToday)
              }
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
          </>
        )}
      </div>

      {/* Project selector — only show for incomplete tasks */}
      {!task.completed && (
        <div className="mt-2 ml-8">
          <select
            aria-label="Assign project"
            value={task.projectId ?? ""}
            onChange={(e) =>
              updateTaskProject(task.id, e.target.value || null)
            }
            className="bg-surface-raised/50 rounded-lg text-[11px] text-muted/60 outline-none cursor-pointer hover:text-foreground/60 transition-colors px-2 py-1.5 border border-border"
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
      )}
    </li>
  );
}

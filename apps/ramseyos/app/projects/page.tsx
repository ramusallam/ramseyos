"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  color: string | null;
}

interface TaskCount {
  projectId: string;
  total: number;
  completed: number;
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600",
  paused: "bg-amber-50 text-amber-600",
  completed: "bg-sky-50 text-sky-600",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskCounts, setTaskCounts] = useState<Map<string, TaskCount>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      where("archived", "==", false),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setProjects(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Project[]
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "tasks"));
    const unsub = onSnapshot(q, (snap) => {
      const counts = new Map<string, TaskCount>();
      for (const d of snap.docs) {
        const data = d.data();
        const pid = data.projectId as string | null;
        if (!pid) continue;
        if (!counts.has(pid)) {
          counts.set(pid, { projectId: pid, total: 0, completed: 0 });
        }
        const entry = counts.get(pid)!;
        entry.total++;
        if (data.completed) entry.completed++;
      }
      setTaskCounts(counts);
    });
    return unsub;
  }, []);

  return (
    <div className="max-w-3xl px-8 pt-10 pb-20">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Projects
        </h1>
        <p className="text-[13px] text-muted mt-1">
          {projects.length} active project{projects.length !== 1 ? "s" : ""}
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted/60">Loading...</p>
      ) : projects.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 shadow-card text-center">
          <p className="text-sm text-muted">No projects yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((project) => {
            const counts = taskCounts.get(project.id);
            const open = counts ? counts.total - counts.completed : 0;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group bg-surface rounded-xl border border-border p-5 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {project.color && (
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    <h2 className="text-[15px] font-medium text-foreground group-hover:text-accent transition-colors truncate">
                      {project.title}
                    </h2>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                      STATUS_STYLE[project.status] ?? "bg-gray-50 text-muted"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                {project.description && (
                  <p className="text-[12px] text-muted leading-relaxed line-clamp-2 mb-3">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-muted/70">
                  {counts ? (
                    <>
                      <span className="tabular-nums">
                        {open} open
                      </span>
                      <span className="tabular-nums">
                        {counts.completed} done
                      </span>
                    </>
                  ) : (
                    <span>No tasks</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

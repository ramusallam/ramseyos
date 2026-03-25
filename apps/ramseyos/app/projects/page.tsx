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
import { STATUS_STYLE } from "@/lib/shared";
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
    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      <header className="mb-8">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-xl font-normal text-foreground tracking-tight mt-2">
          Projects
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          {projects.length} active project{projects.length !== 1 ? "s" : ""}
        </p>

        {/* Cross-links */}
        <div className="flex items-center gap-3 mt-3">
          <Link href="/tasks" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Tasks &rarr;
          </Link>
          <Link href="/inbox" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Inbox &rarr;
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted/40">Loading projects…</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-surface/50 backdrop-blur-sm p-12 text-center">
          <svg width="36" height="36" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted/20 mb-5">
            <path d="M2 5V4a1 1 0 011-1h3l1.5 2H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5z" />
          </svg>
          <p className="text-[16px] text-muted/50 font-medium">No projects yet</p>
          <p className="text-[13px] text-muted/30 mt-2">
            Projects give structure to your work.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const counts = taskCounts.get(project.id);
            const open = counts ? counts.total - counts.completed : 0;
            const total = counts?.total ?? 0;
            const done = counts?.completed ?? 0;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;
            const status = STATUS_STYLE[project.status] ?? { bg: "bg-white/5", text: "text-muted", label: project.status };

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group block rounded-xl border border-border/50 bg-surface/50 p-5 transition-all hover:bg-surface-raised/40 hover:border-border-strong/50"
              >
                <div className="flex items-start gap-4">
                  {/* Color indicator */}
                  <div className="pt-1.5 shrink-0">
                    <span
                      className="block size-3 rounded-full"
                      style={{ backgroundColor: project.color ?? "#6366f1" }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-[16px] font-medium text-foreground group-hover:text-accent transition-colors truncate">
                        {project.title}
                      </h2>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0 ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-[13px] text-muted/60 leading-relaxed line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}

                    {/* Stats + progress */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 text-[12px] text-muted/50">
                        <span className="tabular-nums">{open} open</span>
                        <span className="text-border/30">·</span>
                        <span className="tabular-nums">{done} done</span>
                      </div>
                      {total > 0 && (
                        <div className="flex-1 flex items-center gap-2 max-w-[140px]">
                          <div className="flex-1 h-1 rounded-full bg-border/30 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent/50 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted/40 tabular-nums">
                            {progress}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted/20 group-hover:text-muted/50 transition-colors shrink-0 mt-1.5">
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

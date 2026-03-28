"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getWorkspace, getWorkspaceData, type Workspace, type WorkspaceData } from "@/lib/workspaces";
import Link from "next/link";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const workspace = getWorkspace(workspaceId);

  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!workspaceId) return;
    getWorkspaceData(workspaceId)
      .then(setData)
      .catch((err) => console.error("Workspace data error:", err))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  function toggle(key: string) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (!workspace) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <Link
          href="/workspaces"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Workspaces
        </Link>
        <p className="text-[14px] text-muted mt-4">Workspace not found.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading {workspace.shortName}...</span>
        </div>
      </div>
    );
  }

  const openTasks = data ? data.tasks.filter((t) => !t.completed) : [];
  const isSchool = workspace.domain === "school";

  // Group open tasks by project
  const tasksByProject = new Map<string, typeof openTasks>();
  for (const task of openTasks) {
    const key = task.projectId || "__unassigned__";
    if (!tasksByProject.has(key)) tasksByProject.set(key, []);
    tasksByProject.get(key)!.push(task);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* Header */}
      <header className="mb-10">
        <Link
          href="/workspaces"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Workspaces
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <span
            className={`size-2.5 rounded-full shrink-0 ${workspace.color.replace("/10", "/60")}`}
          />
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight">
            {workspace.name}
          </h1>
          <span
            className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${workspace.color} ${workspace.accent}`}
          >
            {workspace.domain}
          </span>
        </div>
        <p className="text-[13px] text-muted mt-1">{workspace.description}</p>

        {/* Summary stats */}
        {data && (
          <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-muted">
            <StatDot color={workspace.color.replace("/10", "")} label={`${data.projects.length} projects`} />
            <StatDot color="bg-sky-400" label={`${openTasks.length} open tasks`} />
            {isSchool && data.lessonPlans.length > 0 && (
              <StatDot color="bg-violet-400" label={`${data.lessonPlans.length} lessons`} />
            )}
            {data.drafts.length > 0 && (
              <span className="tabular-nums">{data.drafts.length} drafts</span>
            )}
          </div>
        )}
      </header>

      <div className="space-y-6">
        {/* Active Projects */}
        <CollapsibleSection
          icon="M2 5V4a1 1 0 011-1h3l1.5 2H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5z"
          label="Active projects"
          count={data?.projects.length || 0}
          accent={workspace.accent}
          collapsed={collapsed["projects"]}
          onToggle={() => toggle("projects")}
        >
          {data && data.projects.length > 0 ? (
            <div className="space-y-1">
              {data.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-raised/50 transition-colors"
                >
                  {project.color && (
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                  )}
                  {!project.color && <span className={`size-2 shrink-0 rounded-full ${workspace.color.replace("/10", "/40")}`} />}
                  <span className="flex-1 text-[13px] text-foreground/80 truncate">{project.title}</span>
                  <StatusBadge status={project.status} />
                  {project.taskCount > 0 && (
                    <span className="text-[10px] text-muted tabular-nums shrink-0">{project.taskCount} tasks</span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyMessage>No active projects in this workspace.</EmptyMessage>
          )}
        </CollapsibleSection>

        {/* Open Tasks */}
        <CollapsibleSection
          icon="M2 2h12v12H2zM5.5 8l2 2 3-4"
          label="Open tasks"
          count={openTasks.length}
          accent={workspace.accent}
          collapsed={collapsed["tasks"]}
          onToggle={() => toggle("tasks")}
        >
          {openTasks.length > 0 ? (
            <div className="space-y-3">
              {Array.from(tasksByProject.entries()).map(([projId, tasks]) => {
                const projName = projId === "__unassigned__"
                  ? "Unassigned"
                  : data?.projects.find((p) => p.id === projId)?.title || "Unknown";
                return (
                  <div key={projId}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1 px-3">
                      {projName}
                    </p>
                    <ul className="space-y-0.5">
                      {tasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-raised/50 transition-colors"
                        >
                          <span className="size-3.5 shrink-0 rounded border border-border-strong" />
                          <span className="flex-1 text-[13px] text-foreground/80 truncate">{task.title}</span>
                          {task.priority && <PriorityBadge priority={task.priority} />}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyMessage>No open tasks for this workspace.</EmptyMessage>
          )}
        </CollapsibleSection>

        {/* Lesson Plans (school workspaces only) */}
        {isSchool && (
          <CollapsibleSection
            icon="M3 2.5h10a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1z"
            label="Lesson plans"
            count={data?.lessonPlans.length || 0}
            accent={workspace.accent}
            collapsed={collapsed["lessons"]}
            onToggle={() => toggle("lessons")}
          >
            {data && data.lessonPlans.length > 0 ? (
              <div className="space-y-1">
                {data.lessonPlans.map((lp) => (
                  <Link
                    key={lp.id}
                    href={`/lesson-plans/${lp.id}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-raised/50 transition-colors"
                  >
                    <span className={`size-1.5 rounded-full shrink-0 ${lp.status === "ready" ? "bg-emerald-400" : lp.status === "draft" ? "bg-amber-400" : "bg-sky-400"}`} />
                    <span className="flex-1 text-[13px] text-foreground/80 truncate">{lp.title}</span>
                    {lp.course && (
                      <span className="text-[10px] text-muted shrink-0">{lp.course}</span>
                    )}
                    <StatusBadge status={lp.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyMessage>No lesson plans yet.</EmptyMessage>
            )}
          </CollapsibleSection>
        )}

        {/* Drafts */}
        <CollapsibleSection
          icon="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z"
          label="Recent drafts"
          count={data?.drafts.length || 0}
          accent={workspace.accent}
          collapsed={collapsed["drafts"]}
          onToggle={() => toggle("drafts")}
        >
          {data && data.drafts.length > 0 ? (
            <div className="space-y-1">
              {data.drafts.map((draft) => (
                <Link
                  key={draft.id}
                  href="/communications"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-raised/50 transition-colors"
                >
                  <span className={`size-1.5 rounded-full shrink-0 ${draft.status === "ready" ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className="flex-1 text-[13px] text-foreground/80 truncate">{draft.subject}</span>
                  <span className="text-[10px] text-muted shrink-0">{draft.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyMessage>No drafts.</EmptyMessage>
          )}
        </CollapsibleSection>

        {/* Admin Items */}
        <CollapsibleSection
          icon="M5 5.5h6M5 8h6M5 10.5h4"
          label="Admin items"
          count={data?.adminItems.length || 0}
          accent={workspace.accent}
          collapsed={collapsed["admin"]}
          onToggle={() => toggle("admin")}
        >
          {data && data.adminItems.length > 0 ? (
            <div className="space-y-1">
              {data.adminItems.map((item) => (
                <Link
                  key={item.id}
                  href="/admin"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-raised/50 transition-colors"
                >
                  <span className={`size-1.5 rounded-full shrink-0 ${item.status === "in_progress" ? "bg-sky-400" : item.status === "done" ? "bg-emerald-400" : "bg-gray-300"}`} />
                  <span className="flex-1 text-[13px] text-foreground/80 truncate">{item.title}</span>
                  <span className="text-[10px] text-muted shrink-0">{item.category}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyMessage>No admin items.</EmptyMessage>
          )}
        </CollapsibleSection>

        {/* Products */}
        {data && data.products.length > 0 && (
          <CollapsibleSection
            icon="M2 3h12v10H2zM5 7h6M5 10h3"
            label="Products"
            count={data.products.length}
            accent={workspace.accent}
            collapsed={collapsed["products"]}
            onToggle={() => toggle("products")}
          >
            <div className="space-y-1">
              {data.products.map((product) => (
                <Link
                  key={product.id}
                  href="/product-ops"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-raised/50 transition-colors"
                >
                  <span className={`size-1.5 rounded-full shrink-0 ${product.status === "active" ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className="flex-1 text-[13px] text-foreground/80 truncate">{product.name}</span>
                  <span className="text-[10px] text-muted shrink-0">{product.category}</span>
                </Link>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

/* ── Primitives ── */

function StatDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-1.5 rounded-full ${color}`} />
      <span className="tabular-nums">{label}</span>
    </span>
  );
}

function CollapsibleSection({
  icon,
  label,
  count,
  accent,
  collapsed,
  onToggle,
  children,
}: {
  icon: string;
  label: string;
  count: number;
  accent: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 mb-3 w-full text-left group"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <path d={icon} />
        </svg>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </h2>
        {count > 0 && (
          <span className={`text-[10px] tabular-nums ${accent}`}>{count}</span>
        )}
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
          className={`text-muted/40 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {!collapsed && children}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400",
    paused: "bg-amber-500/10 text-amber-400",
    completed: "bg-sky-500/10 text-sky-400",
    draft: "bg-amber-500/10 text-amber-400",
    ready: "bg-emerald-500/10 text-emerald-400",
    pending: "bg-gray-500/10 text-gray-400",
    in_progress: "bg-sky-500/10 text-sky-400",
    done: "bg-emerald-500/10 text-emerald-400",
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${styles[status] ?? "text-muted"}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    high: "bg-rose-500/10 text-rose-400",
    medium: "bg-amber-500/10 text-amber-400",
    low: "bg-sky-500/10 text-sky-400",
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${styles[priority] ?? "text-muted"}`}>
      {priority}
    </span>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-muted/60 px-3 py-2">{children}</p>;
}

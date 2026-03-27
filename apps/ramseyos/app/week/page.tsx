"use client";

import { useEffect, useState } from "react";
import {
  generateWeeklyPlan,
  type WeeklyPlan,
  type WeeklyTask,
  type WeeklyProject,
  type WeeklyAdminItem,
  type WeeklyLifeItem,
  type WeeklyDraft,
  type WeeklyLessonPlan,
  type WeeklyScheduleDay,
} from "@/lib/weekly";
import { toggleTaskCompleted, toggleChosenForToday } from "@/lib/tasks";
import { getRecentReflections, type Reflection } from "@/lib/reflections";
import Link from "next/link";

export default function WeekPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      generateWeeklyPlan(),
      getRecentReflections(7),
    ])
      .then(([p, r]) => { setPlan(p); setReflections(r); })
      .catch((err) => console.error("Weekly plan error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading your week…</span>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <p className="text-[14px] text-muted">Could not load weekly plan.</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* ── Header ── */}
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-[22px] font-semibold text-foreground tracking-tight mt-2">
          This Week
        </h1>
        <p className="text-[13px] text-muted mt-1">
          {plan.weekLabel}
        </p>

        {/* ── Summary bar ── */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-muted">
          {plan.counts.carryForward > 0 && (
            <StatDot color="bg-amber-400" label={`${plan.counts.carryForward} carry-forward`} />
          )}
          <StatDot color="bg-sky-400" label={`${plan.counts.openTasks} open tasks`} />
          <StatDot color="bg-violet-400" label={`${plan.counts.activeProjects} projects`} />
          {plan.counts.weekEvents > 0 && (
            <StatDot color="bg-emerald-400" label={`${plan.counts.weekEvents} events`} />
          )}
          {plan.counts.adminPending > 0 && (
            <span className="tabular-nums">{plan.counts.adminPending} admin</span>
          )}
          {plan.counts.lifePending > 0 && (
            <span className="tabular-nums">{plan.counts.lifePending} personal</span>
          )}
        </div>
      </header>

      <div className="space-y-8">
        {/* ── Carry Forward ── */}
        {plan.carryForward.length > 0 && (
          <WeekSection
            icon="M2 8h12M8 2v12"
            label="Carry forward"
            count={plan.carryForward.length}
            description="Important items that need attention this week"
          >
            <ul className="space-y-1">
              {plan.carryForward.map((task) => (
                <CarryForwardItem key={task.id} task={task} />
              ))}
            </ul>
          </WeekSection>
        )}

        {/* ── Week Schedule ── */}
        <WeekSection
          icon="M2 3h12v11H2zM2 7h12M5 1.5v3M11 1.5v3"
          label="Schedule"
          count={plan.counts.weekEvents}
        >
          <div className="space-y-2">
            {plan.scheduleDays.map((day) => (
              <ScheduleDayRow key={day.label} day={day} isToday={isSameDay(day.date, today)} />
            ))}
          </div>
        </WeekSection>

        {/* ── Active Projects ── */}
        {plan.activeProjects.length > 0 && (
          <WeekSection
            icon="M2 5V4a1 1 0 011-1h3l1.5 2H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5z"
            label="Active projects"
            count={plan.activeProjects.length}
          >
            <div className="space-y-1.5">
              {plan.activeProjects.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </div>
          </WeekSection>
        )}

        {/* ── Teaching ── */}
        {plan.activeLessons.length > 0 && (
          <WeekSection
            icon="M3 2.5h10a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1z"
            label="Lesson prep"
            count={plan.activeLessons.length}
          >
            <div className="space-y-1.5">
              {plan.activeLessons.map((lp) => (
                <LessonRow key={lp.id} lesson={lp} />
              ))}
            </div>
          </WeekSection>
        )}

        {/* ── Communications ── */}
        {plan.pendingDrafts.length > 0 && (
          <WeekSection
            icon="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z"
            label="Drafts to send"
            count={plan.pendingDrafts.length}
          >
            <div className="space-y-1.5">
              {plan.pendingDrafts.map((draft) => (
                <DraftRow key={draft.id} draft={draft} />
              ))}
            </div>
          </WeekSection>
        )}

        {/* ── Admin & Life (combined for compactness) ── */}
        {(plan.adminItems.length > 0 || plan.lifeItems.length > 0) && (
          <WeekSection
            icon="M5 5.5h6M5 8h6M5 10.5h4"
            label="Admin & personal"
            count={plan.adminItems.length + plan.lifeItems.length}
          >
            <div className="space-y-1.5">
              {plan.adminItems.map((item) => (
                <AdminLifeRow key={item.id} title={item.title} category={item.category} type="admin" status={item.status} />
              ))}
              {plan.lifeItems.map((item) => (
                <AdminLifeRow key={item.id} title={item.title} category={item.category} type="life" status={item.status} />
              ))}
            </div>
          </WeekSection>
        )}

        {/* ── All Open Tasks ── */}
        <WeekSection
          icon="M2 2h12v12H2zM5.5 8l2 2 3-4"
          label="All open tasks"
          count={plan.openTasks.length}
          description="Everything in your task list"
        >
          {plan.openTasks.length === 0 ? (
            <p className="text-[12px] text-muted">No open tasks this week.</p>
          ) : (
            <ul className="space-y-1">
              {plan.openTasks.slice(0, 15).map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
              {plan.openTasks.length > 15 && (
                <li className="py-1.5">
                  <Link href="/tasks" className="text-[12px] text-accent hover:text-accent/80 transition-colors">
                    View all {plan.openTasks.length} tasks &rarr;
                  </Link>
                </li>
              )}
            </ul>
          )}
        </WeekSection>

        {/* ── Reflections ── */}
        {reflections.length > 0 && (
          <WeekSection icon="M8 2v1M8 13v1M3 8H2M14 8h-1" label="Recent reflections">
            <div className="space-y-2">
              {reflections.map((r) => {
                const dayLabel = new Date(r.date + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const moodLabel = r.mood === "great" ? "Great" : r.mood === "good" ? "Good" : r.mood === "okay" ? "Okay" : "Rough";
                return (
                  <div key={r.id} className="rounded-lg border border-border bg-surface px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-medium text-foreground/70">{dayLabel}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        r.mood === "great" ? "bg-emerald-50 text-emerald-600" :
                        r.mood === "good" ? "bg-sky-50 text-sky-600" :
                        r.mood === "okay" ? "bg-amber-50 text-amber-600" :
                        "bg-rose-50 text-rose-600"
                      }`}>{moodLabel}</span>
                    </div>
                    {r.wins && <p className="text-[12px] text-foreground/70">{r.wins}</p>}
                    {r.tomorrow && <p className="text-[11px] text-muted mt-1">Tomorrow: {r.tomorrow}</p>}
                  </div>
                );
              })}
            </div>
          </WeekSection>
        )}

        {/* ── Weekly Review Prompt ── */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <div className="flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-accent mt-0.5 shrink-0">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3l2 1.5" />
            </svg>
            <div>
              <h3 className="text-[14px] font-semibold text-foreground">Weekly review</h3>
              <p className="text-[13px] text-muted mt-1 leading-relaxed">
                Take a moment to scan your week. Are the right things prioritized?
                Is anything missing? Move important items to &quot;today&quot; from the tasks page,
                or review your projects for upcoming deadlines.
              </p>
              <div className="flex gap-3 mt-3">
                <Link href="/tasks" className="text-[12px] text-accent hover:text-accent/80 transition-colors font-medium">
                  Review tasks &rarr;
                </Link>
                <Link href="/projects" className="text-[12px] text-accent hover:text-accent/80 transition-colors font-medium">
                  Review projects &rarr;
                </Link>
                <Link href="/inbox" className="text-[12px] text-accent hover:text-accent/80 transition-colors font-medium">
                  Clear inbox &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
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

function WeekSection({
  icon,
  label,
  count,
  description,
  children,
}: {
  icon: string;
  label: string;
  count?: number;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <path d={icon} />
        </svg>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </h2>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] text-muted tabular-nums">{count}</span>
        )}
        <div className="flex-1 border-t border-border" />
      </div>
      {description && (
        <p className="text-[11px] text-muted mb-2">{description}</p>
      )}
      {children}
    </section>
  );
}

function CarryForwardItem({ task }: { task: WeeklyTask }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
      <button
        type="button"
        onClick={() => toggleTaskCompleted(task.id, task.completed)}
        className="size-5 shrink-0 rounded-lg border-2 border-amber-300 hover:border-amber-400 transition-colors flex items-center justify-center"
        aria-label="Mark complete"
      />
      <span className="flex-1 text-[14px] text-foreground/85 truncate">
        {task.title}
      </span>
      {task.priority && (
        <PriorityBadge priority={task.priority} />
      )}
      {task.chosenForToday && (
        <span className="text-[10px] text-accent font-medium shrink-0">today</span>
      )}
      {task.pinned && (
        <span className="text-[10px] text-violet-500 font-medium shrink-0">pinned</span>
      )}
      {!task.chosenForToday && (
        <button
          type="button"
          onClick={() => toggleChosenForToday(task.id, false)}
          className="text-[10px] text-muted hover:text-accent transition-colors shrink-0"
        >
          + today
        </button>
      )}
    </li>
  );
}

function TaskRow({ task }: { task: WeeklyTask }) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-raised/50 transition-colors">
      <button
        type="button"
        onClick={() => toggleTaskCompleted(task.id, task.completed)}
        className="size-4 shrink-0 rounded border-2 border-border-strong hover:border-accent/40 transition-colors flex items-center justify-center"
        aria-label="Mark complete"
      />
      <span className="flex-1 text-[13px] text-foreground/80 truncate">
        {task.title}
      </span>
      {task.priority && <PriorityBadge priority={task.priority} />}
      {task.chosenForToday && (
        <span className="text-[9px] text-accent font-medium shrink-0">today</span>
      )}
      {task.pinned && (
        <span className="text-[9px] text-violet-500 font-medium shrink-0">pinned</span>
      )}
    </li>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    high: "text-rose-600 bg-rose-50",
    medium: "text-amber-600 bg-amber-50",
    low: "text-gray-500 bg-gray-100",
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${styles[priority] ?? "text-muted"}`}>
      {priority}
    </span>
  );
}

function ScheduleDayRow({ day, isToday }: { day: WeeklyScheduleDay; isToday: boolean }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg px-3 py-2 ${isToday ? "bg-accent-dim/50" : ""}`}>
      <span className={`text-[11px] font-medium w-28 shrink-0 tabular-nums ${isToday ? "text-accent" : "text-muted"}`}>
        {day.label}
        {isToday && <span className="ml-1.5 text-[9px] text-accent font-semibold">TODAY</span>}
      </span>
      <div className="flex-1 min-w-0">
        {day.events.length === 0 ? (
          <span className="text-[12px] text-muted/60">—</span>
        ) : (
          <div className="space-y-0.5">
            {day.events.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-[12px]">
                <span className="text-muted tabular-nums shrink-0">
                  {e.startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </span>
                <span className="text-foreground/80 truncate">{e.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectRow({ project }: { project: WeeklyProject }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-raised/50 transition-colors"
    >
      {project.color && (
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
      )}
      <span className="flex-1 text-[13px] text-foreground/80 truncate">{project.title}</span>
      {project.taskCount > 0 && (
        <span className="text-[10px] text-muted tabular-nums shrink-0">{project.taskCount} tasks</span>
      )}
    </Link>
  );
}

function LessonRow({ lesson }: { lesson: WeeklyLessonPlan }) {
  return (
    <Link
      href={`/lesson-plans/${lesson.id}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-raised/50 transition-colors"
    >
      <span className={`size-1.5 rounded-full shrink-0 ${lesson.sparkStatus === "in-progress" ? "bg-sky-400" : "bg-amber-400"}`} />
      <span className="flex-1 text-[13px] text-foreground/80 truncate">{lesson.title}</span>
      {lesson.course && (
        <span className="text-[10px] text-muted shrink-0">{lesson.course}</span>
      )}
      {lesson.needToBuyCount > 0 && (
        <span className="text-[9px] text-rose-500 font-medium shrink-0">{lesson.needToBuyCount} to buy</span>
      )}
    </Link>
  );
}

function DraftRow({ draft }: { draft: WeeklyDraft }) {
  return (
    <Link
      href="/communications"
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-raised/50 transition-colors"
    >
      <span className={`size-1.5 rounded-full shrink-0 ${draft.status === "ready" ? "bg-emerald-400" : "bg-amber-400"}`} />
      <span className="flex-1 text-[13px] text-foreground/80 truncate">{draft.subject}</span>
      <span className="text-[10px] text-muted shrink-0">{draft.status}</span>
    </Link>
  );
}

function AdminLifeRow({
  title,
  category,
  type,
  status,
}: {
  title: string;
  category: string;
  type: "admin" | "life";
  status: string;
}) {
  const href = type === "admin" ? "/admin" : "/life";
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-raised/50 transition-colors"
    >
      <span className={`size-1.5 rounded-full shrink-0 ${status === "in_progress" ? "bg-sky-400" : "bg-gray-300"}`} />
      <span className="flex-1 text-[13px] text-foreground/80 truncate">{title}</span>
      <span className="text-[10px] text-muted shrink-0">{category}</span>
      <span className={`text-[9px] shrink-0 ${type === "admin" ? "text-muted" : "text-violet-500"}`}>
        {type}
      </span>
    </Link>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

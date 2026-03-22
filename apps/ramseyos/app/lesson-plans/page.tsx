"use client";

import { useEffect, useMemo, useState } from "react";
import { getLessonPlans, type LessonPlan } from "@/lib/lesson-plans";
import Link from "next/link";

function groupByCourse(plans: LessonPlan[]): Map<string, LessonPlan[]> {
  const groups = new Map<string, LessonPlan[]>();
  for (const plan of plans) {
    const key = plan.course?.trim() || "Unassigned";
    const list = groups.get(key) ?? [];
    list.push(plan);
    groups.set(key, list);
  }
  // Sort keys alphabetically, but push "Unassigned" to the end
  const sorted = new Map<string, LessonPlan[]>();
  const keys = [...groups.keys()].sort((a, b) => {
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    return a.localeCompare(b);
  });
  for (const k of keys) sorted.set(k, groups.get(k)!);
  return sorted;
}

export default function LessonPlansPage() {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLessonPlans().then((p) => {
      setPlans(p);
      setLoading(false);
    });
  }, []);

  const grouped = useMemo(() => groupByCourse(plans), [plans]);

  return (
    <div className="max-w-5xl px-4 sm:px-8 pt-10 pb-20">
      {/* Header */}
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-xl font-normal text-foreground mt-2">
          Lesson Plans
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Browse and open lessons by course.
        </p>
      </header>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-2 py-12">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-sm text-muted/60">Loading lesson plans…</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-surface p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted/30 mb-4">
            <rect x="3" y="1" width="10" height="14" rx="1.5" />
            <path d="M5.5 5h5M5.5 8h3" />
          </svg>
          <p className="text-sm text-muted">
            No lesson plans yet
          </p>
          <p className="text-[12px] text-muted/40 mt-1">
            Lessons you create will be organized here by course.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {[...grouped.entries()].map(([course, coursePlans]) => (
            <section key={course}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {course}
                </h2>
                <span className="text-[10px] tabular-nums text-muted/40">
                  {coursePlans.length} lesson{coursePlans.length !== 1 ? "s" : ""}
                </span>
                <div className="flex-1 border-t border-border/40" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {coursePlans.map((plan) => (
                  <LessonPlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function LessonPlanCard({ plan }: { plan: LessonPlan }) {
  const hasDescription = plan.description && plan.description.trim().length > 0;

  return (
    <Link
      href={`/lesson-plans/${plan.id}`}
      className="group flex flex-col bg-surface rounded-xl border border-border/60 p-4 transition-all hover:border-border-strong hover:bg-surface-raised/30"
    >
      <h3 className="text-[13px] font-medium text-foreground/90 group-hover:text-foreground transition-colors leading-snug">
        {plan.title || "Untitled lesson"}
      </h3>

      {hasDescription && (
        <p className="text-[12px] text-muted/60 leading-relaxed line-clamp-2 mt-1.5">
          {plan.description}
        </p>
      )}

      {plan.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {plan.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted/50 font-medium"
            >
              {tag}
            </span>
          ))}
          {plan.tags.length > 4 && (
            <span className="text-[9px] text-muted/30">+{plan.tags.length - 4}</span>
          )}
        </div>
      )}
    </Link>
  );
}

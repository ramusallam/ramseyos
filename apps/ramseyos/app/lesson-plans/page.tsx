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
    <div className="max-w-4xl px-8 pt-10 pb-20">
      {/* Header */}
      <header className="mb-8">
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
          Design and organize lessons across courses.
        </p>
      </header>

      {/* Content */}
      {loading ? (
        <p className="text-sm text-muted/60">Loading...</p>
      ) : plans.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 shadow-card text-center">
          <p className="text-sm text-muted">
            No lesson plans yet.
          </p>
          <p className="text-[12px] text-muted/50 mt-1">
            Lesson plans created in RamseyOS will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {[...grouped.entries()].map(([course, coursePlans]) => (
            <section key={course}>
              <h2 className="text-[13px] font-semibold text-foreground/70 uppercase tracking-wider mb-3">
                {course}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
  return (
    <Link
      href={`/lesson-plans/${plan.id}`}
      className="group block bg-surface rounded-xl border border-border p-5 shadow-card transition-all hover:shadow-card-hover hover:border-border-strong"
    >
      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-sky-50 text-sky-600">
        {plan.course}
      </span>
      <h3 className="text-[14px] font-medium text-foreground/90 mt-3 mb-1 group-hover:text-foreground transition-colors">
        {plan.title}
      </h3>
      <p className="text-[12px] text-muted leading-relaxed line-clamp-2">
        {plan.description}
      </p>
      {plan.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {plan.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded bg-gray-50 text-muted/70 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

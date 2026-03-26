"use client";

import { useEffect, useMemo, useState } from "react";
import { getLessonPlans, type LessonPlan, type SparkStatus } from "@/lib/lesson-plans";
import Link from "next/link";

/* ── Style maps ── */

const SPARK_DOT: Record<SparkStatus, { dot: string; label: string }> = {
  "not-started": { dot: "bg-muted/25", label: "" },
  "in-progress": { dot: "bg-amber-400", label: "Spark: building" },
  deployed: { dot: "bg-emerald-400", label: "Spark: live" },
};

/* ── Helpers ── */

function groupByCourse(plans: LessonPlan[]): Map<string, LessonPlan[]> {
  const groups = new Map<string, LessonPlan[]>();
  for (const plan of plans) {
    const key = plan.course?.trim() || "Unassigned";
    const list = groups.get(key) ?? [];
    list.push(plan);
    groups.set(key, list);
  }
  const sorted = new Map<string, LessonPlan[]>();
  const keys = [...groups.keys()].sort((a, b) => {
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    return a.localeCompare(b);
  });
  for (const k of keys) sorted.set(k, groups.get(k)!);
  return sorted;
}

function formatLastTaught(plan: LessonPlan): string | null {
  if (!plan.lastTaughtAt) return null;
  return plan.lastTaughtAt.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ── Page ── */

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
  const courseCount = useMemo(() => {
    const names = new Set(plans.map((p) => p.course?.trim()).filter(Boolean));
    return names.size;
  }, [plans]);

  const sparkCount = plans.filter((p) => p.sparkStatus !== "not-started").length;
  const materialsCount = plans.reduce((sum, p) => sum + (p.materials?.length ?? 0), 0);
  const reflectionCount = plans.filter((p) => p.reflection?.trim()).length;

  if (loading) {
    return (
      <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading lesson plans…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* ── Header ── */}
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">
          Lesson Plans
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          Browse and open lessons by course.
        </p>

        {/* Stat bar */}
        {plans.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
            <span className="tabular-nums">{plans.length} lesson{plans.length !== 1 ? "s" : ""}</span>
            {courseCount > 0 && (
              <span className="tabular-nums">{courseCount} course{courseCount !== 1 ? "s" : ""}</span>
            )}
            {sparkCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span className="tabular-nums">{sparkCount} with Spark</span>
              </span>
            )}
            {materialsCount > 0 && (
              <span className="tabular-nums">{materialsCount} material{materialsCount !== 1 ? "s" : ""}</span>
            )}
            {reflectionCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-violet-400" />
                <span className="tabular-nums">{reflectionCount} reflected</span>
              </span>
            )}
          </div>
        )}

        {/* Cross-links */}
        <div className="flex items-center gap-3 mt-3">
          {materialsCount > 0 && (
            <Link href="/materials" className="text-[11px] text-muted hover:text-muted/60 transition-colors">
              Materials &rarr;
            </Link>
          )}
          <Link href="/tools" className="text-[11px] text-muted hover:text-muted/60 transition-colors">
            Tools &rarr;
          </Link>
          <Link href="/communications" className="text-[11px] text-muted hover:text-muted/60 transition-colors">
            Comms &rarr;
          </Link>
          {sparkCount > 0 && (
            <a href="https://sparklearningstudio.ai" target="_blank" rel="noopener noreferrer" className="text-[11px] text-amber-400/40 hover:text-amber-400/70 transition-colors font-medium">
              Spark ↗
            </a>
          )}
        </div>
      </header>

      {/* ── Empty ── */}
      {plans.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface backdrop-blur-sm p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted mb-4">
            <rect x="3" y="1" width="10" height="14" rx="1.5" />
            <path d="M5.5 5h5M5.5 8h3" />
          </svg>
          <p className="text-sm text-muted/60 font-medium">No lesson plans yet</p>
          <p className="text-[12px] text-muted mt-1">
            Lessons you create will be organized here by course.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {[...grouped.entries()].map(([course, coursePlans]) => {
            const isUnassigned = course === "Unassigned";
            const courseSparkActive = coursePlans.filter((p) => p.sparkStatus !== "not-started").length;
            const courseMaterialsCount = coursePlans.reduce((s, p) => s + (p.materials?.length ?? 0), 0);

            return (
              <section key={course}>
                {/* Course section header */}
                <div className="flex items-center gap-2 mb-4">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={isUnassigned ? "text-muted" : "text-muted"}>
                    <rect x="3" y="1" width="10" height="14" rx="1.5" />
                    <path d="M5.5 5h5M5.5 8h3" />
                  </svg>
                  <h2 className={`text-[11px] font-semibold uppercase tracking-wider ${isUnassigned ? "text-muted" : "text-muted"}`}>
                    {course}
                  </h2>
                  <span className="text-[10px] tabular-nums text-muted">
                    {coursePlans.length}
                  </span>
                  {courseSparkActive > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400/60">
                      <span className="size-1 rounded-full bg-amber-400" />
                      {courseSparkActive} Spark
                    </span>
                  )}
                  {courseMaterialsCount > 0 && (
                    <span className="text-[10px] text-muted tabular-nums">
                      {courseMaterialsCount} mat.
                    </span>
                  )}
                  <div className="flex-1 border-t border-border" />
                </div>

                {/* Lesson cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {coursePlans.map((plan) => (
                    <LessonPlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Lesson Plan Card ── */

function LessonPlanCard({ plan }: { plan: LessonPlan }) {
  const hasDescription = plan.description && plan.description.trim().length > 0;
  const hasReflection = plan.reflection && plan.reflection.trim().length > 0;
  const spark = SPARK_DOT[plan.sparkStatus];
  const materialsLen = plan.materials?.length ?? 0;
  const needToBuy = plan.materials?.filter((m) => m.needToBuy).length ?? 0;
  const lastTaught = formatLastTaught(plan);

  return (
    <Link
      href={`/lesson-plans/${plan.id}`}
      className="group flex flex-col rounded-xl border border-border bg-surface backdrop-blur-sm p-4 transition-all hover:border-border-strong hover:bg-surface-raised/30 hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Title + Spark dot */}
      <div className="flex items-start gap-2">
        <h3 className="flex-1 text-[13px] font-medium text-foreground/90 group-hover:text-foreground transition-colors leading-snug">
          {plan.title || "Untitled lesson"}
        </h3>
        {plan.sparkStatus !== "not-started" && (
          <span
            className={`size-2 shrink-0 rounded-full mt-1 ${spark.dot}`}
            title={spark.label}
          />
        )}
      </div>

      {hasDescription && (
        <p className="text-[12px] text-muted/50 leading-relaxed line-clamp-2 mt-1.5">
          {plan.description}
        </p>
      )}

      {/* Tags */}
      {plan.tags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          {plan.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted/45 font-medium"
            >
              {tag}
            </span>
          ))}
          {plan.tags.length > 3 && (
            <span className="text-[9px] text-muted">+{plan.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: metadata */}
      <div className="mt-auto pt-3 flex items-center gap-2 flex-wrap">
        {/* Last taught date */}
        {lastTaught && (
          <span className="text-[9px] text-muted">
            taught {lastTaught}
          </span>
        )}

        {/* Reflection indicator */}
        {hasReflection && (
          <span className="flex items-center gap-0.5">
            <span className="size-1 rounded-full bg-violet-400/50" />
            <span className="text-[9px] text-violet-400/50">reflected</span>
          </span>
        )}

        <div className="flex-1" />

        {/* Materials */}
        {materialsLen > 0 && (
          <span className="text-[9px] text-muted tabular-nums">
            {materialsLen} mat.
          </span>
        )}
        {needToBuy > 0 && (
          <span className="text-[9px] text-rose-400/60 tabular-nums font-medium">
            {needToBuy} to buy
          </span>
        )}

        {/* Spark status label */}
        {plan.sparkStatus === "in-progress" && (
          <span className="text-[9px] text-amber-400/60 font-medium">Spark</span>
        )}
        {plan.sparkStatus === "deployed" && (
          <span className="text-[9px] text-emerald-400/60 font-medium">Spark live</span>
        )}
      </div>
    </Link>
  );
}

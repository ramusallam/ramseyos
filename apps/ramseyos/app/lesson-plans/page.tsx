"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  getLessonPlans,
  createLessonPlan,
  type LessonPlan,
  type LessonStatus,
  type SparkStatus,
} from "@/lib/lesson-plans";
import { getAllUnits, type Unit } from "@/lib/units";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ── Constants ── */

const SPARK_DOT: Record<SparkStatus, { dot: string; label: string }> = {
  "not-started": { dot: "bg-muted/25", label: "" },
  "in-progress": { dot: "bg-amber-400", label: "Spark: building" },
  deployed: { dot: "bg-emerald-400", label: "Spark: live" },
};

const STATUS_BADGE: Record<LessonStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-zinc-100", text: "text-zinc-500", label: "Draft" },
  ready: { bg: "bg-blue-50", text: "text-blue-600", label: "Ready" },
  taught: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Taught" },
  revised: { bg: "bg-amber-50", text: "text-amber-600", label: "Revised" },
  archived: { bg: "bg-zinc-50", text: "text-zinc-400", label: "Archived" },
};

const STATUS_FILTERS: { value: LessonStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "ready", label: "Ready" },
  { value: "taught", label: "Taught" },
  { value: "revised", label: "Revised" },
];

/* ── Helpers ── */

function groupByCourse(
  plans: LessonPlan[],
  units: Unit[]
): Map<string, { unit: Unit | null; plans: LessonPlan[] }[]> {
  const courseGroups = new Map<string, LessonPlan[]>();
  for (const plan of plans) {
    const key = plan.course?.trim() || "Unassigned";
    const list = courseGroups.get(key) ?? [];
    list.push(plan);
    courseGroups.set(key, list);
  }

  const result = new Map<string, { unit: Unit | null; plans: LessonPlan[] }[]>();
  const sortedCourses = [...courseGroups.keys()].sort((a, b) => {
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    return a.localeCompare(b);
  });

  for (const course of sortedCourses) {
    const coursePlans = courseGroups.get(course)!;
    const courseUnits = units.filter((u) => u.course === course);
    const unitGroups: { unit: Unit | null; plans: LessonPlan[] }[] = [];

    if (courseUnits.length > 0) {
      for (const unit of courseUnits) {
        const unitPlans = coursePlans.filter((p) => p.unitId === unit.id);
        if (unitPlans.length > 0) {
          unitGroups.push({ unit, plans: unitPlans });
        }
      }
      const unassigned = coursePlans.filter(
        (p) => !p.unitId || !courseUnits.some((u) => u.id === p.unitId)
      );
      if (unassigned.length > 0) {
        unitGroups.push({ unit: null, plans: unassigned });
      }
    } else {
      unitGroups.push({ unit: null, plans: coursePlans });
    }

    result.set(course, unitGroups);
  }

  return result;
}

/* ── Page ── */

export default function LessonPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<LessonStatus | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([getLessonPlans(), getAllUnits()]).then(([p, u]) => {
      setPlans(p);
      setUnits(u);
      setLoading(false);
    });
  }, []);

  const filteredPlans = useMemo(() => {
    let result = plans;
    if (!showArchived) {
      result = result.filter((p) => p.status !== "archived");
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    return result;
  }, [plans, statusFilter, showArchived]);

  const grouped = useMemo(() => groupByCourse(filteredPlans, units), [filteredPlans, units]);

  const stats = useMemo(() => {
    const active = plans.filter((p) => p.status !== "archived");
    return {
      total: active.length,
      courses: new Set(active.map((p) => p.course?.trim()).filter(Boolean)).size,
      spark: active.filter((p) => p.sparkStatus !== "not-started").length,
      archived: plans.filter((p) => p.status === "archived").length,
    };
  }, [plans]);

  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const id = await createLessonPlan({ title: "Untitled lesson" });
      router.push(`/lesson-plans/${id}`);
    } catch {
      setCreating(false);
    }
  }, [router]);

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
      <header className="mb-8">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <div className="flex items-center gap-4 mt-2">
          <h1 className="text-[20px] font-semibold text-foreground tracking-tight">
            Lesson Plans
          </h1>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="ml-auto text-[12px] font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
          >
            {creating ? "Creating…" : "+ New lesson"}
          </button>
        </div>
        <p className="text-[13px] text-muted/50 mt-1">
          Browse, filter, and open lessons by course and unit.
        </p>

        {/* Stats */}
        {stats.total > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
            <span className="tabular-nums">{stats.total} lesson{stats.total !== 1 ? "s" : ""}</span>
            {stats.courses > 0 && (
              <span className="tabular-nums">{stats.courses} course{stats.courses !== 1 ? "s" : ""}</span>
            )}
            {stats.spark > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span className="tabular-nums">{stats.spark} with Spark</span>
              </span>
            )}
            {stats.archived > 0 && (
              <span className="tabular-nums text-muted/40">{stats.archived} archived</span>
            )}
          </div>
        )}

        {/* Cross-links */}
        <div className="flex items-center gap-3 mt-3">
          <Link href="/rubrics" className="text-[11px] text-muted hover:text-accent transition-colors">
            Rubrics &rarr;
          </Link>
          <Link href="/grading" className="text-[11px] text-muted hover:text-accent transition-colors">
            Grading &rarr;
          </Link>
          <Link href="/materials" className="text-[11px] text-muted hover:text-accent transition-colors">
            Materials &rarr;
          </Link>
          <a href="https://sparklearningstudio.ai" target="_blank" rel="noopener noreferrer" className="text-[11px] text-amber-500/50 hover:text-amber-500/80 transition-colors font-medium">
            Spark ↗
          </a>
        </div>
      </header>

      {/* ── Filters ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`text-[11px] px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === f.value
                ? "bg-accent text-white font-semibold"
                : "bg-surface border border-border text-muted hover:text-foreground hover:border-border-strong"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowArchived(!showArchived)}
          className={`text-[11px] px-3 py-1.5 rounded-lg transition-colors ${
            showArchived
              ? "bg-zinc-100 text-zinc-600 font-medium"
              : "text-muted/50 hover:text-muted"
          }`}
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </button>
      </div>

      {/* ── Empty ── */}
      {filteredPlans.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted mb-4">
            <rect x="3" y="1" width="10" height="14" rx="1.5" />
            <path d="M5.5 5h5M5.5 8h3" />
          </svg>
          <p className="text-sm text-muted/60 font-medium">
            {statusFilter !== "all" ? `No ${statusFilter} lessons` : "No lesson plans yet"}
          </p>
          <p className="text-[12px] text-muted mt-1">
            {statusFilter !== "all"
              ? "Try a different filter or create a new lesson."
              : "Create your first lesson to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {[...grouped.entries()].map(([course, unitGroups]) => {
            const isUnassigned = course === "Unassigned";
            const courseTotal = unitGroups.reduce((s, g) => s + g.plans.length, 0);

            return (
              <section key={course}>
                {/* Course header */}
                <div className="flex items-center gap-2 mb-4">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                    <rect x="3" y="1" width="10" height="14" rx="1.5" />
                    <path d="M5.5 5h5M5.5 8h3" />
                  </svg>
                  <h2 className={`text-[11px] font-semibold uppercase tracking-wider ${isUnassigned ? "text-muted/50" : "text-muted"}`}>
                    {course}
                  </h2>
                  <span className="text-[10px] tabular-nums text-muted">{courseTotal}</span>
                  <div className="flex-1 border-t border-border" />
                </div>

                {/* Unit groups */}
                <div className="space-y-6">
                  {unitGroups.map((group, gi) => (
                    <div key={group.unit?.id ?? `no-unit-${gi}`}>
                      {group.unit && (
                        <div className="flex items-center gap-2 mb-3 ml-1">
                          <span className="text-[10px] text-muted/60 font-medium">
                            Unit {group.unit.orderIndex + 1}:
                          </span>
                          <span className="text-[11px] text-foreground/60 font-medium">
                            {group.unit.title}
                          </span>
                          <span className="text-[10px] text-muted tabular-nums">
                            {group.plans.length}
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.plans.map((plan) => (
                          <LessonPlanCard key={plan.id} plan={plan} />
                        ))}
                      </div>
                    </div>
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
  const hasContent = plan.objective || plan.warmUp || plan.activities || plan.description?.trim();
  const spark = SPARK_DOT[plan.sparkStatus];
  const statusBadge = STATUS_BADGE[plan.status];
  const materialsLen = plan.materials?.length ?? 0;
  const rubricCount = plan.rubricIds?.length ?? 0;
  const taughtCount = plan.taughtDates?.length ?? 0;

  return (
    <Link
      href={`/lesson-plans/${plan.id}`}
      className={`group flex flex-col rounded-xl border border-border bg-surface p-4 transition-all hover:border-border-strong hover:bg-surface-raised/30 hover:shadow-[var(--shadow-card-hover)] ${
        plan.status === "archived" ? "opacity-60" : ""
      }`}
    >
      {/* Title + status */}
      <div className="flex items-start gap-2">
        <h3 className="flex-1 text-[13px] font-medium text-foreground/90 group-hover:text-foreground transition-colors leading-snug">
          {plan.title || "Untitled lesson"}
        </h3>
        <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded font-medium ${statusBadge.bg} ${statusBadge.text}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Preview */}
      {hasContent && (
        <p className="text-[12px] text-muted/50 leading-relaxed line-clamp-2 mt-1.5">
          {plan.objective || plan.description}
        </p>
      )}

      {/* Tags */}
      {plan.tags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          {plan.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 text-muted font-medium"
            >
              {tag}
            </span>
          ))}
          {plan.tags.length > 3 && (
            <span className="text-[9px] text-muted">+{plan.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-3 flex items-center gap-2 flex-wrap">
        {taughtCount > 0 && (
          <span className="text-[9px] text-muted tabular-nums">
            taught {taughtCount}x
          </span>
        )}
        {rubricCount > 0 && (
          <span className="text-[9px] text-muted tabular-nums">
            {rubricCount} rubric{rubricCount !== 1 ? "s" : ""}
          </span>
        )}
        <div className="flex-1" />
        {materialsLen > 0 && (
          <span className="text-[9px] text-muted tabular-nums">
            {materialsLen} mat.
          </span>
        )}
        {plan.sparkStatus !== "not-started" && (
          <span className={`size-2 shrink-0 rounded-full ${spark.dot}`} title={spark.label} />
        )}
      </div>
    </Link>
  );
}

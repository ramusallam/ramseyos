"use client";

import { useEffect, useState } from "react";
import { getLessonPlans, type LessonPlan } from "@/lib/lesson-plans";
import Link from "next/link";

export default function LessonPlansPage() {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLessonPlans().then((p) => {
      setPlans(p);
      setLoading(false);
    });
  }, []);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <LessonPlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonPlanCard({ plan }: { plan: LessonPlan }) {
  return (
    <div className="group bg-surface rounded-xl border border-border p-5 shadow-card transition-all hover:shadow-card-hover hover:border-border-strong">
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
    </div>
  );
}

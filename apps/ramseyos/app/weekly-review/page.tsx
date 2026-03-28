"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/shared";
import {
  getWeeklyReviews,
  createWeeklyReview,
  updateWeeklyReview,
  getCurrentWeekMonday,
  formatWeekLabel,
  type WeeklyReview,
} from "@/lib/weekly-review";
import { requestAI } from "@/lib/ai/client";
import Link from "next/link";

/* ── Types ── */

interface WeekStats {
  tasksDone: number;
  lessonsTaught: number;
  gradingApproved: number;
  capturesTotal: number;
}

interface StaleProject {
  id: string;
  title: string;
  daysSinceUpdate: number;
}

/* ── Page ── */

export default function WeeklyReviewPage() {
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [pastReviews, setPastReviews] = useState<WeeklyReview[]>([]);
  const [stats, setStats] = useState<WeekStats | null>(null);
  const [staleProjects, setStaleProjects] = useState<StaleProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pastExpanded, setPastExpanded] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsExpanded, setAiInsightsExpanded] = useState(true);

  const weekMonday = getCurrentWeekMonday();
  const weekLabel = formatWeekLabel(weekMonday);

  // Load data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [allReviews, fetchedStats, fetchedStale] = await Promise.all([
          getWeeklyReviews(),
          fetchWeekStats(),
          fetchStaleProjects(),
        ]);

        if (cancelled) return;

        // Find or create the current week review
        let current = allReviews.find((r) => r.weekOf === weekMonday) ?? null;
        if (!current) {
          const id = await createWeeklyReview(weekMonday);
          current = {
            id,
            weekOf: weekMonday,
            wins: "",
            challenges: "",
            lessonsLearned: "",
            nextWeekPriorities: "",
            energyLevel: null,
            overallRating: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }

        setReview(current);
        setPastReviews(allReviews.filter((r) => r.weekOf !== weekMonday));
        setStats(fetchedStats);
        setStaleProjects(fetchedStale);
      } catch (err) {
        console.error("Weekly review load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [weekMonday]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!review) return;
    setSaving(true);
    try {
      await updateWeeklyReview(review.id, {
        wins: review.wins,
        challenges: review.challenges,
        lessonsLearned: review.lessonsLearned,
        nextWeekPriorities: review.nextWeekPriorities,
        energyLevel: review.energyLevel,
        overallRating: review.overallRating,
      });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }, [review]);

  // Field updater (local state only — saved on explicit save)
  function updateField<K extends keyof WeeklyReview>(key: K, value: WeeklyReview[K]) {
    setReview((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const handleAiInsights = useCallback(async () => {
    if (!stats) return;
    setAiInsightsLoading(true);
    setAiInsights(null);
    try {
      const response = await requestAI({
        templateId: "weekly-reflection-assist",
        variables: {
          tasksCompleted: String(stats.tasksDone),
          lessonsTaught: String(stats.lessonsTaught),
          gradingCompleted: String(stats.gradingApproved),
          dailyReflections: "Not yet available",
          energyTrend: "Not yet tracked",
          currentPriorities: "Not yet specified",
        },
      });
      // Try to parse JSON response into readable text
      let displayText = response.text;
      try {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const parts: string[] = [];
          if (parsed.summary) parts.push(parsed.summary);
          if (parsed.patterns?.length) parts.push("\nPatterns:\n" + parsed.patterns.map((p: string) => `  - ${p}`).join("\n"));
          if (parsed.reflectionPrompts?.length) parts.push("\nReflection prompts:\n" + parsed.reflectionPrompts.map((p: string) => `  - ${p}`).join("\n"));
          if (parsed.suggestedFocus) parts.push("\nSuggested focus: " + parsed.suggestedFocus);
          if (parts.length > 0) displayText = parts.join("\n");
        }
      } catch {
        // Use raw text if JSON parsing fails
      }
      setAiInsights(displayText);
      setAiInsightsExpanded(true);
    } catch (err) {
      console.error("AI insights error:", err);
      setAiInsights("Unable to generate insights right now. Try again later.");
    } finally {
      setAiInsightsLoading(false);
    }
  }, [stats]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading weekly review…</span>
        </div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* ── Header ── */}
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
          aria-label="Back to Today"
        >
          &larr; Today
        </Link>
        <h1 className="text-[22px] font-semibold text-foreground tracking-tight mt-2">
          Weekly Review
        </h1>
        <p className="text-[13px] text-muted mt-1">{weekLabel}</p>

        {/* Cross-links */}
        <div className="flex flex-wrap gap-3 mt-3">
          <Link
            href="/tasks"
            className="text-[11px] text-accent hover:text-accent/80 transition-colors font-medium"
            aria-label="Go to Tasks"
          >
            Tasks &rarr;
          </Link>
          <Link
            href="/projects"
            className="text-[11px] text-accent hover:text-accent/80 transition-colors font-medium"
            aria-label="Go to Projects"
          >
            Projects &rarr;
          </Link>
          <Link
            href="/lesson-plans"
            className="text-[11px] text-accent hover:text-accent/80 transition-colors font-medium"
            aria-label="Go to Lesson Plans"
          >
            Lesson Plans &rarr;
          </Link>
          <Link
            href="/week"
            className="text-[11px] text-accent hover:text-accent/80 transition-colors font-medium"
            aria-label="Go to Week View"
          >
            Week View &rarr;
          </Link>
        </div>
      </header>

      <div className="space-y-8">
        {/* ── Week Stats ── */}
        {stats && (
          <ReviewSection icon="M2 2h4v12H2zM6 6h4v8H6zM10 4h4v10h-4z" label="Week stats">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Tasks done" value={stats.tasksDone} color="bg-emerald-500" />
              <StatCard label="Lessons taught" value={stats.lessonsTaught} color="bg-sky-500" />
              <StatCard label="Grading approved" value={stats.gradingApproved} color="bg-violet-500" />
              <StatCard label="Captures" value={stats.capturesTotal} color="bg-amber-500" />
            </div>
          </ReviewSection>
        )}

        {/* ── AI Insights ── */}
        {stats && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-violet-400/60"
              >
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M3.5 12.5l1.5-1.5M11 5l1.5-1.5" />
              </svg>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                AI Insights
              </h2>
              <button
                type="button"
                onClick={handleAiInsights}
                disabled={aiInsightsLoading}
                aria-label="Generate AI insights from week stats"
                className="text-[9px] font-medium text-violet-400/80 bg-violet-500/10 border border-violet-400/15 rounded-md px-2 py-0.5 hover:bg-violet-500/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {aiInsightsLoading ? (
                  <>
                    <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
                    Thinking...
                  </>
                ) : (
                  "Generate"
                )}
              </button>
              <div className="flex-1 border-t border-border" />
            </div>

            {aiInsights && (
              <div className="rounded-xl border border-violet-400/15 bg-violet-500/[0.04] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAiInsightsExpanded(!aiInsightsExpanded)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-violet-500/[0.06] transition-colors"
                  aria-label={aiInsightsExpanded ? "Collapse AI insights" : "Expand AI insights"}
                >
                  <span className="size-1.5 rounded-full bg-violet-400/60 shrink-0" />
                  <span className="text-[10px] font-medium text-violet-400/70 flex-1">
                    AI-generated suggestions
                  </span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={`text-muted transition-transform ${aiInsightsExpanded ? "rotate-180" : ""}`}
                  >
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </button>
                {aiInsightsExpanded && (
                  <div className="px-4 pb-4 pt-1">
                    <p className="text-[12px] text-foreground/65 leading-relaxed whitespace-pre-line">
                      {aiInsights}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Stale Alerts ── */}
        {staleProjects.length > 0 && (
          <ReviewSection icon="M8 1v2M8 13v2M1 8h2M13 8h2" label="Stale alerts" count={staleProjects.length}>
            <div className="space-y-2">
              {staleProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 hover:bg-amber-50 transition-colors"
                  aria-label={`Stale project: ${p.title}, ${p.daysSinceUpdate} days since last update`}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0">
                    <path d="M8 1L1 14h14L8 1zM8 6v4M8 12h0" />
                  </svg>
                  <span className="flex-1 text-[13px] text-foreground/80 truncate">{p.title}</span>
                  <span className="text-[10px] text-amber-600 font-medium shrink-0">
                    {p.daysSinceUpdate}d stale
                  </span>
                </Link>
              ))}
            </div>
          </ReviewSection>
        )}

        {/* ── Reflection Form ── */}
        {review && (
          <ReviewSection icon="M3 2.5h10a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1z" label="Reflection">
            <div className="space-y-5">
              <ReflectionField
                label="Wins"
                placeholder="What went well this week?"
                value={review.wins}
                onChange={(v) => updateField("wins", v)}
              />
              <ReflectionField
                label="Challenges"
                placeholder="What was difficult?"
                value={review.challenges}
                onChange={(v) => updateField("challenges", v)}
              />
              <ReflectionField
                label="Lessons learned"
                placeholder="What would you do differently?"
                value={review.lessonsLearned}
                onChange={(v) => updateField("lessonsLearned", v)}
              />
              <ReflectionField
                label="Next week priorities"
                placeholder="Top priorities for next week"
                value={review.nextWeekPriorities}
                onChange={(v) => updateField("nextWeekPriorities", v)}
              />

              {/* Energy Level */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-2">
                  Energy level
                </label>
                <div className="flex gap-2">
                  {(["high", "medium", "low"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateField("energyLevel", review.energyLevel === level ? null : level)}
                      className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                        review.energyLevel === level
                          ? level === "high"
                            ? "bg-emerald-500 text-white"
                            : level === "medium"
                              ? "bg-amber-500 text-white"
                              : "bg-rose-500 text-white"
                          : "bg-surface border border-border text-muted hover:text-foreground"
                      }`}
                      aria-label={`Energy level: ${level}`}
                      aria-pressed={review.energyLevel === level}
                    >
                      {level === "high" ? "High" : level === "medium" ? "Medium" : "Low"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Overall Rating */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-2">
                  Overall rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateField("overallRating", review.overallRating === star ? null : star)}
                      className="p-1 transition-colors"
                      aria-label={`Rate ${star} out of 5 stars`}
                      aria-pressed={review.overallRating !== null && review.overallRating >= star}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={review.overallRating !== null && review.overallRating >= star ? "#e67e22" : "none"}
                        stroke={review.overallRating !== null && review.overallRating >= star ? "#e67e22" : "currentColor"}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={review.overallRating !== null && review.overallRating >= star ? "text-accent" : "text-muted hover:text-foreground/60"}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-accent text-white text-[13px] font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                  aria-label="Save weekly review"
                >
                  {saving ? "Saving…" : "Save review"}
                </button>
              </div>
            </div>
          </ReviewSection>
        )}

        {/* ── Past Reviews ── */}
        {pastReviews.length > 0 && (
          <ReviewSection icon="M2 3h12v11H2zM2 7h12" label="Past reviews" count={pastReviews.length}>
            <button
              type="button"
              onClick={() => setPastExpanded(!pastExpanded)}
              className="text-[12px] text-accent hover:text-accent/80 transition-colors font-medium mb-3"
              aria-label={pastExpanded ? "Collapse past reviews" : "Expand past reviews"}
              aria-expanded={pastExpanded}
            >
              {pastExpanded ? "Collapse" : `Show ${pastReviews.length} past review${pastReviews.length === 1 ? "" : "s"}`}
            </button>
            {pastExpanded && (
              <div className="space-y-3">
                {pastReviews.map((r) => (
                  <PastReviewCard key={r.id} review={r} />
                ))}
              </div>
            )}
          </ReviewSection>
        )}
      </div>
    </div>
  );
}

/* ── Data Fetchers ── */

async function fetchWeekStats(): Promise<WeekStats> {
  const [taskSnap, lessonSnap, gradingSnap, captureSnap] = await Promise.all([
    getDocs(query(collection(db, "tasks"), where("status", "==", "done"))),
    getDocs(query(collection(db, "lessonPlans"), where("status", "==", "taught"))),
    getDocs(query(collection(db, "gradingJobs"), where("status", "==", "approved"))),
    getDocs(collection(db, "captures")),
  ]);

  return {
    tasksDone: taskSnap.size,
    lessonsTaught: lessonSnap.size,
    gradingApproved: gradingSnap.size,
    capturesTotal: captureSnap.size,
  };
}

async function fetchStaleProjects(): Promise<StaleProject[]> {
  const snap = await getDocs(
    query(collection(db, "projects"), where("status", "==", "active")),
  );

  const now = new Date();
  const stale: StaleProject[] = [];

  for (const d of snap.docs) {
    const updatedAt = toDate(d.data().updatedAt);
    if (!updatedAt) continue;

    const diffMs = now.getTime() - updatedAt.getTime();
    const daysSinceUpdate = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysSinceUpdate >= 7) {
      stale.push({
        id: d.id,
        title: d.data().title ?? "Untitled",
        daysSinceUpdate,
      });
    }
  }

  return stale.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
}

/* ── Components ── */

function ReviewSection({
  icon,
  label,
  count,
  children,
}: {
  icon: string;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted"
        >
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
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2 mb-2">
        <span className={`size-2 rounded-full ${color}`} />
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
          {label}
        </span>
      </div>
      <p className="text-[20px] font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

function ReflectionField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-1.5">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-[13px] text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 resize-y transition-colors"
        aria-label={label}
      />
    </div>
  );
}

function PastReviewCard({ review }: { review: WeeklyReview }) {
  const label = formatWeekLabel(review.weekOf);
  const energyColors: Record<string, string> = {
    high: "bg-emerald-50 text-emerald-600",
    medium: "bg-amber-50 text-amber-600",
    low: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-medium text-foreground">{label}</span>
        {review.energyLevel && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${energyColors[review.energyLevel] ?? ""}`}>
            {review.energyLevel}
          </span>
        )}
        {review.overallRating !== null && (
          <span className="text-[10px] text-muted ml-auto">
            {"★".repeat(review.overallRating)}{"☆".repeat(5 - review.overallRating)}
          </span>
        )}
      </div>
      {review.wins && (
        <div className="mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Wins</span>
          <p className="text-[12px] text-foreground/70 mt-0.5">{review.wins}</p>
        </div>
      )}
      {review.challenges && (
        <div className="mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Challenges</span>
          <p className="text-[12px] text-foreground/70 mt-0.5">{review.challenges}</p>
        </div>
      )}
      {review.lessonsLearned && (
        <div className="mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Lessons</span>
          <p className="text-[12px] text-foreground/70 mt-0.5">{review.lessonsLearned}</p>
        </div>
      )}
      {review.nextWeekPriorities && (
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Next week</span>
          <p className="text-[12px] text-foreground/70 mt-0.5">{review.nextWeekPriorities}</p>
        </div>
      )}
    </div>
  );
}

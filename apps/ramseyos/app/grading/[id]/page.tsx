"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getGradingJob,
  updateGradingJob,
  approveGradingJob,
  markAnalyzing,
  markForReview,
  markFailed,
  type GradingJob,
  type GradingJobStatus,
  type CriterionScore,
} from "@/lib/grading-jobs";
import { getRubric, type Rubric } from "@/lib/rubrics";
import { runGradingAnalysis } from "@/lib/grading-ai";
import Link from "next/link";

const STATUS_BADGE: Record<GradingJobStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-zinc-100", text: "text-zinc-500", label: "Pending" },
  analyzing: { bg: "bg-blue-50", text: "text-blue-600", label: "Analyzing…" },
  review: { bg: "bg-amber-50", text: "text-amber-600", label: "Ready for review" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Approved" },
  failed: { bg: "bg-rose-50", text: "text-rose-500", label: "Failed" },
};

export default function GradingReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<GradingJob | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  // Editable scores for review
  const [scores, setScores] = useState<CriterionScore[]>([]);
  const [feedback, setFeedback] = useState("");
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    getGradingJob(id).then(async (j) => {
      if (!j) { setLoading(false); return; }
      setJob(j);
      if (j.rubricId) {
        const r = await getRubric(j.rubricId);
        setRubric(r);
      }
      // Populate scores from AI analysis or final scores
      if (j.finalScores) {
        setScores(j.finalScores);
        setFeedback(j.finalFeedback ?? "");
      } else if (j.aiAnalysis) {
        setScores(j.aiAnalysis.criterionScores);
        setFeedback(j.aiAnalysis.overallFeedback);
      }
      setLoading(false);
    });
  }, [id]);

  const handleRunAI = useCallback(async () => {
    if (!job || !rubric) return;
    setRunning(true);
    try {
      await markAnalyzing(id);
      setJob((prev) => prev ? { ...prev, status: "analyzing" } : prev);

      const analysis = await runGradingAnalysis({
        assignmentName: job.assignmentName,
        studentWork: job.studentWork,
        criteria: rubric.criteria,
      });

      await markForReview(id, analysis);
      setJob((prev) => prev ? { ...prev, status: "review", aiAnalysis: analysis } : prev);
      setScores(analysis.criterionScores);
      setFeedback(analysis.overallFeedback);
    } catch {
      await markFailed(id);
      setJob((prev) => prev ? { ...prev, status: "failed" } : prev);
    }
    setRunning(false);
  }, [id, job, rubric]);

  const updateScore = useCallback((criterionId: string, updates: Partial<CriterionScore>) => {
    setScores((prev) => prev.map((s) => s.criterionId === criterionId ? { ...s, ...updates } : s));
  }, []);

  const handleApprove = useCallback(async () => {
    setApproving(true);
    const totalScore = scores.reduce((s, c) => s + c.score, 0);
    const totalPossible = scores.reduce((s, c) => s + c.maxPoints, 0);
    await approveGradingJob(id, { scores, feedback, totalScore, totalPossible });
    setJob((prev) => prev ? {
      ...prev,
      status: "approved",
      finalScores: scores,
      finalFeedback: feedback,
      finalTotalScore: totalScore,
      finalTotalPossible: totalPossible,
    } : prev);
    setApproving(false);
  }, [id, scores, feedback]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading grading job…</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-10 pb-20">
        <Link href="/grading" className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors">
          &larr; Grading
        </Link>
        <div className="rounded-xl border border-border bg-surface p-10 text-center mt-6">
          <p className="text-sm text-muted/60">Grading job not found</p>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[job.status];
  const totalScore = scores.reduce((s, c) => s + c.score, 0);
  const totalPossible = scores.reduce((s, c) => s + c.maxPoints, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/grading" className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors">
            &larr; Grading
          </Link>
          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {job.status === "pending" && (
            <button
              type="button"
              onClick={handleRunAI}
              disabled={running}
              className="rounded-lg bg-accent px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {running ? "Running AI…" : "Run AI analysis"}
            </button>
          )}
          {(job.status === "review" || job.status === "pending") && scores.length > 0 && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving}
              className="rounded-lg bg-emerald-500 px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
            >
              {approving ? "Approving…" : "Approve scores"}
            </button>
          )}
        </div>
      </header>

      {/* Info bar */}
      <div className="bg-surface rounded-xl border border-border p-5 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
          <div>
            <span className="text-[10px] text-muted uppercase tracking-wide block">Student</span>
            <span className="text-foreground/80 font-medium">{job.studentName}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted uppercase tracking-wide block">Assignment</span>
            <span className="text-foreground/80 font-medium">{job.assignmentName}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted uppercase tracking-wide block">Rubric</span>
            <span className="text-foreground/80 font-medium">{rubric?.title ?? "—"}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted uppercase tracking-wide block">Score</span>
            <span className="text-foreground/80 font-medium tabular-nums">
              {scores.length > 0 ? `${totalScore}/${totalPossible}` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Student work */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <rect x="3" y="2" width="10" height="12" rx="1.5" />
              <path d="M5.5 5h5M5.5 7.5h5M5.5 10h3" />
            </svg>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Student Work</h2>
            <span className="text-[10px] text-muted capitalize">{job.intakeMethod}</span>
            <div className="flex-1 border-t border-border" />
          </div>
          {job.studentWork ? (
            <div className="text-[13px] text-foreground/80 leading-[1.8] whitespace-pre-wrap max-h-[600px] overflow-y-auto">
              {job.studentWork}
            </div>
          ) : (
            <p className="text-[13px] text-muted/50 italic">No student work submitted yet.</p>
          )}
        </section>

        {/* Right: Scoring panel */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <rect x="2" y="2" width="12" height="12" rx="1.5" />
              <path d="M5 5.5h6M5 8h6M5 10.5h4" />
            </svg>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Scoring</h2>
            {scores.length > 0 && (
              <span className="text-[10px] text-muted tabular-nums">{totalScore}/{totalPossible}</span>
            )}
            <div className="flex-1 border-t border-border" />
          </div>

          {scores.length === 0 && rubric && (
            <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center">
              <p className="text-[13px] text-muted/60">
                {job.status === "pending"
                  ? "Run AI analysis or manually score each criterion below."
                  : "Waiting for analysis…"}
              </p>
            </div>
          )}

          {/* AI confidence / summary */}
          {job.aiAnalysis && (
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-medium text-muted uppercase tracking-wide">AI Analysis</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                  job.aiAnalysis.confidence === "high" ? "bg-emerald-50 text-emerald-600" :
                  job.aiAnalysis.confidence === "medium" ? "bg-amber-50 text-amber-600" :
                  "bg-rose-50 text-rose-500"
                }`}>
                  {job.aiAnalysis.confidence} confidence
                </span>
              </div>
              {job.aiAnalysis.strengths.length > 0 && (
                <div className="mb-2">
                  <span className="text-[10px] text-emerald-500 font-medium">Strengths:</span>
                  <ul className="text-[11px] text-foreground/70 ml-3 mt-0.5">
                    {job.aiAnalysis.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
              )}
              {job.aiAnalysis.improvements.length > 0 && (
                <div>
                  <span className="text-[10px] text-amber-500 font-medium">Improvements:</span>
                  <ul className="text-[11px] text-foreground/70 ml-3 mt-0.5">
                    {job.aiAnalysis.improvements.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Per-criterion scores */}
          {scores.map((score) => {
            const isApproved = job.status === "approved";
            return (
              <div key={score.criterionId} className="bg-surface rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-medium text-foreground/80 flex-1">{score.criterionLabel}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={score.score}
                      onChange={(e) => updateScore(score.criterionId, { score: parseInt(e.target.value) || 0 })}
                      disabled={isApproved}
                      min={0}
                      max={score.maxPoints}
                      aria-label={`Score for ${score.criterionLabel}`}
                      className="w-12 rounded border border-border bg-transparent px-2 py-1 text-[12px] text-center text-foreground outline-none focus:border-accent/30 tabular-nums disabled:opacity-50"
                    />
                    <span className="text-[11px] text-muted">/ {score.maxPoints}</span>
                  </div>
                </div>
                {score.reasoning && (
                  <p className="text-[11px] text-muted leading-relaxed mb-1">{score.reasoning}</p>
                )}
                <textarea
                  value={score.feedback}
                  onChange={(e) => updateScore(score.criterionId, { feedback: e.target.value })}
                  disabled={isApproved}
                  placeholder="Feedback for this criterion…"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[11px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none disabled:opacity-50"
                />
              </div>
            );
          })}

          {/* Overall feedback */}
          {scores.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-4">
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Overall feedback</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={job.status === "approved"}
                placeholder="Overall feedback for the student…"
                rows={4}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none disabled:opacity-50"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

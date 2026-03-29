"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getRecommendation,
  updateRecommendation,
  updateRecommendationStatus,
  deleteRecommendation,
  type Recommendation,
  type RecommendationStatus,
} from "@/lib/recommendations";
import { createApproval } from "@/lib/approvals";
import { requestAI } from "@/lib/ai/client";
import { ContextGuidance } from "@/app/components/context-guidance";
import Link from "next/link";

const STATUS_BADGE: Record<RecommendationStatus, { bg: string; text: string; label: string }> = {
  request: { bg: "bg-sky-500/10", text: "text-sky-400", label: "Request" },
  drafting: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Drafting" },
  review: { bg: "bg-violet-500/10", text: "text-violet-400", label: "In Review" },
  final: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Final" },
  sent: { bg: "bg-emerald-500/5", text: "text-emerald-400/60", label: "Sent" },
  archived: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Archived" },
};

const STATUS_ORDER: RecommendationStatus[] = ["request", "drafting", "review", "final", "sent"];

export default function RecommendationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [rec, setRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Editable fields
  const [relationship, setRelationship] = useState("");
  const [coursesWithStudent, setCoursesWithStudent] = useState("");
  const [strengths, setStrengths] = useState("");
  const [anecdotes, setAnecdotes] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [draftContent, setDraftContent] = useState("");

  useEffect(() => {
    getRecommendation(id).then((r) => {
      if (!r) { setLoading(false); return; }
      setRec(r);
      setRelationship(r.relationship);
      setCoursesWithStudent(r.coursesWithStudent);
      setStrengths(r.strengths);
      setAnecdotes(r.anecdotes);
      setAdditionalNotes(r.additionalNotes);
      setDraftContent(r.draftContent);
      setLoading(false);
    });
  }, [id]);

  const handleSave = useCallback(async () => {
    if (!rec) return;
    setSaving(true);
    try {
      await updateRecommendation(id, {
        relationship,
        coursesWithStudent,
        strengths,
        anecdotes,
        additionalNotes,
        draftContent,
      });
      setRec((prev) => prev ? {
        ...prev,
        relationship,
        coursesWithStudent,
        strengths,
        anecdotes,
        additionalNotes,
        draftContent,
      } : prev);
    } catch (err) {
      console.error("[handleSave]", err);
    }
    setSaving(false);
  }, [id, rec, relationship, coursesWithStudent, strengths, anecdotes, additionalNotes, draftContent]);

  const handleAIAssist = useCallback(async () => {
    if (!rec) return;
    setAiLoading(true);
    try {
      const result = await requestAI({
        templateId: "recommendation-letter",
        variables: {
          studentName: rec.studentName,
          institution: rec.institution,
          relationship,
          coursesWithStudent,
          strengths,
          anecdotes,
          additionalNotes,
        },
      });
      setDraftContent(result.text);
    } catch (err) {
      console.error("[handleAIAssist]", err);
    }
    setAiLoading(false);
  }, [rec, relationship, coursesWithStudent, strengths, anecdotes, additionalNotes]);

  const handleStatusTransition = useCallback(async (nextStatus: RecommendationStatus) => {
    if (!rec) return;
    setTransitioning(true);
    try {
      // When submitting for review, create an approval item
      if (nextStatus === "review") {
        await handleSave();
        const approvalId = await createApproval({
          title: `Recommendation: ${rec.studentName}`,
          type: "recommendation",
          sourceSystem: "recommendations",
          relatedObjectId: id,
          relatedRoute: `/recommendations/${id}`,
          content: draftContent,
        });
        await updateRecommendation(id, { status: "review", approvalId });
        setRec((prev) => prev ? { ...prev, status: "review", approvalId } : prev);
      } else {
        await updateRecommendationStatus(id, nextStatus);
        setRec((prev) => prev ? { ...prev, status: nextStatus } : prev);
      }
    } catch (err) {
      console.error("[handleStatusTransition]", err);
    }
    setTransitioning(false);
  }, [rec, id, draftContent, handleSave]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteRecommendation(id);
      router.push("/recommendations");
    } catch (err) {
      console.error("[handleDelete]", err);
      setDeleting(false);
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading recommendation...</span>
        </div>
      </div>
    );
  }

  if (!rec) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-10 pb-20">
        <Link href="/recommendations" className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors">
          &larr; Recommendations
        </Link>
        <div className="rounded-xl border border-border bg-surface p-10 text-center mt-6">
          <p className="text-sm text-muted/60">Recommendation not found</p>
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[rec.status];
  const currentStepIndex = STATUS_ORDER.indexOf(rec.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/recommendations" className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors">
            &larr; Recommendations
          </Link>
          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>
        <h1 className="text-[20px] font-semibold text-foreground tracking-tight">{rec.studentName}</h1>
        <div className="flex items-center gap-4 mt-1 text-[12px] text-muted">
          {rec.institution && <span>{rec.institution}</span>}
          {rec.dueDate && <span className="tabular-nums">Due {rec.dueDate}</span>}
        </div>
      </header>

      {/* Status Progression */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-6">
        <div className="flex items-center gap-1">
          {STATUS_ORDER.map((s, i) => {
            const stepBadge = STATUS_BADGE[s];
            const isCurrent = s === rec.status;
            const isPast = i < currentStepIndex;
            return (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    isPast ? "bg-accent" : isCurrent ? "bg-accent/50" : "bg-border"
                  }`}
                />
                {i < STATUS_ORDER.length - 1 && <div className="w-1" />}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          {STATUS_ORDER.map((s) => (
            <span
              key={s}
              className={`text-[9px] uppercase tracking-wider font-medium ${
                s === rec.status ? "text-accent" : "text-muted/40"
              }`}
            >
              {STATUS_BADGE[s].label}
            </span>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Student Info & Fields */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <circle cx="8" cy="5" r="3" />
              <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" />
            </svg>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Student Info</h2>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Relationship</label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. AP Chemistry teacher, 2 years"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Courses together</label>
              <input
                type="text"
                value={coursesWithStudent}
                onChange={(e) => setCoursesWithStudent(e.target.value)}
                placeholder="e.g. AP Chemistry, Honors Chemistry"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Key strengths</label>
              <textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="What stands out about this student?"
                rows={3}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Anecdotes / Examples</label>
              <textarea
                value={anecdotes}
                onChange={(e) => setAnecdotes(e.target.value)}
                placeholder="Specific moments that reveal character, growth, or talent..."
                rows={4}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Additional notes</label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Anything else the letter should address..."
                rows={2}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
              />
            </div>
          </div>
        </section>

        {/* Right: Draft */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <rect x="3" y="2" width="10" height="12" rx="1.5" />
              <path d="M5.5 5h5M5.5 7.5h5M5.5 10h3" />
            </svg>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Draft</h2>
            <div className="flex-1 border-t border-border" />
            <button
              type="button"
              onClick={handleAIAssist}
              disabled={aiLoading}
              className="text-[11px] font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2l1.5 4.5L14 8l-4.5 1.5L8 14l-1.5-4.5L2 8l4.5-1.5z" />
              </svg>
              {aiLoading ? "Generating..." : "AI Assist"}
            </button>
          </div>

          {aiLoading && (
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[12px] text-muted">Generating draft with AI...</span>
              </div>
            </div>
          )}

          {draftContent && !aiLoading && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <p className="text-[10px] font-medium text-amber-400 uppercase tracking-wide">
                AI-generated -- review before finalizing
              </p>
            </div>
          )}

          <div className="bg-surface rounded-xl border border-border p-5">
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Write or generate a recommendation letter draft..."
              rows={20}
              className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-[13px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
            />
          </div>

          {/* Contextual guidance */}
          <ContextGuidance
            tags={["ops", "recommendations", "communications"]}
            title="Recommendation Guidance"
          />
        </section>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border">
        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        {/* Status transitions */}
        {rec.status === "request" && (
          <button
            type="button"
            onClick={() => handleStatusTransition("drafting")}
            disabled={transitioning}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[13px] font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
          >
            {transitioning ? "..." : "Start Drafting"}
          </button>
        )}
        {rec.status === "drafting" && (
          <button
            type="button"
            onClick={() => handleStatusTransition("review")}
            disabled={transitioning || !draftContent.trim()}
            className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-[13px] font-medium text-violet-400 transition-colors hover:bg-violet-500/20 disabled:opacity-50"
          >
            {transitioning ? "..." : "Submit for Review"}
          </button>
        )}
        {rec.status === "review" && (
          <button
            type="button"
            onClick={() => handleStatusTransition("final")}
            disabled={transitioning}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[13px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {transitioning ? "..." : "Mark Final"}
          </button>
        )}
        {rec.status === "final" && (
          <button
            type="button"
            onClick={() => handleStatusTransition("sent")}
            disabled={transitioning}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[13px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {transitioning ? "..." : "Mark Sent"}
          </button>
        )}

        {/* Archive (available for sent/final) */}
        {(rec.status === "sent" || rec.status === "final") && (
          <button
            type="button"
            onClick={() => handleStatusTransition("archived")}
            disabled={transitioning}
            className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-muted transition-colors hover:text-foreground hover:border-border-strong disabled:opacity-50"
          >
            Archive
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-rose-400">Delete this recommendation?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-rose-500 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-muted transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-[12px] text-muted hover:text-rose-400 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

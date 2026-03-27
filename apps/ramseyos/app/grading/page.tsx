"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getGradingJobs,
  createGradingJob,
  type GradingJob,
  type GradingJobStatus,
  type IntakeMethod,
} from "@/lib/grading-jobs";
import { getRubrics, type Rubric } from "@/lib/rubrics";
import { getActiveGroups, type GroupItem } from "@/lib/groups";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_BADGE: Record<GradingJobStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-zinc-100", text: "text-zinc-500", label: "Pending" },
  analyzing: { bg: "bg-blue-50", text: "text-blue-600", label: "Analyzing" },
  review: { bg: "bg-amber-50", text: "text-amber-600", label: "Review" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Approved" },
  failed: { bg: "bg-rose-50", text: "text-rose-500", label: "Failed" },
};

export default function GradingPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<GradingJob[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New job form
  const [showForm, setShowForm] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [rubricId, setRubricId] = useState("");
  const [assignmentName, setAssignmentName] = useState("");
  const [intakeMethod, setIntakeMethod] = useState<IntakeMethod>("typed");
  const [studentWork, setStudentWork] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([getGradingJobs(), getRubrics(), getActiveGroups()]).then(([j, r, g]) => {
      setJobs(j);
      setRubrics(r.filter((rb) => rb.status !== "archived"));
      setGroups(g);
      setLoading(false);
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (!studentName.trim() || !rubricId || !assignmentName.trim()) return;
    setCreating(true);
    try {
      const id = await createGradingJob({
        studentName: studentName.trim(),
        groupId,
        rubricId,
        assignmentName: assignmentName.trim(),
        intakeMethod,
        studentWork,
      });
      router.push(`/grading/${id}`);
    } catch { setCreating(false); }
  }, [studentName, groupId, rubricId, assignmentName, intakeMethod, studentWork, router]);

  const pendingCount = jobs.filter((j) => j.status === "pending" || j.status === "analyzing").length;
  const reviewCount = jobs.filter((j) => j.status === "review").length;
  const approvedCount = jobs.filter((j) => j.status === "approved").length;

  if (loading) {
    return (
      <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading grading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      <header className="mb-8">
        <Link href="/" className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors">
          &larr; Today
        </Link>
        <div className="flex items-center gap-4 mt-2">
          <h1 className="text-[20px] font-semibold text-foreground tracking-tight">Grading</h1>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="ml-auto text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
          >
            {showForm ? "Cancel" : "+ New grading job"}
          </button>
        </div>
        <p className="text-[13px] text-muted/50 mt-1">
          Grade student work with rubrics and AI assistance.
        </p>
        <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
          {pendingCount > 0 && <span className="tabular-nums">{pendingCount} pending</span>}
          {reviewCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-400" />
              <span className="tabular-nums">{reviewCount} to review</span>
            </span>
          )}
          {approvedCount > 0 && <span className="tabular-nums">{approvedCount} approved</span>}
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Link href="/rubrics" className="text-[11px] text-muted hover:text-accent transition-colors">Rubrics &rarr;</Link>
          <Link href="/lesson-plans" className="text-[11px] text-muted hover:text-accent transition-colors">Lessons &rarr;</Link>
        </div>
      </header>

      {/* New Job Form */}
      {showForm && (
        <section className="bg-surface rounded-xl border border-border p-6 mb-8">
          <h2 className="text-[13px] font-semibold text-foreground mb-4">New grading job</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Student name</label>
              <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Student name" className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Assignment</label>
              <input type="text" value={assignmentName} onChange={(e) => setAssignmentName(e.target.value)} placeholder="Assignment name" className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Class</label>
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)} aria-label="Class" className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent/30 transition-colors">
                <option value="">Select class…</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Rubric</label>
              <select value={rubricId} onChange={(e) => setRubricId(e.target.value)} aria-label="Rubric" className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent/30 transition-colors">
                <option value="">Select rubric…</option>
                {rubrics.map((r) => <option key={r.id} value={r.id}>{r.title} ({r.totalPoints} pts)</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Intake method</label>
            <div className="flex items-center gap-2">
              {(["typed", "upload", "webcam"] as IntakeMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setIntakeMethod(m)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg transition-colors capitalize ${
                    intakeMethod === m
                      ? "bg-accent text-white font-semibold"
                      : "bg-surface border border-border text-muted hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {intakeMethod === "typed" && (
            <div className="mb-4">
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Student work</label>
              <textarea value={studentWork} onChange={(e) => setStudentWork(e.target.value)} placeholder="Paste or type the student's work here…" rows={8} className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-[13px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none" />
            </div>
          )}
          {intakeMethod === "upload" && (
            <div className="mb-4 rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-[13px] text-muted">File upload coming soon</p>
              <p className="text-[11px] text-muted/50 mt-1">For now, paste text above using the typed method.</p>
            </div>
          )}
          {intakeMethod === "webcam" && (
            <div className="mb-4 rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-[13px] text-muted">Webcam capture coming soon</p>
              <p className="text-[11px] text-muted/50 mt-1">For now, paste text above using the typed method.</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !studentName.trim() || !rubricId || !assignmentName.trim()}
            className="rounded-lg bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Start grading"}
          </button>
        </section>
      )}

      {/* Jobs list */}
      {jobs.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted mb-4">
            <rect x="2" y="2" width="12" height="12" rx="1.5" />
            <path d="M5 5.5h6M5 8h6M5 10.5h4" />
          </svg>
          <p className="text-sm text-muted/60 font-medium">No grading jobs yet</p>
          <p className="text-[12px] text-muted mt-1">Create a grading job to start scoring student work.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const badge = STATUS_BADGE[job.status];
            const rubric = rubrics.find((r) => r.id === job.rubricId);
            return (
              <Link
                key={job.id}
                href={`/grading/${job.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground/90 truncate">
                    {job.studentName} — {job.assignmentName}
                  </p>
                  <p className="text-[11px] text-muted truncate">
                    {rubric?.title ?? "Unknown rubric"}
                    {job.finalTotalScore !== null && (
                      <span className="ml-2 tabular-nums">{job.finalTotalScore}/{job.finalTotalPossible}</span>
                    )}
                  </p>
                </div>
                <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded font-medium ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

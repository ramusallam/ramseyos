"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getRecommendations,
  createRecommendation,
  type Recommendation,
  type RecommendationStatus,
} from "@/lib/recommendations";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_BADGE: Record<RecommendationStatus, { bg: string; text: string; label: string }> = {
  request: { bg: "bg-sky-500/10", text: "text-sky-400", label: "Request" },
  drafting: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Drafting" },
  review: { bg: "bg-violet-500/10", text: "text-violet-400", label: "Review" },
  final: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Final" },
  sent: { bg: "bg-emerald-500/5", text: "text-emerald-400/60", label: "Sent" },
  archived: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Archived" },
};

const ACTIVE_STATUSES: RecommendationStatus[] = ["request", "drafting", "review"];
const COMPLETED_STATUSES: RecommendationStatus[] = ["final", "sent"];

export default function RecommendationsPage() {
  const router = useRouter();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // New request form
  const [showForm, setShowForm] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [institution, setInstitution] = useState("");
  const [relationship, setRelationship] = useState("");
  const [coursesWithStudent, setCoursesWithStudent] = useState("");
  const [strengths, setStrengths] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  // Archived section collapsed by default
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    getRecommendations().then((r) => {
      setRecs(r);
      setLoading(false);
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (!studentName.trim()) return;
    setCreating(true);
    try {
      const id = await createRecommendation({
        studentName: studentName.trim(),
        institution: institution.trim(),
        relationship: relationship.trim(),
        coursesWithStudent: coursesWithStudent.trim(),
        strengths: strengths.trim(),
        dueDate: dueDate || undefined,
      });
      router.push(`/recommendations/${id}`);
    } catch {
      setCreating(false);
    }
  }, [studentName, institution, relationship, coursesWithStudent, strengths, dueDate, router]);

  const active = recs.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const completed = recs.filter((r) => COMPLETED_STATUSES.includes(r.status));
  const archived = recs.filter((r) => r.status === "archived");

  if (loading) {
    return (
      <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading recommendations...</span>
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
          <h1 className="text-[20px] font-semibold text-foreground tracking-tight">Recommendations</h1>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="ml-auto text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
          >
            {showForm ? "Cancel" : "+ New Request"}
          </button>
        </div>
        <p className="text-[13px] text-muted/50 mt-1">
          Draft and manage college recommendation letters.
        </p>
        <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
          {active.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-sky-400" />
              <span className="tabular-nums">{active.length} active</span>
            </span>
          )}
          {completed.length > 0 && <span className="tabular-nums">{completed.length} completed</span>}
        </div>
      </header>

      {/* New Request Form */}
      {showForm && (
        <section className="bg-surface rounded-xl border border-border p-6 mb-8">
          <h2 className="text-[13px] font-semibold text-foreground mb-4">New recommendation request</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Student name *</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student name"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Institution</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Target college or university"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
              <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent/30 transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
              <input
                type="text"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="e.g. Curiosity, leadership, persistence"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !studentName.trim()}
            className="rounded-lg bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create request"}
          </button>
        </section>
      )}

      {/* Active */}
      {active.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Active</h2>
            <div className="flex-1 border-t border-border" />
          </div>
          <div className="space-y-2">
            {active.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Completed</h2>
            <div className="flex-1 border-t border-border" />
          </div>
          <div className="space-y-2">
            {completed.map((rec) => (
              <RecCard key={rec.id} rec={rec} />
            ))}
          </div>
        </section>
      )}

      {/* Archived (collapsible) */}
      {archived.length > 0 && (
        <section className="mb-6">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 mb-3 w-full"
          >
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Archived</h2>
            <span className="text-[10px] text-muted tabular-nums">{archived.length}</span>
            <div className="flex-1 border-t border-border" />
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-muted transition-transform ${showArchived ? "rotate-180" : ""}`}
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>
          {showArchived && (
            <div className="space-y-2">
              {archived.map((rec) => (
                <RecCard key={rec.id} rec={rec} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {recs.length === 0 && !showForm && (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted mb-4">
            <rect x="3" y="2" width="10" height="12" rx="1.5" />
            <path d="M5.5 5h5M5.5 7.5h5M5.5 10h3" />
          </svg>
          <p className="text-sm text-muted/60 font-medium">No recommendation requests yet</p>
          <p className="text-[12px] text-muted mt-1">Create a request to start drafting a recommendation letter.</p>
        </div>
      )}
    </div>
  );
}

function RecCard({ rec }: { rec: Recommendation }) {
  const badge = STATUS_BADGE[rec.status];
  return (
    <Link
      href={`/recommendations/${rec.id}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground/90 truncate">
          {rec.studentName}
          {rec.institution && <span className="text-muted font-normal"> — {rec.institution}</span>}
        </p>
        <p className="text-[11px] text-muted truncate">
          {rec.relationship || "No relationship noted"}
          {rec.dueDate && (
            <span className="ml-2 tabular-nums">Due {rec.dueDate}</span>
          )}
        </p>
      </div>
      <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    </Link>
  );
}

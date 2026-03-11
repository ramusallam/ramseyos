"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getLessonPlan,
  updateLessonPlan,
  type LessonPlan,
} from "@/lib/lesson-plans";
import Link from "next/link";

export default function LessonPlanEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    getLessonPlan(id).then((p) => {
      if (!p) {
        setLoading(false);
        return;
      }
      setPlan(p);
      setTitle(p.title);
      setCourse(p.course);
      setDescription(p.description);
      setTagInput(p.tags.join(", "));
      setLoading(false);
    });
  }, [id]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);

    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await updateLessonPlan(id, { title, course, description, tags });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [id, title, course, description, tagInput, saving]);

  if (loading) {
    return (
      <div className="max-w-3xl px-8 pt-10 pb-20">
        <p className="text-sm text-muted/60">Loading...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-3xl px-8 pt-10 pb-20">
        <Link
          href="/lesson-plans"
          className="text-[11px] tracking-wide text-muted hover:text-foreground/60 transition-colors"
        >
          &larr; Lesson Plans
        </Link>
        <div className="bg-surface rounded-xl border border-border p-8 shadow-card text-center mt-6">
          <p className="text-sm text-muted">Lesson plan not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl px-8 pt-10 pb-20">
      {/* Header */}
      <header className="mb-10">
        <Link
          href="/lesson-plans"
          className="text-[11px] tracking-wide text-muted hover:text-foreground/60 transition-colors"
        >
          &larr; Lesson Plans
        </Link>
      </header>

      {/* Editor */}
      <div className="space-y-8">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          className="w-full text-2xl font-semibold text-foreground tracking-tight bg-transparent border-none outline-none placeholder:text-muted/30"
        />

        {/* Course */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2 block">
            Course
          </label>
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. AP Chemistry"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors shadow-card"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2 block">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this lesson about?"
            rows={6}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-[13px] text-foreground leading-relaxed placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors shadow-card resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2 block">
            Tags
          </label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="inquiry, atomic structure, lab"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors shadow-card"
          />
          <p className="text-[10px] text-muted/50 mt-1.5">
            Separate tags with commas
          </p>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {saved && (
            <span className="text-[12px] text-emerald-600 font-medium">
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

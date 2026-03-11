"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getLessonPlan,
  updateLessonPlan,
  type LessonPlan,
} from "@/lib/lesson-plans";
import { Timestamp } from "firebase/firestore";
import { getActiveTools, type ToolItem } from "@/lib/tools";
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
  const [reflection, setReflection] = useState("");
  const [lastTaughtAt, setLastTaughtAt] = useState("");
  const [linkedResourceIds, setLinkedResourceIds] = useState<string[]>([]);
  const [allTools, setAllTools] = useState<ToolItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    Promise.all([getLessonPlan(id), getActiveTools()]).then(([p, tools]) => {
      setAllTools(tools);
      if (!p) {
        setLoading(false);
        return;
      }
      setPlan(p);
      setTitle(p.title);
      setCourse(p.course);
      setDescription(p.description);
      setTagInput(p.tags.join(", "));
      setReflection(p.reflection ?? "");
      setLinkedResourceIds(p.linkedResourceIds ?? []);
      setLastTaughtAt(
        p.lastTaughtAt ? p.lastTaughtAt.toDate().toISOString().slice(0, 10) : ""
      );
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

    await updateLessonPlan(id, {
      title,
      course,
      description,
      tags,
      reflection,
      linkedResourceIds,
      lastTaughtAt: lastTaughtAt
        ? Timestamp.fromDate(new Date(lastTaughtAt + "T00:00:00"))
        : null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [id, title, course, description, tagInput, reflection, linkedResourceIds, lastTaughtAt, saving]);

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

        {/* Linked Resources */}
        <div className="border-t border-border/50 pt-8">
          <h2 className="text-[13px] font-semibold text-foreground/70 uppercase tracking-wider mb-1">
            Linked Resources
          </h2>
          <p className="text-[11px] text-muted/50 mb-4">
            Tools and resources used in this lesson.
          </p>

          {/* Linked cards */}
          {linkedResourceIds.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {linkedResourceIds.map((rid) => {
                const tool = allTools.find((t) => t.id === rid);
                if (!tool) return null;
                return (
                  <div
                    key={rid}
                    className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-3 shadow-card"
                  >
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0"
                    >
                      <span className="text-[13px] font-medium text-foreground/90 group-hover:text-accent transition-colors">
                        {tool.title}
                      </span>
                      <span className="block text-[11px] text-muted/60 mt-0.5 truncate">
                        {tool.description}
                      </span>
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setLinkedResourceIds((prev) =>
                          prev.filter((x) => x !== rid)
                        )
                      }
                      className="shrink-0 text-[11px] text-muted/40 hover:text-red-400 transition-colors mt-0.5"
                      aria-label={`Remove ${tool.title}`}
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add button / picker */}
          {!showPicker ? (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="text-[12px] text-accent/70 hover:text-accent transition-colors"
            >
              + Link a resource
            </button>
          ) : (
            <div className="rounded-lg border border-border bg-surface p-3 shadow-card space-y-1.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Select a resource
                </span>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="text-[11px] text-muted/40 hover:text-foreground/60 transition-colors"
                >
                  Done
                </button>
              </div>
              {allTools
                .filter((t) => !linkedResourceIds.includes(t.id))
                .map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      setLinkedResourceIds((prev) => [...prev, tool.id]);
                    }}
                    className="w-full text-left rounded-md px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[13px] font-medium text-foreground/80">
                      {tool.title}
                    </span>
                    <span className="block text-[10px] text-muted/50">
                      {tool.category}
                    </span>
                  </button>
                ))}
              {allTools.filter((t) => !linkedResourceIds.includes(t.id))
                .length === 0 && (
                <p className="text-[11px] text-muted/50 py-2 text-center">
                  All resources linked.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Reflection */}
        <div className="border-t border-border/50 pt-8">
          <h2 className="text-[13px] font-semibold text-foreground/70 uppercase tracking-wider mb-1">
            Lesson Reflection
          </h2>
          <p className="text-[11px] text-muted/50 mb-4">
            What worked? What would you change next time?
          </p>

          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Reflect on how this lesson went..."
            rows={5}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-[13px] text-foreground leading-relaxed placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors shadow-card resize-none"
          />

          <div className="mt-4">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2 block">
              Last Taught
            </label>
            <input
              type="date"
              value={lastTaughtAt}
              onChange={(e) => setLastTaughtAt(e.target.value)}
              aria-label="Last taught date"
              className="rounded-lg border border-border bg-surface px-4 py-2.5 text-[13px] text-foreground outline-none focus:border-accent/30 transition-colors shadow-card"
            />
          </div>
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

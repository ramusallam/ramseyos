"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getLessonPlan,
  updateLessonPlan,
  type LessonPlan,
  type SparkStatus,
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
  const [sparkLink, setSparkLink] = useState("");
  const [sparkStatus, setSparkStatus] = useState<SparkStatus>("not-started");
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
      setSparkLink(p.sparkLink ?? "");
      setSparkStatus(p.sparkStatus ?? "not-started");
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
      sparkLink,
      sparkStatus,
      lastTaughtAt: lastTaughtAt
        ? Timestamp.fromDate(new Date(lastTaughtAt + "T00:00:00"))
        : null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [id, title, course, description, tagInput, reflection, linkedResourceIds, sparkLink, sparkStatus, lastTaughtAt, saving]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-8 pt-10 pb-20">
        <p className="text-sm text-muted/60">Loading...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto px-8 pt-10 pb-20">
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
    <div className="max-w-4xl mx-auto px-8 pt-10 pb-20">
      {/* Navigation + Save */}
      <header className="flex items-center justify-between mb-8">
        <Link
          href="/lesson-plans"
          className="text-[11px] tracking-wide text-muted hover:text-foreground/60 transition-colors"
        >
          &larr; Lesson Plans
        </Link>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[11px] text-emerald-600 font-medium">
              Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      {/* ── Primary: Lesson Content ── */}
      <section className="bg-surface rounded-2xl border border-border shadow-card p-8 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          className="w-full text-2xl font-semibold text-foreground tracking-tight bg-transparent border-none outline-none placeholder:text-muted/30 mb-6"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted/70 mb-1.5 block">
              Course
            </label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. AP Chemistry"
              className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted/70 mb-1.5 block">
              Tags
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="inquiry, atomic structure, lab"
              className="w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors"
            />
          </div>
        </div>

        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted/70 mb-1.5 block">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this lesson about?"
          rows={8}
          className="w-full rounded-lg border border-border/60 bg-white px-4 py-3 text-[13px] text-foreground leading-relaxed placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors resize-none"
        />
      </section>

      {/* ── Secondary: Resources + Inquiry Studio (side by side) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Linked Resources */}
        <section className="rounded-xl border border-border/60 bg-surface/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted/70 mb-3">
            Linked Resources
          </h3>

          {linkedResourceIds.length > 0 && (
            <div className="space-y-2 mb-3">
              {linkedResourceIds.map((rid) => {
                const tool = allTools.find((t) => t.id === rid);
                if (!tool) return null;
                return (
                  <div
                    key={rid}
                    className="group flex items-center gap-2 rounded-md bg-white border border-border/40 px-3 py-2"
                  >
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0"
                    >
                      <span className="text-[12px] font-medium text-foreground/80 group-hover:text-accent transition-colors">
                        {tool.title}
                      </span>
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setLinkedResourceIds((prev) =>
                          prev.filter((x) => x !== rid)
                        )
                      }
                      className="shrink-0 text-[10px] text-muted/30 hover:text-red-400 transition-colors"
                      aria-label={`Remove ${tool.title}`}
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {!showPicker ? (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="text-[11px] text-accent/60 hover:text-accent transition-colors"
            >
              + Link a resource
            </button>
          ) : (
            <div className="rounded-md border border-border/40 bg-white p-2 space-y-0.5">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted/60">
                  Select
                </span>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="text-[10px] text-muted/40 hover:text-foreground/60 transition-colors"
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
                    className="w-full text-left rounded px-2 py-1.5 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[12px] font-medium text-foreground/70">
                      {tool.title}
                    </span>
                  </button>
                ))}
              {allTools.filter((t) => !linkedResourceIds.includes(t.id))
                .length === 0 && (
                <p className="text-[10px] text-muted/40 py-1 text-center">
                  All resources linked.
                </p>
              )}
            </div>
          )}

          {linkedResourceIds.length === 0 && !showPicker && (
            <p className="text-[10px] text-muted/35 mt-1">
              No resources linked yet.
            </p>
          )}
        </section>

        {/* Inquiry Studio */}
        <section className="rounded-xl border border-amber-200/60 bg-amber-50/30 p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-amber-500">
              <path d="M8 1l2 3h3l-2.5 2.5L11.5 10 8 8l-3.5 2 1-3.5L3 4h3l2-3z" fill="currentColor" />
            </svg>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-amber-700/70">
              Inquiry Studio
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted/60 mb-1 block">
                Spark Link
              </label>
              <input
                type="url"
                value={sparkLink}
                onChange={(e) => setSparkLink(e.target.value)}
                placeholder="https://sparklearningstudio.ai/..."
                className="w-full rounded-md border border-amber-200/60 bg-white px-3 py-2 text-[12px] text-foreground placeholder:text-muted/40 outline-none focus:border-amber-300 transition-colors"
              />
            </div>

            <div className="flex gap-1.5">
              {(["not-started", "in-progress", "deployed"] as const).map(
                (s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSparkStatus(s)}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                      sparkStatus === s
                        ? s === "deployed"
                          ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                          : s === "in-progress"
                            ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                            : "bg-gray-100 text-foreground/50 ring-1 ring-gray-200"
                        : "bg-white/60 text-muted/40 hover:text-muted/60"
                    }`}
                  >
                    {s === "not-started"
                      ? "Not started"
                      : s === "in-progress"
                        ? "In progress"
                        : "Deployed"}
                  </button>
                )
              )}
            </div>

            {sparkLink.trim() ? (
              <a
                href={sparkLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-amber-600"
              >
                Open in Spark
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 3h8v8M13 3L6 10" />
                </svg>
              </a>
            ) : (
              <p className="text-[10px] text-amber-600/40">
                Add a link to connect this lesson to Spark.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* ── Tertiary: Reflection ── */}
      <section className="rounded-xl border border-border/40 bg-surface/40 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted/70">
            Lesson Reflection
          </h3>
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-medium text-muted/50">
              Last taught
            </label>
            <input
              type="date"
              value={lastTaughtAt}
              onChange={(e) => setLastTaughtAt(e.target.value)}
              aria-label="Last taught date"
              className="rounded-md border border-border/40 bg-white px-2 py-1 text-[11px] text-foreground outline-none focus:border-accent/30 transition-colors"
            />
          </div>
        </div>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="What worked? What would you change next time?"
          rows={4}
          className="w-full rounded-lg border border-border/40 bg-white px-4 py-3 text-[13px] text-foreground leading-relaxed placeholder:text-muted/30 outline-none focus:border-accent/30 transition-colors resize-none"
        />
      </section>

      {/* ── Bottom Save (mobile convenience) ── */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-[11px] text-emerald-600 font-medium">
            Saved
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-accent px-5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

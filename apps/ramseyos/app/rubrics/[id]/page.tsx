"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getRubric,
  updateRubric,
  duplicateRubric,
  makeCriterionId,
  makeDefaultLevels,
  type Rubric,
  type RubricCriterion,
  type RubricLevel,
  type RubricStatus,
} from "@/lib/rubrics";
import Link from "next/link";

const STATUS_OPTIONS: { value: RubricStatus; label: string; color: string }[] = [
  { value: "draft", label: "Draft", color: "bg-zinc-100 text-zinc-500" },
  { value: "active", label: "Active", color: "bg-emerald-50 text-emerald-600" },
  { value: "archived", label: "Archived", color: "bg-zinc-50 text-zinc-400" },
];

export default function RubricEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<RubricStatus>("draft");
  const [tagInput, setTagInput] = useState("");
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);

  useEffect(() => {
    getRubric(id).then((r) => {
      if (!r) { setLoading(false); return; }
      setRubric(r);
      setTitle(r.title);
      setCourse(r.course);
      setDescription(r.description);
      setStatus(r.status);
      setTagInput((r.tags ?? []).join(", "));
      setCriteria(r.criteria ?? []);
      setLoading(false);
    });
  }, [id]);

  const totalPoints = criteria.reduce((s, c) => s + c.maxPoints, 0);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    await updateRubric(id, { title, course, description, status, tags, criteria });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [id, title, course, description, status, tagInput, criteria, saving]);

  const handleDuplicate = useCallback(async () => {
    const newId = await duplicateRubric(id);
    if (newId) router.push(`/rubrics/${newId}`);
  }, [id, router]);

  const addCriterion = useCallback(() => {
    const newCriterion: RubricCriterion = {
      id: makeCriterionId(),
      label: "",
      description: "",
      maxPoints: 4,
      levels: makeDefaultLevels(4),
    };
    setCriteria((prev) => [...prev, newCriterion]);
  }, []);

  const removeCriterion = useCallback((cid: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== cid));
  }, []);

  const updateCriterion = useCallback((cid: string, updates: Partial<RubricCriterion>) => {
    setCriteria((prev) => prev.map((c) => {
      if (c.id !== cid) return c;
      const updated = { ...c, ...updates };
      // If maxPoints changed, re-scale level points
      if (updates.maxPoints !== undefined && updates.maxPoints !== c.maxPoints) {
        updated.levels = makeDefaultLevels(updates.maxPoints);
      }
      return updated;
    }));
  }, []);

  const updateLevel = useCallback((cid: string, levelIndex: number, updates: Partial<RubricLevel>) => {
    setCriteria((prev) => prev.map((c) => {
      if (c.id !== cid) return c;
      const levels = c.levels.map((l, i) => i === levelIndex ? { ...l, ...updates } : l);
      return { ...c, levels };
    }));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading rubric…</span>
        </div>
      </div>
    );
  }

  if (!rubric) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-10 pb-20">
        <Link href="/rubrics" className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors">
          &larr; Rubrics
        </Link>
        <div className="rounded-xl border border-border bg-surface p-10 text-center mt-6">
          <p className="text-sm text-muted/60">Rubric not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/rubrics" className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors">
            &larr; Rubrics
          </Link>
          <span className="text-[10px] text-muted tabular-nums">{totalPoints} pts total</span>
          {rubric.version > 1 && <span className="text-[10px] text-muted">v{rubric.version}</span>}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleDuplicate} className="text-[11px] text-muted hover:text-foreground transition-colors">
            Duplicate as new version
          </button>
          {saved && (
            <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
              <span className="size-1 rounded-full bg-emerald-500" /> Saved
            </span>
          )}
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-accent px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {/* Status */}
      <div className="flex items-center gap-2 mb-6">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
              status === opt.value ? opt.color + " ring-1 ring-current/20" : "text-muted/40 hover:text-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Meta */}
      <section className="bg-surface rounded-xl border border-border p-6 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Rubric title"
          className="w-full text-xl font-semibold text-foreground tracking-tight bg-transparent border-none outline-none placeholder:text-muted mb-4"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Course</label>
            <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. AP Chemistry" className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Tags</label>
            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="lab, formative" className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this rubric used for?" rows={2} className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none" />
        </div>
      </section>

      {/* Criteria */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Criteria</h2>
          <span className="text-[10px] text-muted tabular-nums">{criteria.length}</span>
          <div className="flex-1 border-t border-border" />
          <button type="button" onClick={addCriterion} className="text-[12px] font-medium text-accent hover:text-accent/80 transition-colors">
            + Add criterion
          </button>
        </div>

        {criteria.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <p className="text-[13px] text-muted/60">No criteria yet. Add your first criterion to start building this rubric.</p>
          </div>
        )}

        {criteria.map((criterion) => (
          <CriterionCard
            key={criterion.id}
            criterion={criterion}
            onUpdate={(updates) => updateCriterion(criterion.id, updates)}
            onUpdateLevel={(li, updates) => updateLevel(criterion.id, li, updates)}
            onRemove={() => removeCriterion(criterion.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Criterion Card ── */

function CriterionCard({
  criterion,
  onUpdate,
  onUpdateLevel,
  onRemove,
}: {
  criterion: RubricCriterion;
  onUpdate: (updates: Partial<RubricCriterion>) => void;
  onUpdateLevel: (levelIndex: number, updates: Partial<RubricLevel>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 group/card">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1 space-y-3">
          <input
            type="text"
            value={criterion.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Criterion name (e.g. Scientific Reasoning)"
            className="w-full text-[14px] font-medium text-foreground bg-transparent border-none outline-none placeholder:text-muted"
          />
          <textarea
            value={criterion.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe what this criterion assesses…"
            rows={2}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
          />
        </div>
        <div className="shrink-0 text-right">
          <label className="text-[9px] text-muted uppercase tracking-wide block mb-1">Max pts</label>
          <input
            type="number"
            value={criterion.maxPoints}
            onChange={(e) => onUpdate({ maxPoints: parseInt(e.target.value) || 0 })}
            min={1}
            aria-label="Maximum points"
            className="w-16 rounded-lg border border-border bg-transparent px-2 py-1.5 text-[13px] text-foreground text-center outline-none focus:border-accent/30 transition-colors tabular-nums"
          />
        </div>
      </div>

      {/* Performance levels grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {criterion.levels.map((level, li) => (
          <div key={li} className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={level.label}
                onChange={(e) => onUpdateLevel(li, { label: e.target.value })}
                className="flex-1 text-[11px] font-semibold text-foreground/80 bg-transparent border-none outline-none"
              />
              <input
                type="number"
                value={level.points}
                onChange={(e) => onUpdateLevel(li, { points: parseInt(e.target.value) || 0 })}
                min={0}
                aria-label={`${level.label} points`}
                className="w-10 text-[11px] text-center text-muted rounded border border-border bg-transparent outline-none tabular-nums"
              />
            </div>
            <textarea
              value={level.description}
              onChange={(e) => onUpdateLevel(li, { description: e.target.value })}
              placeholder="Describe this level…"
              rows={3}
              className="w-full text-[11px] text-foreground/60 bg-transparent border-none outline-none resize-none placeholder:text-muted/40 leading-relaxed"
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end">
        <button type="button" onClick={onRemove} className="text-[10px] text-muted/30 hover:text-rose-500 transition-colors opacity-0 group-hover/card:opacity-100">
          Remove criterion
        </button>
      </div>
    </div>
  );
}

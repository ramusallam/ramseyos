"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getLessonPlan,
  updateLessonPlan,
  duplicateLessonPlan,
  archiveLessonPlan,
  type LessonPlan,
  type LessonStatus,
  type SparkStatus,
  type MaterialItem,
} from "@/lib/lesson-plans";
import { getAllUnits, type Unit } from "@/lib/units";
import { getRubrics, type Rubric } from "@/lib/rubrics";
import {
  getReflectionsForLesson,
  createLessonReflection,
  type LessonReflection,
  type EngagementLevel,
} from "@/lib/lesson-reflections";
import { copySparkExportToClipboard, downloadSparkExport } from "@/lib/spark-bridge";
import { getActiveTools, type ToolItem } from "@/lib/tools";
import { getActiveVendors, type VendorItem } from "@/lib/vendors";
import { trackRecent } from "@/lib/recents";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";

/* ── Constants ── */

const STATUS_OPTIONS: { value: LessonStatus; label: string; color: string }[] = [
  { value: "draft", label: "Draft", color: "bg-zinc-100 text-zinc-500" },
  { value: "ready", label: "Ready", color: "bg-blue-50 text-blue-600" },
  { value: "taught", label: "Taught", color: "bg-emerald-50 text-emerald-600" },
  { value: "revised", label: "Revised", color: "bg-amber-50 text-amber-600" },
  { value: "archived", label: "Archived", color: "bg-zinc-50 text-zinc-400" },
];

const SPARK_STATUS_META: Record<SparkStatus, { label: string; color: string; bg: string }> = {
  "not-started": { label: "Not started", color: "text-muted/50", bg: "bg-zinc-100" },
  "in-progress": { label: "In progress", color: "text-amber-600", bg: "bg-amber-50" },
  deployed: { label: "Deployed", color: "text-emerald-600", bg: "bg-emerald-50" },
};

const ENGAGEMENT_OPTIONS: { value: EngagementLevel; label: string; emoji: string }[] = [
  { value: "high", label: "High", emoji: "H" },
  { value: "medium", label: "Medium", emoji: "M" },
  { value: "low", label: "Low", emoji: "L" },
];

/* ── Page ── */

export default function LessonPlanEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Core state
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState<LessonStatus>("draft");
  const [unitId, setUnitId] = useState<string | null>(null);
  const [objective, setObjective] = useState("");
  const [warmUp, setWarmUp] = useState("");
  const [activities, setActivities] = useState("");
  const [assessment, setAssessment] = useState("");
  const [keyQuestions, setKeyQuestions] = useState<string[]>([]);
  const [kqInput, setKqInput] = useState("");
  const [differentiation, setDifferentiation] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [rubricIds, setRubricIds] = useState<string[]>([]);
  const [taughtDates, setTaughtDates] = useState<string[]>([]);

  // Legacy fields
  const [reflection, setReflection] = useState("");
  const [lastTaughtAt, setLastTaughtAt] = useState("");
  const [linkedResourceIds, setLinkedResourceIds] = useState<string[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [sparkLink, setSparkLink] = useState("");
  const [sparkStatus, setSparkStatus] = useState<SparkStatus>("not-started");

  // Sidebar data
  const [units, setUnits] = useState<Unit[]>([]);
  const [allRubrics, setAllRubrics] = useState<Rubric[]>([]);
  const [reflections, setReflections] = useState<LessonReflection[]>([]);
  const [allTools, setAllTools] = useState<ToolItem[]>([]);
  const [allVendors, setAllVendors] = useState<VendorItem[]>([]);

  // UI state
  const [showPicker, setShowPicker] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [showLegacy, setShowLegacy] = useState(false);
  const [sparkExporting, setSparkExporting] = useState(false);

  // Material form fields
  const [matName, setMatName] = useState("");
  const [matQty, setMatQty] = useState("");
  const [matNotes, setMatNotes] = useState("");
  const [matSource, setMatSource] = useState("");
  const [matUrl, setMatUrl] = useState("");
  const [matVendorId, setMatVendorId] = useState("");
  const [matFavorite, setMatFavorite] = useState(false);
  const [matRecurring, setMatRecurring] = useState(false);
  const [matNeedToBuy, setMatNeedToBuy] = useState(false);
  const [matPurchaseNotes, setMatPurchaseNotes] = useState("");

  // Reflection form
  const [refDate, setRefDate] = useState(new Date().toISOString().slice(0, 10));
  const [refWorked, setRefWorked] = useState("");
  const [refChange, setRefChange] = useState("");
  const [refEngagement, setRefEngagement] = useState<EngagementLevel | null>(null);
  const [refNotes, setRefNotes] = useState("");

  /* ── Load data ── */

  useEffect(() => {
    Promise.all([
      getLessonPlan(id),
      getAllUnits(),
      getRubrics(),
      getReflectionsForLesson(id),
      getActiveTools(),
      getActiveVendors(),
    ]).then(([p, u, r, refs, tools, vendors]) => {
      setUnits(u);
      setAllRubrics(r);
      setReflections(refs);
      setAllTools(tools);
      setAllVendors(vendors);
      if (!p) { setLoading(false); return; }
      setPlan(p);
      trackRecent({ id: `lesson-${p.id}`, label: p.title, href: `/lesson-plans/${p.id}`, category: "lesson", detail: p.course });

      // Populate form
      setTitle(p.title);
      setCourse(p.course);
      setStatus(p.status);
      setUnitId(p.unitId);
      setObjective(p.objective);
      setWarmUp(p.warmUp);
      setActivities(p.activities);
      setAssessment(p.assessment);
      setKeyQuestions(p.keyQuestions ?? []);
      setDifferentiation(p.differentiation);
      setClosingNotes(p.closingNotes);
      setDescription(p.description);
      setTagInput((p.tags ?? []).join(", "));
      setRubricIds(p.rubricIds ?? []);
      setTaughtDates(p.taughtDates ?? []);
      setReflection(p.reflection ?? "");
      setLinkedResourceIds(p.linkedResourceIds ?? []);
      setMaterials(p.materials ?? []);
      setSparkLink(p.sparkLink ?? "");
      setSparkStatus(p.sparkStatus ?? "not-started");
      setLastTaughtAt(p.lastTaughtAt ? p.lastTaughtAt.toDate().toISOString().slice(0, 10) : "");
      // Show legacy section if there's content in description but not in structured fields
      if (p.description?.trim() && !p.objective && !p.warmUp && !p.activities) {
        setShowLegacy(true);
      }
      setLoading(false);
    });
  }, [id]);

  /* ── Save ── */

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    await updateLessonPlan(id, {
      title, course, status, unitId, objective, warmUp, activities,
      assessment, keyQuestions, differentiation, closingNotes,
      description, tags, reflection, rubricIds, taughtDates,
      linkedResourceIds, materials, sparkLink, sparkStatus,
      lastTaughtAt: lastTaughtAt ? Timestamp.fromDate(new Date(lastTaughtAt + "T00:00:00")) : null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [
    id, title, course, status, unitId, objective, warmUp, activities,
    assessment, keyQuestions, differentiation, closingNotes, description,
    tagInput, reflection, rubricIds, taughtDates, linkedResourceIds,
    materials, sparkLink, sparkStatus, lastTaughtAt, saving,
  ]);

  /* ── Duplicate ── */

  const handleDuplicate = useCallback(async () => {
    const newId = await duplicateLessonPlan(id);
    if (newId) router.push(`/lesson-plans/${newId}`);
  }, [id, router]);

  /* ── Archive ── */

  const handleArchive = useCallback(async () => {
    await archiveLessonPlan(id);
    router.push("/lesson-plans");
  }, [id, router]);

  /* ── Key Questions ── */

  const addKeyQuestion = useCallback(() => {
    const q = kqInput.trim();
    if (!q) return;
    setKeyQuestions((prev) => [...prev, q]);
    setKqInput("");
  }, [kqInput]);

  const removeKeyQuestion = useCallback((index: number) => {
    setKeyQuestions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ── Materials ── */

  const addMaterial = useCallback(() => {
    const name = matName.trim();
    if (!name) return;
    const vendor = matVendorId ? allVendors.find((v) => v.id === matVendorId) : null;
    setMaterials((prev) => [
      ...prev,
      {
        name,
        quantity: matQty.trim(),
        notes: matNotes.trim(),
        sourceName: vendor ? vendor.name : matSource.trim(),
        sourceUrl: vendor ? vendor.url : matUrl.trim(),
        ...(vendor ? { vendorId: vendor.id } : {}),
        ...(matFavorite ? { favorite: true } : {}),
        ...(matRecurring ? { recurring: true } : {}),
        ...(matNeedToBuy ? { needToBuy: true } : {}),
        ...(matPurchaseNotes.trim() ? { purchaseNotes: matPurchaseNotes.trim() } : {}),
      },
    ]);
    setMatName(""); setMatQty(""); setMatNotes(""); setMatSource("");
    setMatUrl(""); setMatVendorId(""); setMatFavorite(false);
    setMatRecurring(false); setMatNeedToBuy(false); setMatPurchaseNotes("");
    setShowMaterialForm(false);
  }, [matName, matQty, matNotes, matSource, matUrl, matVendorId, allVendors, matFavorite, matRecurring, matNeedToBuy, matPurchaseNotes]);

  const removeMaterial = useCallback((index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ── Reflections ── */

  const addReflection = useCallback(async () => {
    await createLessonReflection({
      lessonId: id,
      dateTaught: refDate,
      whatWorked: refWorked,
      whatToChange: refChange,
      studentEngagement: refEngagement,
      notes: refNotes,
    });
    // Add date to taughtDates if not already there
    if (!taughtDates.includes(refDate)) {
      setTaughtDates((prev) => [...prev, refDate]);
    }
    // Refresh reflections
    const updated = await getReflectionsForLesson(id);
    setReflections(updated);
    setRefWorked(""); setRefChange(""); setRefEngagement(null); setRefNotes("");
    setShowReflectionForm(false);
  }, [id, refDate, refWorked, refChange, refEngagement, refNotes, taughtDates]);

  /* ── Spark export ── */

  const handleSparkExport = useCallback(async () => {
    if (!plan) return;
    setSparkExporting(true);
    const currentPlan = {
      ...plan,
      title, course, objective, warmUp, activities, assessment,
      keyQuestions, materials, tags: tagInput.split(",").map((t) => t.trim()).filter(Boolean),
    };
    await copySparkExportToClipboard(currentPlan);
    setSparkExporting(false);
    setTimeout(() => setSparkExporting(false), 2000);
  }, [plan, title, course, objective, warmUp, activities, assessment, keyQuestions, materials, tagInput]);

  const handleSparkDownload = useCallback(() => {
    if (!plan) return;
    const currentPlan = {
      ...plan,
      title, course, objective, warmUp, activities, assessment,
      keyQuestions, materials, tags: tagInput.split(",").map((t) => t.trim()).filter(Boolean),
    };
    downloadSparkExport(currentPlan);
  }, [plan, title, course, objective, warmUp, activities, assessment, keyQuestions, materials, tagInput]);

  /* ── Rubric linking ── */

  const toggleRubric = useCallback((rubricId: string) => {
    setRubricIds((prev) =>
      prev.includes(rubricId)
        ? prev.filter((r) => r !== rubricId)
        : [...prev, rubricId]
    );
  }, []);

  /* ── Render ── */

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading lesson…</span>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-10 pb-20">
        <Link href="/lesson-plans" className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors">
          &larr; Lesson Plans
        </Link>
        <div className="rounded-xl border border-border bg-surface p-10 text-center mt-6">
          <p className="text-sm text-muted/60">Lesson plan not found</p>
        </div>
      </div>
    );
  }

  const courseUnits = units.filter((u) => u.course === course);
  const sparkMeta = SPARK_STATUS_META[sparkStatus];
  const needToBuyCount = materials.filter((m) => m.needToBuy).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* ── Header ── */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/lesson-plans" className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors">
            &larr; Lesson Plans
          </Link>
          {course && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-600">
              {course}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleDuplicate} className="text-[11px] text-muted hover:text-foreground transition-colors">
            Duplicate
          </button>
          {status !== "archived" && (
            <button type="button" onClick={handleArchive} className="text-[11px] text-muted/50 hover:text-rose-500 transition-colors">
              Archive
            </button>
          )}
          {saved && (
            <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
              <span className="size-1 rounded-full bg-emerald-500" /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-accent px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {/* ── Status bar ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
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
        {taughtDates.length > 0 && (
          <span className="text-[10px] text-muted tabular-nums ml-2">
            Taught {taughtDates.length}x
          </span>
        )}
      </div>

      {/* ── Studio layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* ── Left: Structured Editor ── */}
        <div className="space-y-6">
          <section className="bg-surface rounded-xl border border-border p-6 sm:p-8">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title"
              className="w-full text-xl sm:text-2xl font-semibold text-foreground tracking-tight bg-transparent border-none outline-none placeholder:text-muted mb-6"
            />

            {/* Course + Tags + Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <FieldGroup label="Course">
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. AP Chemistry"
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors"
                />
              </FieldGroup>
              <FieldGroup label="Tags">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="inquiry, atomic structure"
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors"
                />
              </FieldGroup>
              <FieldGroup label="Unit">
                <select
                  value={unitId ?? ""}
                  onChange={(e) => setUnitId(e.target.value || null)}
                  aria-label="Unit"
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent/30 transition-colors"
                >
                  <option value="">No unit</option>
                  {courseUnits.map((u) => (
                    <option key={u.id} value={u.id}>{u.title}</option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            {/* Objective / Essential Question */}
            <FieldGroup label="Objective / Essential Question" className="mb-5">
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="What should students understand or be able to do by the end of this lesson?"
                rows={3}
                className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-[13px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
              />
            </FieldGroup>

            {/* Warm-Up / Engage */}
            <FieldGroup label="Warm-Up / Engage" className="mb-5">
              <textarea
                value={warmUp}
                onChange={(e) => setWarmUp(e.target.value)}
                placeholder="Hook, opening question, or activating prior knowledge…"
                rows={4}
                className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-[13px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
              />
            </FieldGroup>

            {/* Activities / Explore-Explain-Elaborate */}
            <FieldGroup label="Activities / Explore · Explain · Elaborate" className="mb-5">
              <textarea
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
                placeholder="Main instructional activities, investigations, demonstrations, discussions…"
                rows={10}
                className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-[13px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
              />
            </FieldGroup>

            {/* Assessment / Evaluate */}
            <FieldGroup label="Assessment / Evaluate" className="mb-5">
              <textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="How will you check for understanding? Exit ticket, quiz, discussion…"
                rows={4}
                className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-[13px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
              />
            </FieldGroup>

            {/* Key Questions */}
            <FieldGroup label="Key Questions" className="mb-5">
              <div className="space-y-1.5 mb-2">
                {keyQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 group">
                    <span className="text-[12px] text-muted mt-0.5 tabular-nums shrink-0">{i + 1}.</span>
                    <span className="text-[13px] text-foreground/80 flex-1">{q}</span>
                    <button
                      type="button"
                      onClick={() => removeKeyQuestion(i)}
                      className="text-[10px] text-muted/30 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={kqInput}
                  onChange={(e) => setKqInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyQuestion(); } }}
                  placeholder="Add a key question…"
                  className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors"
                />
                <button type="button" onClick={addKeyQuestion} className="text-[11px] text-accent hover:text-accent/80 transition-colors font-medium">
                  Add
                </button>
              </div>
            </FieldGroup>

            {/* Differentiation */}
            <FieldGroup label="Differentiation" className="mb-5">
              <textarea
                value={differentiation}
                onChange={(e) => setDifferentiation(e.target.value)}
                placeholder="Accommodations, extensions, scaffolding…"
                rows={3}
                className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-[13px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
              />
            </FieldGroup>

            {/* Closing Notes */}
            <FieldGroup label="Closing Notes" className="mb-5">
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Wrap-up, homework, preview of next lesson…"
                rows={2}
                className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-[13px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
              />
            </FieldGroup>

            {/* Legacy description (collapsed) */}
            {(description.trim() || showLegacy) && (
              <div className="border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowLegacy(!showLegacy)}
                  className="text-[11px] text-muted/50 hover:text-muted transition-colors mb-2"
                >
                  {showLegacy ? "Hide legacy notes" : "Show legacy notes"}
                </button>
                {showLegacy && (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Legacy lesson notes…"
                    rows={6}
                    className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-[13px] text-foreground leading-[1.8] placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
                  />
                )}
              </div>
            )}
          </section>

          {/* ── Materials ── */}
          <section className="bg-surface rounded-xl border border-border p-5">
            <SectionHeader icon="M3 3h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" label="Materials & Supplies" count={materials.length} />
            {needToBuyCount > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-500 font-medium mb-3 inline-block">
                {needToBuyCount} to buy
              </span>
            )}
            {materials.length > 0 && (
              <div className="space-y-2 mb-3">
                {materials.map((mat, i) => (
                  <div key={i} className="flex items-center gap-3 text-[12px] text-foreground/70 group">
                    <span className="flex-1">{mat.name}{mat.quantity ? ` (${mat.quantity})` : ""}</span>
                    {mat.needToBuy && <span className="text-[9px] text-rose-400">need</span>}
                    {mat.sourceName && <span className="text-[10px] text-muted">{mat.sourceName}</span>}
                    <button type="button" onClick={() => removeMaterial(i)} className="text-[10px] text-muted/30 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                      remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {!showMaterialForm ? (
              <button type="button" onClick={() => setShowMaterialForm(true)} className="text-[11px] text-accent/60 hover:text-accent transition-colors">
                + Add material
              </button>
            ) : (
              <div className="space-y-3 border-t border-border pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={matName} onChange={(e) => setMatName(e.target.value)} placeholder="Material name" className="rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground placeholder:text-muted outline-none focus:border-accent/30" />
                  <input type="text" value={matQty} onChange={(e) => setMatQty(e.target.value)} placeholder="Quantity" className="rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground placeholder:text-muted outline-none focus:border-accent/30" />
                </div>
                <input type="text" value={matNotes} onChange={(e) => setMatNotes(e.target.value)} placeholder="Notes" className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground placeholder:text-muted outline-none focus:border-accent/30" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={matSource} onChange={(e) => setMatSource(e.target.value)} placeholder="Source" className="rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground placeholder:text-muted outline-none focus:border-accent/30" />
                  <select value={matVendorId} onChange={(e) => setMatVendorId(e.target.value)} aria-label="Vendor" className="rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground outline-none focus:border-accent/30">
                    <option value="">Or select vendor…</option>
                    {allVendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-[11px] text-muted">
                    <input type="checkbox" checked={matNeedToBuy} onChange={(e) => setMatNeedToBuy(e.target.checked)} aria-label="Need to buy" className="rounded" /> Need to buy
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-muted">
                    <input type="checkbox" checked={matRecurring} onChange={(e) => setMatRecurring(e.target.checked)} aria-label="Recurring" className="rounded" /> Recurring
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-muted">
                    <input type="checkbox" checked={matFavorite} onChange={(e) => setMatFavorite(e.target.checked)} aria-label="Favorite" className="rounded" /> Favorite
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={addMaterial} className="text-[11px] text-accent font-medium hover:text-accent/80 transition-colors">Add</button>
                  <button type="button" onClick={() => { setShowMaterialForm(false); setMatName(""); setMatQty(""); }} className="text-[11px] text-muted hover:text-foreground transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Right: Studio Panels ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
              <rect x="2" y="2" width="5" height="5" rx="1" />
              <rect x="9" y="2" width="5" height="5" rx="1" />
              <rect x="2" y="9" width="5" height="5" rx="1" />
              <rect x="9" y="9" width="5" height="5" rx="1" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Teaching Studio</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* ── Spark Panel ── */}
          <section className="rounded-xl border border-amber-200/40 bg-amber-50/30 p-5">
            <SectionHeader icon="M8 1.5L9.5 5.5 14 6l-3.25 3 .75 4.5L8 11.5 4.5 13.5l.75-4.5L2 6l4.5-.5z" label="Spark Inquiry" />
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted uppercase tracking-wide">Spark Link</label>
                <input
                  type="url"
                  value={sparkLink}
                  onChange={(e) => setSparkLink(e.target.value)}
                  placeholder="https://sparklearningstudio.ai/…"
                  className="w-full mt-1 rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground placeholder:text-muted outline-none focus:border-amber-300 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase tracking-wide">Status</label>
                <div className="flex items-center gap-1.5 mt-1">
                  {(["not-started", "in-progress", "deployed"] as SparkStatus[]).map((s) => {
                    const meta = SPARK_STATUS_META[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSparkStatus(s)}
                        className={`text-[10px] px-2 py-1 rounded font-medium transition-colors ${
                          sparkStatus === s ? meta.bg + " " + meta.color : "text-muted/40 hover:text-muted"
                        }`}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-amber-200/30 pt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleSparkExport}
                  className="w-full text-[11px] text-amber-700 hover:text-amber-800 bg-amber-100/50 hover:bg-amber-100 rounded-lg px-3 py-2 transition-colors font-medium"
                >
                  {sparkExporting ? "Copied!" : "Copy 5E export to clipboard"}
                </button>
                <button
                  type="button"
                  onClick={handleSparkDownload}
                  className="w-full text-[11px] text-amber-600/60 hover:text-amber-700 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Download as JSON
                </button>
              </div>
            </div>
          </section>

          {/* ── Linked Rubrics ── */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <SectionHeader icon="M2 2h12v12H2zM5 5.5h6M5 8h6M5 10.5h4" label="Rubrics" count={rubricIds.length} />
            {allRubrics.length > 0 ? (
              <div className="space-y-1.5">
                {allRubrics.filter((r) => r.status !== "archived").map((rubric) => (
                  <button
                    key={rubric.id}
                    type="button"
                    onClick={() => toggleRubric(rubric.id)}
                    className={`w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] transition-colors ${
                      rubricIds.includes(rubric.id)
                        ? "bg-accent/5 text-accent font-medium"
                        : "text-foreground/60 hover:bg-surface-raised"
                    }`}
                  >
                    <span className={`size-3 rounded border shrink-0 flex items-center justify-center ${
                      rubricIds.includes(rubric.id) ? "border-accent bg-accent text-white" : "border-border"
                    }`}>
                      {rubricIds.includes(rubric.id) && (
                        <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 8l4 4 6-8" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 truncate">{rubric.title}</span>
                    <span className="text-[10px] text-muted tabular-nums shrink-0">{rubric.totalPoints}pts</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted">
                No rubrics yet.{" "}
                <Link href="/rubrics" className="text-accent hover:text-accent/80 transition-colors">Create one &rarr;</Link>
              </p>
            )}
          </section>

          {/* ── Linked Resources ── */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <SectionHeader icon="M3 2h10v12H3zM6 5h4M6 7.5h4" label="Resources" count={linkedResourceIds.length} />
            {allTools.length > 0 && (
              <>
                {!showPicker ? (
                  <button type="button" onClick={() => setShowPicker(true)} className="text-[11px] text-accent/60 hover:text-accent transition-colors">
                    + Link a tool
                  </button>
                ) : (
                  <div className="space-y-1 mb-2">
                    {allTools.map((tool) => {
                      const linked = linkedResourceIds.includes(tool.id);
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            setLinkedResourceIds((prev) =>
                              linked ? prev.filter((r) => r !== tool.id) : [...prev, tool.id]
                            );
                          }}
                          className={`w-full text-left flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] transition-colors ${
                            linked ? "bg-accent/5 text-accent" : "text-foreground/60 hover:bg-surface-raised"
                          }`}
                        >
                          {tool.title}
                        </button>
                      );
                    })}
                    <button type="button" onClick={() => setShowPicker(false)} className="text-[10px] text-muted hover:text-foreground transition-colors mt-1">
                      Done
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ── Reflection Timeline ── */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <SectionHeader icon="M8 3.5v9M3.5 8h9" label="Reflections" count={reflections.length} />
            {reflections.length > 0 && (
              <div className="space-y-3 mb-4">
                {reflections.map((ref) => (
                  <div key={ref.id} className="border-l-2 border-violet-200 pl-3 py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-muted tabular-nums">{ref.dateTaught}</span>
                      {ref.studentEngagement && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          ref.studentEngagement === "high" ? "bg-emerald-50 text-emerald-600" :
                          ref.studentEngagement === "medium" ? "bg-amber-50 text-amber-600" :
                          "bg-rose-50 text-rose-500"
                        }`}>
                          {ref.studentEngagement}
                        </span>
                      )}
                    </div>
                    {ref.whatWorked && (
                      <p className="text-[11px] text-foreground/70"><span className="text-emerald-500 font-medium">Worked:</span> {ref.whatWorked}</p>
                    )}
                    {ref.whatToChange && (
                      <p className="text-[11px] text-foreground/70"><span className="text-amber-500 font-medium">Change:</span> {ref.whatToChange}</p>
                    )}
                    {ref.notes && (
                      <p className="text-[11px] text-muted mt-0.5">{ref.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Legacy reflection (backward compat) */}
            {reflection.trim() && (
              <div className="border-t border-border pt-3 mb-3">
                <label className="text-[10px] text-muted uppercase tracking-wide">Legacy reflection</label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={3}
                  className="w-full mt-1 rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors resize-none"
                />
              </div>
            )}

            {!showReflectionForm ? (
              <button type="button" onClick={() => setShowReflectionForm(true)} className="text-[11px] text-accent/60 hover:text-accent transition-colors">
                + Add reflection
              </button>
            ) : (
              <div className="space-y-3 border-t border-border pt-3">
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wide">Date taught</label>
                  <input type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} aria-label="Date taught" className="w-full mt-1 rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground outline-none focus:border-accent/30" />
                </div>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wide">What worked</label>
                  <textarea value={refWorked} onChange={(e) => setRefWorked(e.target.value)} rows={2} placeholder="What went well…" className="w-full mt-1 rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 resize-none" />
                </div>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wide">What to change</label>
                  <textarea value={refChange} onChange={(e) => setRefChange(e.target.value)} rows={2} placeholder="What to adjust next time…" className="w-full mt-1 rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 resize-none" />
                </div>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wide">Student engagement</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    {ENGAGEMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRefEngagement(refEngagement === opt.value ? null : opt.value)}
                        className={`text-[10px] px-2.5 py-1 rounded font-medium transition-colors ${
                          refEngagement === opt.value
                            ? opt.value === "high" ? "bg-emerald-50 text-emerald-600" : opt.value === "medium" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-500"
                            : "text-muted/40 hover:text-muted"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wide">Notes</label>
                  <textarea value={refNotes} onChange={(e) => setRefNotes(e.target.value)} rows={2} placeholder="Additional notes…" className="w-full mt-1 rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground placeholder:text-muted outline-none focus:border-accent/30 resize-none" />
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={addReflection} className="text-[11px] text-accent font-medium hover:text-accent/80 transition-colors">Save reflection</button>
                  <button type="button" onClick={() => setShowReflectionForm(false)} className="text-[11px] text-muted hover:text-foreground transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </section>

          {/* ── Taught date + last taught ── */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <SectionHeader icon="M2 3h12v11H2zM5 1.5v3M11 1.5v3" label="Dates" />
            <div>
              <label className="text-[10px] text-muted uppercase tracking-wide">Last taught</label>
              <input
                type="date"
                value={lastTaughtAt}
                onChange={(e) => setLastTaughtAt(e.target.value)}
                aria-label="Last taught date"
                className="w-full mt-1 rounded-lg border border-border bg-transparent px-3 py-2 text-[12px] text-foreground outline-none focus:border-accent/30"
              />
            </div>
            {taughtDates.length > 0 && (
              <div className="mt-3">
                <label className="text-[10px] text-muted uppercase tracking-wide">Taught dates</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {taughtDates.map((d) => (
                    <span key={d} className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-muted tabular-nums">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ── Primitives ── */

function FieldGroup({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function SectionHeader({ icon, label, count }: { icon: string; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
        <path d={icon} />
      </svg>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</h3>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] text-muted tabular-nums">{count}</span>
      )}
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

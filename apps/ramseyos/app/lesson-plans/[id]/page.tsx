"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  getLessonPlan,
  updateLessonPlan,
  type LessonPlan,
  type SparkStatus,
  type MaterialItem,
} from "@/lib/lesson-plans";
import { Timestamp } from "firebase/firestore";
import { getActiveTools, type ToolItem } from "@/lib/tools";
import { getActiveVendors, type VendorItem } from "@/lib/vendors";
import { trackRecent } from "@/lib/recents";
import Link from "next/link";

const SPARK_STATUS_META: Record<SparkStatus, { label: string; color: string; bg: string; ring: string }> = {
  "not-started": { label: "Not started", color: "text-muted/50", bg: "bg-white/8", ring: "ring-white/15" },
  "in-progress": { label: "In progress", color: "text-amber-400", bg: "bg-amber-500/15", ring: "ring-amber-400/30" },
  deployed: { label: "Deployed", color: "text-emerald-400", bg: "bg-emerald-500/15", ring: "ring-emerald-400/30" },
};

export default function LessonPlanEditorPage() {
  const { id } = useParams<{ id: string }>();

  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [reflection, setReflection] = useState("");
  const [lastTaughtAt, setLastTaughtAt] = useState("");
  const [linkedResourceIds, setLinkedResourceIds] = useState<string[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [sparkLink, setSparkLink] = useState("");
  const [sparkStatus, setSparkStatus] = useState<SparkStatus>("not-started");
  const [allTools, setAllTools] = useState<ToolItem[]>([]);
  const [allVendors, setAllVendors] = useState<VendorItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
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

  useEffect(() => {
    Promise.all([getLessonPlan(id), getActiveTools(), getActiveVendors()]).then(
      ([p, tools, vendors]) => {
        setAllTools(tools);
        setAllVendors(vendors);
        if (!p) {
          setLoading(false);
          return;
        }
        setPlan(p);
        trackRecent({ id: `lesson-${p.id}`, label: p.title, href: `/lesson-plans/${p.id}`, category: "lesson", detail: p.course });
        setTitle(p.title);
        setCourse(p.course);
        setDescription(p.description);
        setTagInput(p.tags.join(", "));
        setReflection(p.reflection ?? "");
        setLinkedResourceIds(p.linkedResourceIds ?? []);
        setMaterials(p.materials ?? []);
        setSparkLink(p.sparkLink ?? "");
        setSparkStatus(p.sparkStatus ?? "not-started");
        setLastTaughtAt(
          p.lastTaughtAt
            ? p.lastTaughtAt.toDate().toISOString().slice(0, 10)
            : ""
        );
        setLoading(false);
      }
    );
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
      materials,
      sparkLink,
      sparkStatus,
      lastTaughtAt: lastTaughtAt
        ? Timestamp.fromDate(new Date(lastTaughtAt + "T00:00:00"))
        : null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [
    id, title, course, description, tagInput, reflection,
    linkedResourceIds, materials, sparkLink, sparkStatus, lastTaughtAt, saving,
  ]);

  const addMaterial = useCallback(() => {
    const name = matName.trim();
    if (!name) return;
    const vendor = matVendorId
      ? allVendors.find((v) => v.id === matVendorId)
      : null;
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
        ...(matPurchaseNotes.trim()
          ? { purchaseNotes: matPurchaseNotes.trim() }
          : {}),
      },
    ]);
    setMatName("");
    setMatQty("");
    setMatNotes("");
    setMatSource("");
    setMatUrl("");
    setMatVendorId("");
    setMatFavorite(false);
    setMatRecurring(false);
    setMatNeedToBuy(false);
    setMatPurchaseNotes("");
    setShowMaterialForm(false);
  }, [
    matName, matQty, matNotes, matSource, matUrl, matVendorId, allVendors,
    matFavorite, matRecurring, matNeedToBuy, matPurchaseNotes,
  ]);

  const removeMaterial = useCallback((index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted/40">Loading lesson…</span>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-10 pb-20">
        <Link
          href="/lesson-plans"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Lesson Plans
        </Link>
        <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-10 text-center mt-6">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted/25 mb-4">
            <rect x="3" y="1" width="10" height="14" rx="1.5" />
            <path d="M5.5 5h5M5.5 8h3" />
          </svg>
          <p className="text-sm text-muted/60">Lesson plan not found</p>
          <p className="text-[12px] text-muted/35 mt-1">
            It may have been removed or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const needToBuyCount = materials.filter((m) => m.needToBuy).length;
  const sparkMeta = SPARK_STATUS_META[sparkStatus];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* ── Header: navigation + status + save ── */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/lesson-plans"
            className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
          >
            &larr; Lesson Plans
          </Link>
          {course && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-sky-500/10 text-sky-400">
              {course}
            </span>
          )}
          {sparkLink.trim() && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${sparkMeta.bg} ${sparkMeta.color}`}>
              Spark: {sparkMeta.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="size-1 rounded-full bg-emerald-400" />
              Saved
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

      {/* ── Studio layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

        {/* ── Left: Lesson Editor + Materials ── */}
        <div className="space-y-6">
          {/* Editor surface */}
          <section className="bg-surface/50 rounded-xl border border-border/50 p-6 sm:p-8 backdrop-blur-sm">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title"
              className="w-full text-xl sm:text-2xl font-semibold text-foreground tracking-tight bg-transparent border-none outline-none placeholder:text-muted/30 mb-6"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <FieldGroup label="Course">
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. AP Chemistry"
                  className="w-full rounded-lg border border-border/50 bg-white/5 px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors"
                />
              </FieldGroup>
              <FieldGroup label="Tags">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="inquiry, atomic structure, lab"
                  className="w-full rounded-lg border border-border/50 bg-white/5 px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors"
                />
              </FieldGroup>
            </div>

            <FieldGroup label="Lesson Plan">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your lesson — objectives, activities, key questions, assessment…"
                rows={14}
                className="w-full rounded-lg border border-border/50 bg-white/5 px-4 py-3 text-[13px] text-foreground leading-[1.8] placeholder:text-muted/30 outline-none focus:border-accent/30 transition-colors resize-none"
              />
            </FieldGroup>
          </section>

          {/* ── Materials & Supplies ── */}
          <section className="bg-surface/50 rounded-xl border border-border/50 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
                <path d="M3 3h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" />
              </svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Materials & Supplies
              </h3>
              {materials.length > 0 && (
                <span className="text-[9px] text-muted/40 tabular-nums">
                  {materials.length}
                </span>
              )}
              {needToBuyCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400/70 font-medium">
                  {needToBuyCount} to buy
                </span>
              )}
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <Link
                  href="/materials"
                  className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors"
                >
                  Library
                </Link>
                <Link
                  href="/purchasing"
                  className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors"
                >
                  Purchasing
                </Link>
              </div>
            </div>

            {materials.length > 0 && (
              <div className="space-y-2 mb-3">
                {materials.map((mat, i) => (
                  <MaterialRow
                    key={i}
                    mat={mat}
                    vendors={allVendors}
                    onRemove={() => removeMaterial(i)}
                  />
                ))}
              </div>
            )}

            {!showMaterialForm ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowMaterialForm(true)}
                  className="text-[11px] text-accent/60 hover:text-accent transition-colors"
                >
                  + Add material
                </button>
                {materials.length === 0 && (
                  <p className="text-[10px] text-muted/30 mt-1">
                    Add materials needed for this lesson. They&#39;ll appear in your{" "}
                    <Link href="/purchasing" className="text-accent/40 hover:text-accent/60 transition-colors">
                      purchasing workflow
                    </Link>
                    .
                  </p>
                )}
              </div>
            ) : (
              <MaterialForm
                matName={matName} setMatName={setMatName}
                matQty={matQty} setMatQty={setMatQty}
                matNotes={matNotes} setMatNotes={setMatNotes}
                matSource={matSource} setMatSource={setMatSource}
                matUrl={matUrl} setMatUrl={setMatUrl}
                matVendorId={matVendorId} setMatVendorId={setMatVendorId}
                matFavorite={matFavorite} setMatFavorite={setMatFavorite}
                matRecurring={matRecurring} setMatRecurring={setMatRecurring}
                matNeedToBuy={matNeedToBuy} setMatNeedToBuy={setMatNeedToBuy}
                matPurchaseNotes={matPurchaseNotes} setMatPurchaseNotes={setMatPurchaseNotes}
                allVendors={allVendors}
                onAdd={addMaterial}
                onCancel={() => {
                  setShowMaterialForm(false);
                  setMatVendorId("");
                  setMatFavorite(false);
                  setMatRecurring(false);
                  setMatNeedToBuy(false);
                  setMatPurchaseNotes("");
                }}
              />
            )}
          </section>
        </div>

        {/* ── Right: Studio Panels ── */}
        <div className="space-y-4">
          {/* Studio zone label */}
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/30">
              <rect x="2" y="2" width="5" height="5" rx="1" />
              <rect x="9" y="2" width="5" height="5" rx="1" />
              <rect x="2" y="9" width="5" height="5" rx="1" />
              <rect x="9" y="9" width="5" height="5" rx="1" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted/35">
              Teaching Studio
            </span>
            <div className="flex-1 border-t border-border/50" />
          </div>
          {/* ── Spark Inquiry Studio — companion panel ── */}
          <section className="rounded-xl border border-amber-400/15 bg-amber-500/[0.02] p-5 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-4">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-amber-500">
                <path
                  d="M8 1l2 3h3l-2.5 2.5L11.5 10 8 8l-3.5 2 1-3.5L3 4h3l2-3z"
                  fill="currentColor"
                />
              </svg>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/80">
                Spark Inquiry Studio
              </h3>
              <span className="text-[9px] text-amber-400/25">companion</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-muted/50 mb-1 block">
                  Spark module link
                </label>
                <input
                  type="url"
                  value={sparkLink}
                  onChange={(e) => setSparkLink(e.target.value)}
                  placeholder="https://sparklearningstudio.ai/…"
                  className="w-full rounded-md border border-amber-400/15 bg-white/5 px-3 py-2 text-[12px] text-foreground placeholder:text-muted/40 outline-none focus:border-amber-300/40 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted/50 mb-1.5 block">
                  Status
                </label>
                <div className="flex gap-1.5">
                  {(["not-started", "in-progress", "deployed"] as const).map(
                    (s) => {
                      const meta = SPARK_STATUS_META[s];
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSparkStatus(s)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                            sparkStatus === s
                              ? `${meta.bg} ${meta.color} ring-1 ${meta.ring}`
                              : "bg-white/[0.04] text-muted/40 hover:text-muted/60"
                          }`}
                        >
                          {meta.label}
                        </button>
                      );
                    }
                  )}
                </div>
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
                <p className="text-[10px] text-amber-400/35 leading-relaxed">
                  Link this lesson to a Spark module to track its inquiry design alongside your plan.
                </p>
              )}
            </div>
          </section>

          {/* ── Linked Resources ── */}
          <StudioPanel
            icon="M2 2h12a1 1 0 011 1v10a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z"
            title="Linked Resources"
            count={linkedResourceIds.length}
            action={<Link href="/tools" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">Tools</Link>}
          >
            {linkedResourceIds.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {linkedResourceIds.map((rid) => {
                  const tool = allTools.find((t) => t.id === rid);
                  if (!tool) return null;
                  return (
                    <div
                      key={rid}
                      className="group flex items-center gap-2 rounded-md bg-white/[0.03] border border-border/40 px-3 py-2"
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
              <div className="rounded-md border border-border/40 bg-white/[0.03] p-2 space-y-0.5">
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
                      className="w-full text-left rounded px-2 py-1.5 hover:bg-white/5 transition-colors"
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
              <p className="text-[10px] text-muted/30 mt-1">
                No resources linked yet.
              </p>
            )}
          </StudioPanel>

          {/* ── Lesson Reflection — lifecycle closing ── */}
          <StudioPanel
            icon="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"
            title="Reflection"
          >
            <div className="flex items-center gap-2 mb-3">
              <label className="text-[10px] font-medium text-muted/50">
                Last taught
              </label>
              <input
                type="date"
                value={lastTaughtAt}
                onChange={(e) => setLastTaughtAt(e.target.value)}
                aria-label="Last taught date"
                className="rounded-md border border-border/40 bg-white/5 px-2 py-1 text-[11px] text-foreground outline-none focus:border-accent/30 transition-colors"
              />
            </div>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What worked? What would you change next time?"
              rows={5}
              className="w-full rounded-lg border border-border/40 bg-white/[0.03] px-3 py-2.5 text-[13px] text-foreground leading-relaxed placeholder:text-muted/30 outline-none focus:border-accent/30 transition-colors resize-none"
            />
          </StudioPanel>
        </div>
      </div>

      {/* ── Teaching workflow links ── */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/30">
        <span className="text-[10px] text-muted/25">Teaching flow:</span>
        <Link href="/materials" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
          Materials
        </Link>
        <Link href="/purchasing" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
          Purchasing
        </Link>
        <Link href="/communications" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
          Comms
        </Link>
        <Link href="/tools" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
          Tools
        </Link>
      </div>

      {/* ── Bottom save (mobile convenience) ── */}
      <div className="flex items-center justify-end gap-3 mt-8">
        {saved && (
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="size-1 rounded-full bg-emerald-400" />
            Saved
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-accent px-5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

/* ── Studio panel wrapper ── */

function StudioPanel({
  icon,
  title,
  count,
  action,
  children,
}: {
  icon: string;
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/50 bg-surface/50 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
          <path d={icon} />
        </svg>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {title}
        </h3>
        {count !== undefined && count > 0 && (
          <span className="text-[9px] text-muted/40 tabular-nums">
            {count}
          </span>
        )}
        {action && <div className="flex-1" />}
        {action}
      </div>
      {children}
    </section>
  );
}

/* ── Field group label ── */

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted/60 mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── Material row ── */

function MaterialRow({
  mat,
  vendors,
  onRemove,
}: {
  mat: MaterialItem;
  vendors: VendorItem[];
  onRemove: () => void;
}) {
  const vendor = mat.vendorId
    ? vendors.find((v) => v.id === mat.vendorId)
    : null;

  return (
    <div className="flex items-start gap-3 rounded-lg bg-white/[0.03] border border-border/40 px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-medium text-foreground/80">
            {mat.name}
          </span>
          {mat.favorite && (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="text-amber-400 shrink-0">
              <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12l-4.2 2.5.8-4.7L1.2 6.5l4.7-.7L8 1.5z" />
            </svg>
          )}
          {mat.recurring && (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-blue-400 shrink-0">
              <path d="M12.5 6.5A5 5 0 003.5 8M3.5 9.5A5 5 0 0012.5 8" />
            </svg>
          )}
          {mat.needToBuy && (
            <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-400/20 px-1.5 py-0 text-[9px] font-medium text-rose-400/80 shrink-0">
              buy
            </span>
          )}
          {mat.quantity && (
            <span className="text-[10px] text-muted/50">
              qty: {mat.quantity}
            </span>
          )}
        </div>
        {mat.notes && (
          <p className="text-[10px] text-muted/50 mt-0.5">{mat.notes}</p>
        )}
        {mat.purchaseNotes && (
          <p className="text-[10px] text-rose-500/60 mt-0.5">
            {mat.purchaseNotes}
          </p>
        )}
        {vendor ? (
          <a
            href={vendor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 rounded-full bg-accent/6 border border-accent/12 px-2 py-0.5 text-[10px] font-medium text-accent/70 hover:text-accent hover:border-accent/25 transition-colors"
          >
            {vendor.name} &rarr;
          </a>
        ) : mat.sourceName ? (
          <span className="text-[10px] text-muted/40 mt-0.5 inline-flex items-center gap-1">
            {mat.sourceUrl ? (
              <a
                href={mat.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent/60 hover:text-accent transition-colors"
              >
                {mat.sourceName} &rarr;
              </a>
            ) : (
              mat.sourceName
            )}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-[10px] text-muted/30 hover:text-red-400 transition-colors mt-0.5"
        aria-label={`Remove ${mat.name}`}
      >
        &times;
      </button>
    </div>
  );
}

/* ── Material add form ── */

function MaterialForm({
  matName, setMatName,
  matQty, setMatQty,
  matNotes, setMatNotes,
  matSource, setMatSource,
  matUrl, setMatUrl,
  matVendorId, setMatVendorId,
  matFavorite, setMatFavorite,
  matRecurring, setMatRecurring,
  matNeedToBuy, setMatNeedToBuy,
  matPurchaseNotes, setMatPurchaseNotes,
  allVendors,
  onAdd,
  onCancel,
}: {
  matName: string; setMatName: (v: string) => void;
  matQty: string; setMatQty: (v: string) => void;
  matNotes: string; setMatNotes: (v: string) => void;
  matSource: string; setMatSource: (v: string) => void;
  matUrl: string; setMatUrl: (v: string) => void;
  matVendorId: string; setMatVendorId: (v: string) => void;
  matFavorite: boolean; setMatFavorite: (v: boolean) => void;
  matRecurring: boolean; setMatRecurring: (v: boolean) => void;
  matNeedToBuy: boolean; setMatNeedToBuy: (v: boolean) => void;
  matPurchaseNotes: string; setMatPurchaseNotes: (v: string) => void;
  allVendors: VendorItem[];
  onAdd: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-white/[0.03] p-3 space-y-2.5">
      <input
        type="text"
        value={matName}
        onChange={(e) => setMatName(e.target.value)}
        placeholder="Material name"
        className="w-full rounded-md border border-border/40 px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors"
      />
      <input
        type="text"
        value={matQty}
        onChange={(e) => setMatQty(e.target.value)}
        placeholder="Quantity (optional)"
        className="w-full rounded-md border border-border/40 px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors"
      />

      <div>
        <label className="text-[10px] font-medium text-muted/50 mb-1 block">
          Source
        </label>
        <select
          aria-label="Source vendor"
          value={matVendorId}
          onChange={(e) => {
            setMatVendorId(e.target.value);
            if (e.target.value) {
              setMatSource("");
              setMatUrl("");
            }
          }}
          className="w-full rounded-md border border-border/40 bg-white/5 px-3 py-1.5 text-[12px] text-foreground outline-none focus:border-accent/30 transition-colors"
        >
          <option value="">Manual source…</option>
          {allVendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      {!matVendorId && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={matSource}
            onChange={(e) => setMatSource(e.target.value)}
            placeholder="Source name"
            className="rounded-md border border-border/40 px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors"
          />
          <input
            type="url"
            value={matUrl}
            onChange={(e) => setMatUrl(e.target.value)}
            placeholder="Source URL"
            className="rounded-md border border-border/40 px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors"
          />
        </div>
      )}

      <input
        type="text"
        value={matNotes}
        onChange={(e) => setMatNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full rounded-md border border-border/40 px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors"
      />

      <div className="flex items-center gap-4 pt-0.5">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={matFavorite}
            onChange={(e) => setMatFavorite(e.target.checked)}
            className="rounded border-border/60 text-amber-500 focus:ring-amber-300 w-3.5 h-3.5"
          />
          <span className="text-[11px] text-muted/60">Favorite</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={matRecurring}
            onChange={(e) => setMatRecurring(e.target.checked)}
            className="rounded border-border/60 text-blue-500 focus:ring-blue-300 w-3.5 h-3.5"
          />
          <span className="text-[11px] text-muted/60">Recurring</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={matNeedToBuy}
            onChange={(e) => setMatNeedToBuy(e.target.checked)}
            className="rounded border-border/60 text-rose-500 focus:ring-rose-300 w-3.5 h-3.5"
          />
          <span className="text-[11px] text-muted/60">Need to buy</span>
        </label>
      </div>

      {matNeedToBuy && (
        <input
          type="text"
          value={matPurchaseNotes}
          onChange={(e) => setMatPurchaseNotes(e.target.value)}
          placeholder="Purchase notes"
          className="w-full rounded-md border border-rose-400/20 bg-rose-500/[0.04] px-3 py-1.5 text-[12px] text-foreground placeholder:text-rose-300/60 outline-none focus:border-rose-300 transition-colors"
        />
      )}

      <div className="flex gap-2 pt-0.5">
        <button
          type="button"
          onClick={onAdd}
          disabled={!matName.trim()}
          className="rounded-md bg-accent px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-40"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] text-muted/50 hover:text-foreground/60 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

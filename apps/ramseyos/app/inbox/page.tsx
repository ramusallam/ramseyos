"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createTask } from "@/lib/tasks";
import {
  type CaptureSource,
  type CaptureType,
  SOURCE_META,
} from "@/lib/captures";
import { type Priority, formatTimestamp, PRIORITY_STYLE } from "@/lib/shared";
import Link from "next/link";

/* ── Types ── */

interface Project {
  id: string;
  title: string;
}

interface Capture {
  id: string;
  text: string;
  status: string;
  createdAt: Timestamp | null;
  type?: CaptureType;
  tags?: string[];
  projectId?: string | null;
  priority?: Priority;
  processed?: boolean;
  source?: CaptureSource;
  snoozedUntil?: string | null;
}

/* ── Style maps ── */

const TYPE_META: Record<CaptureType, { label: string; dot: string }> = {
  capture: { label: "Capture", dot: "bg-muted/40" },
  task: { label: "Task", dot: "bg-sky-400" },
  note: { label: "Note", dot: "bg-violet-400" },
  idea: { label: "Idea", dot: "bg-amber-400" },
  resource: { label: "Resource", dot: "bg-emerald-400" },
};

const TYPES: CaptureType[] = ["capture", "task", "note", "idea", "resource"];
const PRIORITIES: { value: Priority; label: string }[] = [
  { value: null, label: "–" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
];

/* ── Smart triage helpers ── */

function detectPriority(text: string): Priority {
  const lower = text.toLowerCase();
  if (/\b(urgent|asap|immediately|critical|deadline today)\b/.test(lower)) return "high";
  if (/\b(important|soon|this week|follow up|reminder)\b/.test(lower)) return "medium";
  return null;
}

function detectType(text: string): CaptureType {
  const lower = text.toLowerCase();
  if (/\b(todo|task|do|fix|send|email|call|buy|submit|grade|review)\b/.test(lower)) return "task";
  if (/\b(idea|what if|maybe|could|brainstorm|explore)\b/.test(lower)) return "idea";
  if (/\b(note|remember|fyi|for reference|log)\b/.test(lower)) return "note";
  if (/\b(link|resource|tool|article|video|site|app)\b/.test(lower)) return "resource";
  return "capture";
}

function getSnoozeDateLabel(date: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const snoozeDate = new Date(date + "T00:00:00");
  const diff = Math.round((snoozeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "today";
  if (diff === 1) return "tomorrow";
  return `in ${diff} days`;
}

/* ── Helpers ── */

async function updateCapture(id: string, fields: Partial<Capture>) {
  await updateDoc(doc(db, "captures", id), fields);
}

async function convertToTask(capture: Capture) {
  await createTask({
    title: capture.text,
    priority: capture.priority,
    sourceCaptureId: capture.id,
    projectId: capture.projectId,
  });
  await updateCapture(capture.id, {
    type: "task",
    processed: true,
    status: "processed",
  });
}

/* ── Page ── */

export default function InboxPage() {
  const [items, setItems] = useState<Capture[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProcessed, setShowProcessed] = useState(false);
  const [showSnoozed, setShowSnoozed] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkConverting, setBulkConverting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "captures"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Capture[]);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      where("archived", "==", false),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, title: d.data().title ?? "Untitled" })));
    });
    return unsub;
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  const unprocessed = useMemo(
    () => items.filter((i) => !i.processed && (!i.snoozedUntil || i.snoozedUntil <= todayStr)),
    [items, todayStr]
  );
  const snoozed = useMemo(
    () => items.filter((i) => !i.processed && i.snoozedUntil && i.snoozedUntil > todayStr),
    [items, todayStr]
  );
  const processed = useMemo(() => items.filter((i) => i.processed), [items]);
  const taskCount = useMemo(() => items.filter((i) => i.type === "task").length, [items]);

  // Toggle selection
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(unprocessed.map((i) => i.id)));
  }, [unprocessed]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setBulkMode(false);
  }, []);

  // Bulk convert selected to tasks
  const bulkConvert = useCallback(async () => {
    if (selected.size === 0) return;
    setBulkConverting(true);
    const toConvert = items.filter((i) => selected.has(i.id) && !i.processed);
    for (const item of toConvert) {
      await convertToTask(item);
    }
    setSelected(new Set());
    setBulkConverting(false);
  }, [selected, items]);

  // Bulk dismiss
  const bulkDismiss = useCallback(async () => {
    if (selected.size === 0) return;
    for (const id of selected) {
      await updateCapture(id, { processed: true, status: "dismissed" });
    }
    setSelected(new Set());
  }, [selected]);

  // Bulk snooze
  const bulkSnooze = useCallback(async (days: number) => {
    if (selected.size === 0) return;
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + days);
    const snoozedUntil = snoozeDate.toISOString().slice(0, 10);
    for (const id of selected) {
      await updateCapture(id, { snoozedUntil });
    }
    setSelected(new Set());
  }, [selected]);

  // Smart triage: auto-detect and apply priority + type to all unprocessed
  const smartTriage = useCallback(async () => {
    for (const item of unprocessed) {
      if (item.type === "capture" && !item.priority) {
        const detectedPriority = detectPriority(item.text);
        const detectedType = detectType(item.text);
        const updates: Partial<Capture> = {};
        if (detectedPriority) updates.priority = detectedPriority;
        if (detectedType !== "capture") updates.type = detectedType;
        if (Object.keys(updates).length > 0) {
          await updateCapture(item.id, updates);
        }
      }
    }
  }, [unprocessed]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading inbox…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* ── Header ── */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors">
            &larr; Today
          </Link>
          <Link href="/capture" className="flex items-center gap-2 text-[12px] text-accent/70 hover:text-accent transition-colors px-3 py-1.5 rounded-xl hover:bg-accent-dim">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Capture
          </Link>
        </div>

        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">Inbox</h1>
        <p className="text-[13px] text-muted/50 mt-1">
          Triage, assign, snooze, or bulk-convert captures to action.
        </p>

        {items.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
            {unprocessed.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span className="tabular-nums">{unprocessed.length} to triage</span>
              </span>
            )}
            {snoozed.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-violet-400" />
                <span className="tabular-nums">{snoozed.length} snoozed</span>
              </span>
            )}
            {taskCount > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span className="tabular-nums">{taskCount} converted</span>
              </span>
            )}
            <span className="tabular-nums">{items.length} total</span>
          </div>
        )}

        <div className="flex items-center gap-3 mt-3">
          <Link href="/tasks" className="text-[11px] text-muted hover:text-accent transition-colors">Tasks &rarr;</Link>
          <Link href="/projects" className="text-[11px] text-muted hover:text-accent transition-colors">Projects &rarr;</Link>
        </div>
      </header>

      {/* ── Toolbar ── */}
      {unprocessed.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            type="button"
            onClick={() => { setBulkMode(!bulkMode); if (bulkMode) clearSelection(); }}
            className={`text-[11px] px-3 py-1.5 rounded-lg transition-colors ${
              bulkMode ? "bg-accent text-white font-semibold" : "bg-surface border border-border text-muted hover:text-foreground"
            }`}
          >
            {bulkMode ? `${selected.size} selected` : "Select"}
          </button>
          {bulkMode && (
            <>
              <button type="button" onClick={selectAll} className="text-[11px] text-muted hover:text-foreground transition-colors">
                All
              </button>
              <button type="button" onClick={clearSelection} className="text-[11px] text-muted hover:text-foreground transition-colors">
                None
              </button>
              <div className="w-px h-4 bg-border" />
              <button
                type="button"
                onClick={bulkConvert}
                disabled={selected.size === 0 || bulkConverting}
                className="text-[11px] font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-40"
              >
                {bulkConverting ? "Converting…" : `Convert ${selected.size} to tasks`}
              </button>
              <button
                type="button"
                onClick={() => bulkSnooze(1)}
                disabled={selected.size === 0}
                className="text-[11px] text-violet-500 hover:text-violet-600 transition-colors disabled:opacity-40"
              >
                Snooze 1d
              </button>
              <button
                type="button"
                onClick={() => bulkSnooze(3)}
                disabled={selected.size === 0}
                className="text-[11px] text-violet-500 hover:text-violet-600 transition-colors disabled:opacity-40"
              >
                3d
              </button>
              <button
                type="button"
                onClick={() => bulkSnooze(7)}
                disabled={selected.size === 0}
                className="text-[11px] text-violet-500 hover:text-violet-600 transition-colors disabled:opacity-40"
              >
                7d
              </button>
              <button
                type="button"
                onClick={bulkDismiss}
                disabled={selected.size === 0}
                className="text-[11px] text-rose-400 hover:text-rose-500 transition-colors disabled:opacity-40"
              >
                Dismiss
              </button>
            </>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={smartTriage}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-surface border border-border text-muted hover:text-accent hover:border-accent/30 transition-colors"
          >
            Smart triage
          </button>
        </div>
      )}

      {/* ── Empty ── */}
      {items.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted mb-4">
            <rect x="2" y="3" width="12" height="10" rx="2" />
            <path d="M2 9h3.5a1 1 0 011 1v0a1 1 0 001 1h1a1 1 0 001-1v0a1 1 0 011-1H14" />
          </svg>
          <p className="text-sm text-muted/60 font-medium">Inbox clear</p>
          <p className="text-[12px] text-muted mt-1">
            Capture from the sidebar or the <Link href="/capture" className="text-accent/50 hover:text-accent transition-colors">capture page</Link>.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-8">
          {/* ── Needs Triage ── */}
          {unprocessed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400/60">
                  <rect x="2" y="3" width="12" height="10" rx="2" />
                  <path d="M2 9h3.5a1 1 0 011 1v0a1 1 0 001 1h1a1 1 0 001-1v0a1 1 0 011-1H14" />
                </svg>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Needs Triage</h2>
                <span className="text-[10px] text-muted tabular-nums">{unprocessed.length}</span>
                <div className="flex-1 border-t border-border" />
              </div>
              <ul className="space-y-2">
                {unprocessed.map((item) => (
                  <InboxItem
                    key={item.id}
                    item={item}
                    projects={projects}
                    bulkMode={bulkMode}
                    isSelected={selected.has(item.id)}
                    onToggleSelect={() => toggleSelect(item.id)}
                  />
                ))}
              </ul>
            </section>
          )}

          {/* All triaged banner */}
          {unprocessed.length === 0 && snoozed.length === 0 && (
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-50/50 p-6 text-center">
              <div className="flex items-center justify-center gap-2.5">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span className="text-[13px] text-emerald-600">All triaged — inbox clear</span>
              </div>
            </div>
          )}

          {/* ── Snoozed ── */}
          {snoozed.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowSnoozed(!showSnoozed)}
                className="flex items-center gap-2 mb-4 group w-full"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400/60">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v3l2 1.5" />
                </svg>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Snoozed</h2>
                <span className="text-[10px] text-muted tabular-nums">{snoozed.length}</span>
                <div className="flex-1 border-t border-border" />
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted transition-transform ${showSnoozed ? "rotate-180" : ""}`}>
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              {showSnoozed && (
                <ul className="space-y-2">
                  {snoozed.map((item) => (
                    <li key={item.id} className="rounded-xl border border-border bg-surface px-4 py-3 opacity-60 flex items-center gap-3">
                      <span className="text-[13px] text-foreground/70 flex-1">{item.text}</span>
                      <span className="text-[10px] text-violet-500 shrink-0">
                        Returns {getSnoozeDateLabel(item.snoozedUntil!)}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCapture(item.id, { snoozedUntil: null })}
                        className="text-[10px] text-muted hover:text-foreground transition-colors shrink-0"
                      >
                        Wake
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ── Processed ── */}
          {processed.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowProcessed(!showProcessed)}
                className="flex items-center gap-2 mb-4 group w-full"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <path d="M5.5 8l2 2 3-4" />
                </svg>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Processed</h2>
                <span className="text-[10px] text-muted tabular-nums">{processed.length}</span>
                <div className="flex-1 border-t border-border" />
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted transition-transform ${showProcessed ? "rotate-180" : ""}`}>
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              {showProcessed && (
                <ul className="space-y-2">
                  {processed.map((item) => (
                    <InboxItem key={item.id} item={item} projects={projects} bulkMode={false} isSelected={false} onToggleSelect={() => {}} />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Inbox Item ── */

function InboxItem({
  item,
  projects,
  bulkMode,
  isSelected,
  onToggleSelect,
}: {
  item: Capture;
  projects: Project[];
  bulkMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const isProcessed = item.processed ?? false;
  const isTask = item.type === "task";
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const typeMeta = TYPE_META[item.type ?? "capture"];
  const sourceMeta = SOURCE_META[item.source ?? "manual"];

  async function handleConvert() {
    if (converting) return;
    setConverting(true);
    try {
      await convertToTask(item);
      setConverted(true);
      setTimeout(() => setConverted(false), 2000);
    } finally {
      setConverting(false);
    }
  }

  async function handleSnooze(days: number) {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + days);
    await updateCapture(item.id, { snoozedUntil: snoozeDate.toISOString().slice(0, 10) });
    setShowSnooze(false);
  }

  async function handleDismiss() {
    await updateCapture(item.id, { processed: true, status: "dismissed" });
  }

  return (
    <li className={`rounded-xl border border-border bg-surface px-4 py-4 transition-all hover:bg-surface-raised/30 ${isProcessed ? "opacity-35" : ""} ${isSelected ? "ring-2 ring-accent/30" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Bulk checkbox or process toggle */}
        {bulkMode && !isProcessed ? (
          <button
            type="button"
            onClick={onToggleSelect}
            className={`mt-1 size-5 shrink-0 rounded-lg border-2 transition-colors flex items-center justify-center ${
              isSelected ? "border-accent bg-accent/20" : "border-border-strong hover:border-foreground/30"
            }`}
            aria-label={isSelected ? "Deselect" : "Select"}
          >
            {isSelected && (
              <svg viewBox="0 0 16 16" className="size-3.5 text-accent">
                <path d="M4.5 8.5L7 11l4.5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => updateCapture(item.id, { processed: !isProcessed, status: !isProcessed ? "processed" : "unprocessed" })}
            className={`mt-1 size-5 shrink-0 rounded-lg border-2 transition-colors flex items-center justify-center ${
              isProcessed ? "border-accent/40 bg-accent/20" : "border-border-strong hover:border-foreground/30"
            }`}
            aria-label={isProcessed ? "Mark unprocessed" : "Mark processed"}
          >
            {isProcessed && (
              <svg viewBox="0 0 16 16" className="size-3.5 text-accent">
                <path d="M4.5 8.5L7 11l4.5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <p className={`text-[14px] leading-relaxed ${isProcessed ? "text-muted/50 line-through" : "text-foreground/90"}`}>
            {item.text}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 mt-1.5">
          {!isProcessed && item.type && item.type !== "capture" && (
            <span className="flex items-center gap-1">
              <span className={`size-1.5 rounded-full ${typeMeta.dot}`} />
              <span className="text-[10px] text-muted">{typeMeta.label.toLowerCase()}</span>
            </span>
          )}
          <span className={`text-[10px] ${sourceMeta.color}`}>{sourceMeta.label.toLowerCase()}</span>
        </div>
      </div>

      {/* Triage controls */}
      {!isProcessed && (
        <div className="flex items-center gap-2 mt-3 ml-8 flex-wrap">
          <select
            aria-label="Capture type"
            value={item.type ?? "capture"}
            onChange={(e) => updateCapture(item.id, { type: e.target.value as CaptureType })}
            className="bg-surface-raised/50 rounded-lg text-[11px] text-muted/70 outline-none cursor-pointer hover:text-foreground/60 transition-colors px-2 py-1.5 border border-border"
          >
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <div className="flex items-center gap-0.5 bg-surface-raised/30 rounded-lg p-0.5">
            {PRIORITIES.map(({ value, label }) => {
              const isActive = (item.priority ?? null) === value;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => updateCapture(item.id, { priority: value })}
                  className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                    isActive
                      ? value ? PRIORITY_STYLE[value] ?? "bg-surface-raised text-muted/60" : "bg-surface-raised text-muted/60"
                      : "text-muted hover:text-muted/60"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <select
            aria-label="Assign project"
            value={item.projectId ?? ""}
            onChange={(e) => updateCapture(item.id, { projectId: e.target.value || null })}
            className="bg-surface-raised/50 rounded-lg text-[11px] text-muted/70 outline-none cursor-pointer hover:text-foreground/60 transition-colors px-2 py-1.5 border border-border max-w-[160px] truncate"
          >
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>

          <div className="flex-1" />

          {/* Snooze */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSnooze(!showSnooze)}
              className="text-[11px] text-violet-500/60 hover:text-violet-500 transition-colors px-2 py-1"
            >
              Snooze
            </button>
            {showSnooze && (
              <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg p-1.5 z-10 flex flex-col gap-0.5 min-w-[100px]">
                <button type="button" onClick={() => handleSnooze(1)} className="text-[11px] text-left px-3 py-1.5 rounded hover:bg-surface-raised text-foreground/70">Tomorrow</button>
                <button type="button" onClick={() => handleSnooze(3)} className="text-[11px] text-left px-3 py-1.5 rounded hover:bg-surface-raised text-foreground/70">3 days</button>
                <button type="button" onClick={() => handleSnooze(7)} className="text-[11px] text-left px-3 py-1.5 rounded hover:bg-surface-raised text-foreground/70">1 week</button>
              </div>
            )}
          </div>

          {/* Dismiss */}
          <button type="button" onClick={handleDismiss} className="text-[11px] text-muted/30 hover:text-rose-500 transition-colors px-2 py-1">
            Dismiss
          </button>

          {/* Convert */}
          {converted ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-500 px-3 py-1.5">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5l3 3 5-6" /></svg>
              Converted
            </span>
          ) : (
            <button
              type="button"
              onClick={handleConvert}
              disabled={converting}
              className="flex items-center gap-1.5 text-[11px] font-medium text-accent/80 hover:text-accent transition-colors disabled:opacity-40 px-3 py-1.5 rounded-lg hover:bg-accent-dim"
            >
              {converting ? "Converting…" : (
                <>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                  Task
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Processed meta */}
      {isProcessed && (
        <div className="flex items-center gap-2.5 mt-2 ml-8">
          {isTask && (
            <span className="text-[10px] text-emerald-500/50 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400/50" />
              converted to task
            </span>
          )}
          {item.status === "dismissed" && (
            <span className="text-[10px] text-muted/50">dismissed</span>
          )}
          {item.projectId && (
            <span className="text-[10px] text-muted">
              → {projects.find((p) => p.id === item.projectId)?.title ?? "project"}
            </span>
          )}
          {item.createdAt && (
            <span className="text-[10px] text-muted">{formatTimestamp(item.createdAt)}</span>
          )}
        </div>
      )}
    </li>
  );
}

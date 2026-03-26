"use client";

import { useEffect, useMemo, useState } from "react";
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

/* ── Helpers ── */

async function updateCapture(id: string, fields: Partial<Capture>) {
  await updateDoc(doc(db, "captures", id), fields);
}

async function convertToTask(capture: Capture) {
  try {
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
  } catch (err) {
    console.error("Failed to convert capture to task:", err);
    throw err;
  }
}

/* ── Page ── */

export default function InboxPage() {
  const [items, setItems] = useState<Capture[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProcessed, setShowProcessed] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "captures"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Capture[]
        );
        setLoading(false);
      },
      (err) => {
        console.error("Captures listener error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      where("archived", "==", false),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setProjects(
          snap.docs.map((d) => ({ id: d.id, title: d.data().title ?? "Untitled" }))
        );
      },
      (err) => console.error("Projects listener error:", err)
    );
    return unsub;
  }, []);

  const unprocessed = useMemo(
    () => items.filter((i) => !i.processed),
    [items]
  );
  const processed = useMemo(
    () => items.filter((i) => i.processed),
    [items]
  );
  const taskCount = useMemo(
    () => items.filter((i) => i.type === "task").length,
    [items]
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted/40">Loading inbox…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* ── Header ── */}
      <header className="mb-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
          >
            &larr; Today
          </Link>
          <Link
            href="/capture"
            className="flex items-center gap-2 text-[12px] text-accent/70 hover:text-accent transition-colors px-3 py-1.5 rounded-xl hover:bg-accent-dim"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Capture
          </Link>
        </div>

        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">
          Inbox
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          Everything you capture lands here. Triage, assign, and convert to action.
        </p>

        {/* Stat bar */}
        {items.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted/40">
            {unprocessed.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span className="tabular-nums">{unprocessed.length} to triage</span>
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

        {/* Cross-links */}
        <div className="flex items-center gap-3 mt-3">
          <Link href="/tasks" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Tasks &rarr;
          </Link>
          <Link href="/projects" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Projects &rarr;
          </Link>
        </div>
      </header>

      {/* ── Empty ── */}
      {items.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted/25 mb-4">
            <rect x="2" y="3" width="12" height="10" rx="2" />
            <path d="M2 9h3.5a1 1 0 011 1v0a1 1 0 001 1h1a1 1 0 001-1v0a1 1 0 011-1H14" />
          </svg>
          <p className="text-sm text-muted/60 font-medium">Inbox clear</p>
          <p className="text-[12px] text-muted/35 mt-1">
            Capture from the sidebar, the{" "}
            <Link href="/capture" className="text-accent/50 hover:text-accent transition-colors">
              capture page
            </Link>
            , or any future channel.
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
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Needs Triage
                </h2>
                <span className="text-[10px] text-muted/40 tabular-nums">
                  {unprocessed.length}
                </span>
                <div className="flex-1 border-t border-border/40" />
              </div>
              <ul className="space-y-2">
                {unprocessed.map((item) => (
                  <InboxItem
                    key={item.id}
                    item={item}
                    projects={projects}
                  />
                ))}
              </ul>
            </section>
          )}

          {/* All triaged banner */}
          {unprocessed.length === 0 && (
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] backdrop-blur-sm p-6 text-center">
              <div className="flex items-center justify-center gap-2.5">
                <span className="size-2 rounded-full bg-emerald-400/60" />
                <span className="text-[13px] text-emerald-400/70">
                  All triaged — inbox clear
                </span>
              </div>
              <p className="text-[11px] text-muted/30 mt-2">
                {taskCount > 0
                  ? `${taskCount} item${taskCount !== 1 ? "s" : ""} converted to tasks.`
                  : "Nothing to process right now."}
              </p>
            </div>
          )}

          {/* ── Processed ── */}
          {processed.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowProcessed(!showProcessed)}
                className="flex items-center gap-2 mb-4 group w-full"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/30">
                  <path d="M5.5 8l2 2 3-4" />
                </svg>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted/40">
                  Processed
                </h2>
                <span className="text-[10px] text-muted/30 tabular-nums">{processed.length}</span>
                <div className="flex-1 border-t border-border/30" />
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-muted/30 transition-transform ${showProcessed ? "rotate-180" : ""}`}
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              {showProcessed && (
                <ul className="space-y-2">
                  {processed.map((item) => (
                    <InboxItem
                      key={item.id}
                      item={item}
                      projects={projects}
                    />
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

function InboxItem({ item, projects }: { item: Capture; projects: Project[] }) {
  const isProcessed = item.processed ?? false;
  const isTask = item.type === "task";
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);
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

  return (
    <li
      className={`rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm px-4 py-4 transition-all hover:bg-surface-raised/30 ${
        isProcessed ? "opacity-35" : ""
      }`}
    >
      {/* Row 1: checkbox + text + meta */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() =>
            updateCapture(item.id, {
              processed: !isProcessed,
              status: !isProcessed ? "processed" : "unprocessed",
            })
          }
          className={`mt-1 size-5 shrink-0 rounded-lg border-2 transition-colors flex items-center justify-center ${
            isProcessed
              ? "border-accent/40 bg-accent/20"
              : "border-border-strong hover:border-foreground/30"
          }`}
          aria-label={isProcessed ? "Mark unprocessed" : "Mark processed"}
        >
          {isProcessed && (
            <svg viewBox="0 0 16 16" className="size-3.5 text-accent">
              <path
                d="M4.5 8.5L7 11l4.5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-[14px] leading-relaxed ${isProcessed ? "text-muted/50 line-through" : "text-foreground/90"}`}>
            {item.text}
          </p>
        </div>

        {/* Right-side meta: type dot + source */}
        <div className="flex items-center gap-2.5 shrink-0 mt-1.5">
          {!isProcessed && item.type && item.type !== "capture" && (
            <span className="flex items-center gap-1">
              <span className={`size-1.5 rounded-full ${typeMeta.dot}`} />
              <span className="text-[10px] text-muted/40">{typeMeta.label.toLowerCase()}</span>
            </span>
          )}
          <span className={`text-[10px] ${sourceMeta.color}`}>
            {sourceMeta.label.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Row 2: triage controls */}
      {!isProcessed && (
        <div className="flex items-center gap-2 mt-3 ml-8 flex-wrap">
          {/* Type */}
          <select
            aria-label="Capture type"
            value={item.type ?? "capture"}
            onChange={(e) =>
              updateCapture(item.id, { type: e.target.value as CaptureType })
            }
            className="bg-surface-raised/50 rounded-lg text-[11px] text-muted/70 outline-none cursor-pointer hover:text-foreground/60 transition-colors px-2 py-1.5 border border-border/40"
          >
            {TYPES.map((t) => (
              <option key={t} value={t} className="bg-surface text-foreground">
                {t}
              </option>
            ))}
          </select>

          {/* Priority */}
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
                      ? value
                        ? PRIORITY_STYLE[value] ?? "bg-surface-raised text-muted/60"
                        : "bg-surface-raised text-muted/60"
                      : "text-muted/30 hover:text-muted/60"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Project */}
          <select
            aria-label="Assign project"
            value={item.projectId ?? ""}
            onChange={(e) =>
              updateCapture(item.id, { projectId: e.target.value || null })
            }
            className="bg-surface-raised/50 rounded-lg text-[11px] text-muted/70 outline-none cursor-pointer hover:text-foreground/60 transition-colors px-2 py-1.5 border border-border/40 max-w-[160px] truncate"
          >
            <option value="" className="bg-surface text-foreground">
              No project
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-surface text-foreground">
                {p.title}
              </option>
            ))}
          </select>

          {/* Convert action */}
          <div className="flex-1" />
          {converted ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400/80 px-3 py-1.5">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8.5l3 3 5-6" />
              </svg>
              Converted
            </span>
          ) : (
            <button
              type="button"
              onClick={handleConvert}
              disabled={converting}
              className="flex items-center gap-1.5 text-[11px] font-medium text-accent/80 hover:text-accent transition-colors disabled:opacity-40 px-3 py-1.5 rounded-lg hover:bg-accent-dim"
            >
              {converting ? (
                "Converting…"
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                  Task
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Processed meta row */}
      {isProcessed && (
        <div className="flex items-center gap-2.5 mt-2 ml-8">
          {isTask && (
            <span className="text-[10px] text-emerald-400/50 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400/50" />
              converted to task
            </span>
          )}
          {item.projectId && (
            <span className="text-[10px] text-muted/30">
              → {projects.find((p) => p.id === item.projectId)?.title ?? "project"}
            </span>
          )}
          {item.createdAt && (
            <span className="text-[10px] text-muted/25">
              {formatTimestamp(item.createdAt)}
            </span>
          )}
        </div>
      )}
    </li>
  );
}

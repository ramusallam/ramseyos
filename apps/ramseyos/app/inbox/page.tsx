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
import Link from "next/link";

interface Project {
  id: string;
  title: string;
}

type Priority = "low" | "medium" | "high" | null;

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

const TYPES: CaptureType[] = ["capture", "task", "note", "idea", "resource"];
const PRIORITIES: { value: Priority; label: string }[] = [
  { value: null, label: "–" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
];

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

export default function InboxPage() {
  const [items, setItems] = useState<Capture[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProcessed, setShowProcessed] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "captures"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Capture[]
      );
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
      setProjects(
        snap.docs.map((d) => ({ id: d.id, title: d.data().title }))
      );
    });
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

  return (
    <div className="max-w-5xl px-4 sm:px-8 pt-10 pb-20">
      {/* Header */}
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <div className="flex items-baseline gap-4 mt-2">
          <h1 className="text-xl font-normal text-foreground">Inbox</h1>
          {!loading && items.length > 0 && (
            <div className="flex items-center gap-3 text-[11px] text-muted/60">
              <span className="tabular-nums">{unprocessed.length} to triage</span>
              {taskCount > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="tabular-nums">{taskCount} → tasks</span>
                </>
              )}
            </div>
          )}
        </div>
        <p className="text-[13px] text-muted mt-1">
          Universal capture inbox. Triage, assign, and convert to action.
        </p>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-12">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-sm text-muted/60">Loading inbox…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-border/40 bg-surface/40 p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted/30 mb-4">
            <rect x="2" y="3" width="12" height="10" rx="2" />
            <path d="M2 9h3.5a1 1 0 011 1v0a1 1 0 001 1h1a1 1 0 001-1v0a1 1 0 011-1H14" />
          </svg>
          <p className="text-sm text-muted/60">Inbox is empty</p>
          <p className="text-[12px] text-muted/35 mt-1">
            Capture thoughts from the sidebar or any future channel.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-10">
          {/* ── Needs Triage ── */}
          {unprocessed.length > 0 && (
            <section>
              <SectionHeader
                icon="M2 9h3.5a1 1 0 011 1v0a1 1 0 001 1h1a1 1 0 001-1v0a1 1 0 011-1H14"
                title="Needs triage"
                count={unprocessed.length}
                color="text-amber-400/60"
              />
              <ul className="space-y-1">
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

          {/* All triaged */}
          {unprocessed.length === 0 && (
            <div className="flex items-center gap-2 py-6">
              <span className="size-1.5 shrink-0 rounded-full bg-emerald-400/50" />
              <span className="text-[13px] text-muted/50 italic">
                All items triaged — inbox clear.
              </span>
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
                <div className="flex-1 border-t border-border/30 ml-2" />
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
                <ul className="space-y-1">
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

/* ── Section Header ── */

function SectionHeader({
  icon,
  title,
  count,
  color = "text-muted/40",
}: {
  icon: string;
  title: string;
  count?: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={color}>
        <path d={icon} />
      </svg>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-[10px] text-muted/40 tabular-nums">{count}</span>
      )}
      <div className="flex-1 border-t border-border/40 ml-2" />
    </div>
  );
}

/* ── Inbox Item ── */

function InboxItem({ item, projects }: { item: Capture; projects: Project[] }) {
  const isProcessed = item.processed ?? false;
  const isTask = item.type === "task";
  const [converting, setConverting] = useState(false);

  const sourceMeta = SOURCE_META[item.source ?? "manual"];

  async function handleConvert() {
    if (converting) return;
    setConverting(true);
    try {
      await convertToTask(item);
    } finally {
      setConverting(false);
    }
  }

  return (
    <li
      className={`rounded-lg px-3 py-3 transition-colors hover:bg-surface-raised/50 ${
        isProcessed ? "opacity-40" : ""
      }`}
    >
      {/* Row 1: checkbox + text + source */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() =>
            updateCapture(item.id, {
              processed: !isProcessed,
              status: !isProcessed ? "processed" : "unprocessed",
            })
          }
          className={`mt-0.5 size-4 shrink-0 rounded border transition-colors ${
            isProcessed
              ? "border-accent/40 bg-accent/20"
              : "border-border hover:border-foreground/30"
          }`}
          aria-label={isProcessed ? "Mark unprocessed" : "Mark processed"}
        >
          {isProcessed && (
            <svg viewBox="0 0 16 16" className="size-4 text-accent">
              <path
                d="M4.5 8.5L7 11l4.5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] leading-relaxed ${isProcessed ? "text-muted/60 line-through" : "text-foreground/80"}`}>
            {item.text}
          </p>
        </div>
        {/* Source badge */}
        <span className={`text-[9px] shrink-0 ${sourceMeta.color}`}>
          {sourceMeta.label.toLowerCase()}
        </span>
      </div>

      {/* Row 2: triage controls */}
      {!isProcessed && (
        <div className="flex items-center gap-2 mt-2 ml-7 flex-wrap">
          {/* Type */}
          <select
            aria-label="Capture type"
            value={item.type ?? "capture"}
            onChange={(e) =>
              updateCapture(item.id, { type: e.target.value as CaptureType })
            }
            className="bg-transparent text-[10px] text-muted/60 outline-none cursor-pointer hover:text-foreground/60 transition-colors"
          >
            {TYPES.map((t) => (
              <option key={t} value={t} className="bg-surface text-foreground">
                {t}
              </option>
            ))}
          </select>

          <span className="text-border/30">·</span>

          {/* Priority */}
          <div className="flex items-center gap-0.5">
            {PRIORITIES.map(({ value, label }) => {
              const isActive = (item.priority ?? null) === value;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => updateCapture(item.id, { priority: value })}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    isActive
                      ? value === "high"
                        ? "bg-rose-500/15 text-rose-400"
                        : value === "medium"
                          ? "bg-amber-500/15 text-amber-400"
                          : value === "low"
                            ? "bg-sky-500/15 text-sky-400"
                            : "bg-surface-raised text-muted/60"
                      : "text-muted/30 hover:text-muted/60"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <span className="text-border/30">·</span>

          {/* Project */}
          <select
            aria-label="Assign project"
            value={item.projectId ?? ""}
            onChange={(e) =>
              updateCapture(item.id, { projectId: e.target.value || null })
            }
            className="bg-transparent text-[10px] text-muted/60 outline-none cursor-pointer hover:text-foreground/60 transition-colors max-w-[120px] truncate"
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

          {/* Spacer + Convert action */}
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleConvert}
            disabled={converting}
            className="text-[10px] font-medium text-accent/70 hover:text-accent transition-colors disabled:opacity-40 px-2 py-0.5 rounded hover:bg-accent-dim"
          >
            {converting ? "Converting…" : "→ Task"}
          </button>
        </div>
      )}

      {/* Processed meta row */}
      {isProcessed && (
        <div className="flex items-center gap-2 mt-1.5 ml-7">
          {isTask && (
            <span className="text-[10px] text-emerald-400/50">converted to task</span>
          )}
          {item.createdAt && (
            <span className="text-[10px] text-muted/30">
              {formatTime(item.createdAt)}
            </span>
          )}
        </div>
      )}
    </li>
  );
}

/* ── Helpers ── */

function formatTime(ts: Timestamp): string {
  const d = ts.toDate();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

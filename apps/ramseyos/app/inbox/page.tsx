"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

type CaptureType = "capture" | "task" | "note" | "idea" | "resource";
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
  await addDoc(collection(db, "tasks"), {
    title: capture.text,
    createdAt: serverTimestamp(),
    completed: false,
    priority: capture.priority ?? null,
    sourceCaptureId: capture.id,
    notes: null,
  });
  await updateCapture(capture.id, {
    type: "task",
    processed: true,
    status: "processed",
  });
}

export default function InboxPage() {
  const [items, setItems] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-xl px-5 pt-12 pb-20">

        {/* Header */}
        <header className="mb-10">
          <Link
            href="/"
            className="text-[11px] tracking-wide text-muted hover:text-zinc-400 transition-colors"
          >
            &larr; Today
          </Link>
          <h1 className="text-xl font-normal text-zinc-100 mt-2">
            Inbox
          </h1>
        </header>

        {/* List */}
        {loading ? (
          <p className="text-sm text-muted/60">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted/60">Nothing captured yet.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <InboxItem key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Inbox Item ── */

function InboxItem({ item }: { item: Capture }) {
  const isProcessed = item.processed ?? false;
  const isTask = item.type === "task";
  const [converting, setConverting] = useState(false);

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
      className={`rounded px-2.5 py-2.5 -mx-2.5 transition-colors hover:bg-surface ${
        isProcessed ? "opacity-50" : ""
      }`}
    >
      {/* Row 1: checkbox + text */}
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
              : "border-zinc-600 hover:border-zinc-400"
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
          <p className={`text-[13px] ${isProcessed ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
            {item.text}
          </p>
        </div>
      </div>

      {/* Row 2: triage controls */}
      <div className="flex items-center gap-3 mt-1.5 ml-7">
        {/* Type selector */}
        <select
          aria-label="Capture type"
          value={item.type ?? "capture"}
          onChange={(e) =>
            updateCapture(item.id, { type: e.target.value as CaptureType })
          }
          className="bg-transparent text-[10px] text-muted/70 outline-none cursor-pointer hover:text-zinc-400 transition-colors"
        >
          {TYPES.map((t) => (
            <option key={t} value={t} className="bg-surface text-foreground">
              {t}
            </option>
          ))}
        </select>

        <span className="text-muted/20">·</span>

        {/* Priority selector */}
        <div className="flex items-center gap-1">
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
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-zinc-700/30 text-muted"
                    : "text-muted/40 hover:text-muted/70"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <span className="text-muted/20">·</span>

        {/* Timestamp */}
        <span className="text-[10px] text-muted/40">
          {item.createdAt ? formatTime(item.createdAt) : ""}
        </span>

        {/* Convert to Task */}
        {!isTask && !isProcessed && (
          <>
            <span className="text-muted/20">·</span>
            <button
              type="button"
              onClick={handleConvert}
              disabled={converting}
              className="text-[10px] text-accent/60 hover:text-accent transition-colors disabled:opacity-40"
            >
              {converting ? "Converting..." : "→ Task"}
            </button>
          </>
        )}
        {isTask && (
          <span className="text-[10px] text-emerald-400/60">✓ task</span>
        )}
      </div>
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

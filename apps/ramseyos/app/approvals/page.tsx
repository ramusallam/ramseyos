"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  type ApprovalItem,
  type ApprovalStatus,
  type ApprovalType,
  approveItem,
  rejectItem,
} from "@/lib/approvals";
import { formatTimestamp } from "@/lib/shared";
import Link from "next/link";

/* ── Style maps ── */

const STATUS_STYLE: Record<ApprovalStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending" },
  approved: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Approved" },
  rejected: { bg: "bg-rose-500/10", text: "text-rose-400", label: "Rejected" },
  revised: { bg: "bg-sky-500/10", text: "text-sky-400", label: "Revised" },
};

const TYPE_STYLE: Record<ApprovalType, { bg: string; text: string; label: string }> = {
  grading: { bg: "bg-violet-500/10", text: "text-violet-400", label: "Grading" },
  communication: { bg: "bg-sky-500/10", text: "text-sky-400", label: "Communication" },
  "lesson-plan": { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Lesson Plan" },
  recommendation: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Recommendation" },
  "ai-draft": { bg: "bg-indigo-500/10", text: "text-indigo-400", label: "AI Draft" },
  other: { bg: "bg-muted/10", text: "text-muted", label: "Other" },
};

/* ── Page ── */

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showReviewed, setShowReviewed] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "approvals"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ApprovalItem)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const pending = useMemo(() => items.filter((i) => i.status === "pending"), [items]);
  const reviewed = useMemo(() => items.filter((i) => i.status !== "pending"), [items]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading approvals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
          >
            &larr; Today
          </Link>
        </div>

        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">
          Approvals
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          Review AI-generated drafts before they go out.
        </p>

        {items.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
            {pending.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span className="tabular-nums">{pending.length} pending</span>
              </span>
            )}
            {reviewed.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span className="tabular-nums">{reviewed.length} reviewed</span>
              </span>
            )}
            <span className="tabular-nums">{items.length} total</span>
          </div>
        )}
      </header>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-muted mb-4"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M5.5 8l2 2 3-4" />
          </svg>
          <p className="text-sm text-muted/60 font-medium">All caught up</p>
          <p className="text-[12px] text-muted mt-1">Nothing to review.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-8">
          {/* Pending Review */}
          {pending.length > 0 ? (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-400/60"
                >
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v3l2 1.5" />
                </svg>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Pending Review
                </h2>
                <span className="text-[10px] text-muted tabular-nums">{pending.length}</span>
                <div className="flex-1 border-t border-border" />
              </div>
              <ul className="space-y-2">
                {pending.map((item) => (
                  <ApprovalCard
                    key={item.id}
                    item={item}
                    expanded={expandedId === item.id}
                    onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  />
                ))}
              </ul>
            </section>
          ) : (
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-6 text-center">
              <div className="flex items-center justify-center gap-2.5">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span className="text-[13px] text-emerald-400">
                  All caught up — nothing to review
                </span>
              </div>
            </div>
          )}

          {/* Reviewed */}
          {reviewed.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowReviewed(!showReviewed)}
                className="flex items-center gap-2 mb-4 group w-full"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted"
                >
                  <path d="M5.5 8l2 2 3-4" />
                </svg>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Reviewed
                </h2>
                <span className="text-[10px] text-muted tabular-nums">{reviewed.length}</span>
                <div className="flex-1 border-t border-border" />
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-muted transition-transform ${showReviewed ? "rotate-180" : ""}`}
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              {showReviewed && (
                <ul className="space-y-2">
                  {reviewed.map((item) => (
                    <ApprovalCard
                      key={item.id}
                      item={item}
                      expanded={expandedId === item.id}
                      onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
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

/* ── Approval Card ── */

function ApprovalCard({
  item,
  expanded,
  onToggle,
}: {
  item: ApprovalItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);
  const isPending = item.status === "pending";
  const statusStyle = STATUS_STYLE[item.status];
  const typeStyle = TYPE_STYLE[item.type] ?? TYPE_STYLE.other;

  async function handleApprove() {
    setActing(true);
    try {
      await approveItem(item.id, notes || undefined);
      setNotes("");
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    setActing(true);
    try {
      await rejectItem(item.id, notes || undefined);
      setNotes("");
    } finally {
      setActing(false);
    }
  }

  return (
    <li
      className={`rounded-xl border border-border bg-surface transition-all hover:bg-surface-raised/30 ${
        !isPending ? "opacity-50" : ""
      }`}
    >
      {/* Summary row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 text-left"
      >
        {/* Status dot */}
        <span
          className={`size-2 rounded-full shrink-0 ${
            item.status === "pending"
              ? "bg-amber-400"
              : item.status === "approved"
              ? "bg-emerald-400"
              : item.status === "rejected"
              ? "bg-rose-400"
              : "bg-sky-400"
          }`}
        />

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-foreground/90 truncate">{item.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeStyle.bg} ${typeStyle.text}`}>
              {typeStyle.label}
            </span>
            <span className="text-[10px] text-muted">{item.sourceSystem}</span>
            {item.createdAt && (
              <span className="text-[10px] text-muted">{formatTimestamp(item.createdAt)}</span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.label}
        </span>

        {/* Chevron */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-muted shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          {/* Content */}
          <pre className="text-[13px] text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed bg-surface-raised/30 rounded-lg p-3 max-h-64 overflow-y-auto">
            {item.content}
          </pre>

          {/* Review notes (if already reviewed) */}
          {item.reviewNotes && !isPending && (
            <div className="text-[12px] text-muted/70 bg-surface-raised/20 rounded-lg p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block mb-1">
                Review Notes
              </span>
              {item.reviewNotes}
            </div>
          )}

          {/* Reviewed timestamp */}
          {item.reviewedAt && !isPending && (
            <p className="text-[10px] text-muted">
              Reviewed {formatTimestamp(item.reviewedAt)}
            </p>
          )}

          {/* Related link */}
          {item.relatedRoute && (
            <Link
              href={item.relatedRoute}
              className="text-[11px] text-accent/70 hover:text-accent transition-colors inline-flex items-center gap-1"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
              View related item
            </Link>
          )}

          {/* Actions (pending only) */}
          {isPending && (
            <div className="space-y-3 pt-1">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional review notes..."
                rows={2}
                className="w-full bg-surface-raised/30 border border-border rounded-lg text-[13px] text-foreground/80 placeholder:text-muted/30 px-3 py-2 outline-none focus:border-accent/30 resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={acting}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-40 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 8.5l3 3 5-6" />
                  </svg>
                  {acting ? "Saving..." : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={acting}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-40 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/15"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                  {acting ? "Saving..." : "Reject"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

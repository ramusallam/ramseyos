"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface Capture {
  id: string;
  text: string;
  type?: string;
  priority?: string | null;
  processed?: boolean;
  createdAt: Timestamp | null;
}

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-blue-500/15 text-blue-400",
};

export function TodayFocus() {
  const [items, setItems] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "captures"),
      where("processed", "==", false),
      where("priority", "==", "high"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Capture[]
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return null;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted/50 italic">
        No high-priority items right now.
      </p>
    );
  }

  return (
    <ul className="space-y-px">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded px-2.5 py-2 -mx-2.5 transition-colors hover:bg-surface"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-rose-400/60" />
          <span className="flex-1 text-[13px] text-zinc-300 truncate">
            {item.text}
          </span>
          {item.type && item.type !== "capture" && (
            <span className="text-[9px] tracking-wider uppercase text-muted/50 shrink-0">
              {item.type}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function RecentCaptures() {
  const [recent, setRecent] = useState<Capture[]>([]);
  const [unprocessedCount, setUnprocessedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const recentQ = query(
      collection(db, "captures"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsub = onSnapshot(recentQ, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Capture[];
      setRecent(docs);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const countQ = query(
      collection(db, "captures"),
      where("processed", "==", false)
    );
    const unsub = onSnapshot(countQ, (snap) => {
      setUnprocessedCount(snap.size);
    });
    return unsub;
  }, []);

  if (loading) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted/70">
          Recent captures
          {unprocessedCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-accent-dim text-accent text-[9px] font-medium tabular-nums size-4">
              {unprocessedCount}
            </span>
          )}
        </h2>
        <Link
          href="/inbox"
          className="text-[10px] text-muted/50 hover:text-zinc-400 transition-colors"
        >
          View all &rarr;
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-muted/50 italic">Nothing captured yet.</p>
      ) : (
        <ul className="space-y-px">
          {recent.map((item) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 rounded px-2.5 py-2 -mx-2.5 transition-colors hover:bg-surface ${
                item.processed ? "opacity-40" : ""
              }`}
            >
              <span
                className={`size-1 shrink-0 rounded-full ${
                  item.processed ? "bg-zinc-700" : "bg-zinc-500"
                }`}
              />
              <span
                className={`flex-1 text-[13px] truncate ${
                  item.processed
                    ? "text-zinc-500 line-through"
                    : "text-zinc-300"
                }`}
              >
                {item.text}
              </span>
              {item.priority && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded ${
                    PRIORITY_STYLE[item.priority] ?? "text-muted/50"
                  }`}
                >
                  {item.priority}
                </span>
              )}
              {item.type && item.type !== "capture" && (
                <span className="text-[9px] tracking-wider uppercase text-muted/40 shrink-0">
                  {item.type}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

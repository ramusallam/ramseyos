"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface Capture {
  id: string;
  text: string;
  status: string;
  createdAt: Timestamp | null;
}

export default function InboxPage() {
  const [items, setItems] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "captures"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
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
          <ul className="space-y-px">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded px-2.5 py-2.5 -mx-2.5 transition-colors hover:bg-surface"
              >
                <span className="size-1 shrink-0 rounded-full bg-zinc-600 mt-2" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-zinc-300">{item.text}</p>
                  <p className="text-[10px] text-muted/50 mt-1">
                    {item.status}
                    {item.createdAt && (
                      <> &middot; {formatTime(item.createdAt)}</>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatTime(ts: Timestamp): string {
  const d = ts.toDate();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

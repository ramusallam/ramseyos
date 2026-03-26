"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  generateDailyPlan,
  type DailyPlan,
} from "@/lib/orchestration";
import {
  getActiveAdminItems,
  type AdminItem,
} from "@/lib/admin-templates";
import { DAY_MODE_META } from "@/lib/daily-card-constants";
import { NowNext } from "./now-next";
import { DailyCard } from "./daily-card";

interface Props {
  sidebar: React.ReactNode;
}

/** Real-time count of tasks completed today (chosen-for-today that are done). */
function useCompletedTodayCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      where("completed", "==", true),
      where("chosenForToday", "==", true)
    );
    const unsub = onSnapshot(q, (snap) => setCount(snap.size));
    return unsub;
  }, []);

  return count;
}

export function DailyControllerSection({ sidebar }: Props) {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [adminActive, setAdminActive] = useState<AdminItem[]>([]);
  const completedToday = useCompletedTodayCount();

  useEffect(() => {
    let cancelled = false;
    generateDailyPlan().then((p) => {
      if (!cancelled) setPlan(p);
    });
    getActiveAdminItems().then((items) => {
      if (!cancelled)
        setAdminActive(items.filter((i) => i.status === "in_progress").slice(0, 3));
    });
    return () => { cancelled = true; };
  }, []);

  if (!plan) {
    return (
      <div className="flex items-center gap-3 py-16 justify-center">
        <span className="size-1.5 rounded-full bg-accent animate-pulse" />
        <span className="text-[13px] text-muted">Loading your day…</span>
      </div>
    );
  }

  const mode = DAY_MODE_META[plan.dayMode];
  const taskItems = plan.timeline.filter(
    (i) => i.type === "chosen" || i.type === "focus"
  );
  const totalTasks = taskItems.length + completedToday;
  const allDone = totalTasks > 0 && completedToday >= totalTasks;
  const progress = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;

  return (
    <>
      {/* ── Day mode signal + progress ── */}
      <div className="flex items-center gap-2 mb-5">
        {allDone ? (
          <>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <path d="M4.5 8.5L7 11l4.5-5" />
            </svg>
            <span className="text-[11px] font-medium text-emerald-500">
              All done
            </span>
          </>
        ) : (
          <>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={mode.color}>
              <path d={mode.icon} />
            </svg>
            <span className={`text-[11px] font-medium ${mode.color}`}>
              {mode.label}
            </span>
          </>
        )}
        <span className="text-[10px] text-muted tabular-nums">
          · {plan.timeline.length} item{plan.timeline.length !== 1 ? "s" : ""}
        </span>
        <div className="flex-1" />
        {totalTasks > 0 && (
          <div className="flex items-center gap-2">
            <span className={`text-[10px] tabular-nums font-medium ${allDone ? "text-emerald-500" : completedToday > 0 ? "text-emerald-500/60" : "text-muted"}`}>
              {completedToday}/{totalTasks} done
            </span>
            <div className="w-16 h-1 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : completedToday > 0 ? "bg-emerald-400" : "bg-border"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Completion celebration ── */}
      {allDone && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 text-center">
          <p className="text-[15px] font-medium text-emerald-700">
            Great day, Ramsey.
          </p>
          <p className="text-[13px] text-emerald-600/70 mt-1">
            All {totalTasks} task{totalTasks !== 1 ? "s" : ""} complete. Take a breath.
          </p>
        </div>
      )}

      {/* ── Now / Next — primary controller surface ── */}
      <div className="mb-6">
        <NowNext plan={plan} />
      </div>

      {/* ── Daily Card + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl border border-border p-5 backdrop-blur-sm">
            <DailyCard plan={plan} adminActive={adminActive} />
          </div>
        </div>
        <div className="space-y-4">
          {sidebar}
        </div>
      </div>
    </>
  );
}

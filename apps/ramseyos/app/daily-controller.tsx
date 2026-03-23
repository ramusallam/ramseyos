"use client";

import { useEffect, useState } from "react";
import {
  generateDailyPlan,
  type DailyPlan,
} from "@/lib/orchestration";
import {
  getActiveAdminItems,
  type AdminItem,
} from "@/lib/admin-templates";
import { NowNext } from "./now-next";
import { DailyCard } from "./daily-card";

interface Props {
  sidebar: React.ReactNode;
}

export function DailyControllerSection({ sidebar }: Props) {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [adminActive, setAdminActive] = useState<AdminItem[]>([]);

  useEffect(() => {
    generateDailyPlan().then(setPlan);
    getActiveAdminItems().then((items) =>
      setAdminActive(items.filter((i) => i.status === "in_progress").slice(0, 3))
    );
  }, []);

  if (!plan) {
    return (
      <div className="flex items-center gap-2 py-8">
        <span className="size-1.5 rounded-full bg-accent animate-pulse" />
        <span className="text-sm text-muted/50">Loading your day…</span>
      </div>
    );
  }

  return (
    <>
      {/* Now / Next — full width */}
      <div className="mb-8">
        <NowNext plan={plan} />
      </div>

      {/* Daily Card + Sidebar grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-surface/60 rounded-xl border border-border/60 p-5">
            <DailyCard plan={plan} adminActive={adminActive} />
          </div>
        </div>
        <div className="space-y-5">
          {sidebar}
        </div>
      </div>
    </>
  );
}

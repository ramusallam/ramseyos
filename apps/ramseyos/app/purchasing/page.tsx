"use client";

import { useEffect, useState } from "react";
import { getLessonPlans, type MaterialItem } from "@/lib/lesson-plans";
import { getActiveVendors, type VendorItem } from "@/lib/vendors";
import Link from "next/link";

interface BuyItem extends MaterialItem {
  lessonId: string;
  lessonTitle: string;
  course: string;
}

interface VendorGroup {
  vendor: VendorItem | null;
  label: string;
  items: BuyItem[];
}

interface VendorStat {
  label: string;
  totalItems: number;
  toBuyItems: number;
}

interface Summary {
  vendorStats: VendorStat[];
  recurringToBuy: BuyItem[];
}

export default function PurchasingPage() {
  const [groups, setGroups] = useState<VendorGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<Summary>({ vendorStats: [], recurringToBuy: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLessonPlans(), getActiveVendors()]).then(
      ([plans, vendors]) => {
        const allMats: BuyItem[] = [];
        const buyItems: BuyItem[] = [];
        for (const plan of plans) {
          for (const mat of plan.materials) {
            const item: BuyItem = {
              ...mat,
              lessonId: plan.id,
              lessonTitle: plan.title,
              course: plan.course,
            };
            allMats.push(item);
            if (mat.needToBuy) buyItems.push(item);
          }
        }

        // Vendor stats across ALL materials (not just needToBuy)
        const vendorCounts = new Map<string, { label: string; total: number; toBuy: number }>();
        for (const mat of allMats) {
          let label = "No source";
          if (mat.vendorId) {
            const v = vendors.find((vn) => vn.id === mat.vendorId);
            if (v) label = v.name;
          } else if (mat.sourceName) {
            label = mat.sourceName;
          }
          const existing = vendorCounts.get(label);
          if (existing) {
            existing.total++;
            if (mat.needToBuy) existing.toBuy++;
          } else {
            vendorCounts.set(label, { label, total: 1, toBuy: mat.needToBuy ? 1 : 0 });
          }
        }
        const vendorStats = Array.from(vendorCounts.values())
          .filter((v) => v.label !== "No source")
          .sort((a, b) => b.total - a.total)
          .slice(0, 4)
          .map((v) => ({ label: v.label, totalItems: v.total, toBuyItems: v.toBuy }));

        const recurringToBuy = buyItems.filter((m) => m.recurring);

        setSummary({ vendorStats, recurringToBuy });
        setTotalCount(buyItems.length);

        const vendorMap = new Map<string, VendorGroup>();
        const unsourced: BuyItem[] = [];

        for (const item of buyItems) {
          if (item.vendorId) {
            const v = vendors.find((vn) => vn.id === item.vendorId);
            if (v) {
              const existing = vendorMap.get(v.id);
              if (existing) {
                existing.items.push(item);
              } else {
                vendorMap.set(v.id, { vendor: v, label: v.name, items: [item] });
              }
              continue;
            }
          }
          if (item.sourceName) {
            const key = `manual:${item.sourceName}`;
            const existing = vendorMap.get(key);
            if (existing) {
              existing.items.push(item);
            } else {
              vendorMap.set(key, { vendor: null, label: item.sourceName, items: [item] });
            }
          } else {
            unsourced.push(item);
          }
        }

        const sorted = Array.from(vendorMap.values()).sort((a, b) =>
          a.label.localeCompare(b.label)
        );
        if (unsourced.length > 0) {
          sorted.push({ vendor: null, label: "No source", items: unsourced });
        }

        setGroups(sorted);
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-8 pt-10 pb-20">
        <p className="text-sm text-muted/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 pt-10 pb-20">
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          Purchasing
        </h1>
        <p className="text-[12px] text-muted/60 mt-1">
          {totalCount === 0
            ? "Nothing to buy right now"
            : `${totalCount} item${totalCount === 1 ? "" : "s"} to buy`}
        </p>
      </header>

      {/* Summary */}
      {totalCount > 0 && (summary.vendorStats.length > 0 || summary.recurringToBuy.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Top Vendors */}
          {summary.vendorStats.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-surface/40 p-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted/60 mb-3">
                Top Sources
              </h3>
              <div className="space-y-2">
                {summary.vendorStats.map((vs) => (
                  <div key={vs.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-foreground/70">{vs.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted/50">
                        {vs.totalItems} material{vs.totalItems === 1 ? "" : "s"}
                      </span>
                      {vs.toBuyItems > 0 && (
                        <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200/40 px-1.5 py-0 text-[9px] font-medium text-rose-500/70">
                          {vs.toBuyItems} to buy
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring to Buy */}
          {summary.recurringToBuy.length > 0 && (
            <div className="rounded-xl border border-blue-200/40 bg-blue-50/20 p-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/60 mb-3 flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12.5 6.5A5 5 0 003.5 8M3.5 9.5A5 5 0 0012.5 8" />
                  <path d="M10.5 6.5h2v-2M5.5 9.5h-2v2" />
                </svg>
                Recurring — Need to Buy
              </h3>
              <div className="space-y-1.5">
                {summary.recurringToBuy.map((mat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[12px] text-foreground/70">{mat.name}</span>
                    <span className="text-[10px] text-muted/40">
                      {mat.quantity ? `qty: ${mat.quantity}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {totalCount === 0 ? (
        <div className="rounded-xl border border-border/40 bg-surface/40 p-8 text-center">
          <p className="text-[12px] text-muted/50">
            Mark materials as &ldquo;Need to buy&rdquo; in your lesson plans to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.label}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60">
                  {group.label}
                </h2>
                <span className="text-[10px] text-muted/40">
                  {group.items.length}
                </span>
                {group.vendor?.url && (
                  <a
                    href={group.vendor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-accent/50 hover:text-accent transition-colors ml-auto"
                  >
                    Open site &rarr;
                  </a>
                )}
              </div>
              <div className="space-y-1.5">
                {group.items.map((item, i) => {
                  const launchUrl = item.sourceUrl || group.vendor?.url || null;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg bg-surface border border-border/40 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-foreground/85">
                            {item.name}
                          </span>
                          {item.quantity && (
                            <span className="text-[10px] text-muted/50">
                              qty: {item.quantity}
                            </span>
                          )}
                        </div>
                        {item.purchaseNotes && (
                          <p className="text-[11px] text-rose-500/60 mt-0.5">
                            {item.purchaseNotes}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-[11px] text-muted/45 mt-0.5">
                            {item.notes}
                          </p>
                        )}
                        <Link
                          href={`/lesson-plans/${item.lessonId}`}
                          className="text-[10px] text-muted/35 hover:text-muted/60 transition-colors mt-1 inline-block"
                        >
                          {item.lessonTitle || "Untitled lesson"}
                          {item.course && (
                            <span className="ml-1 text-muted/25">· {item.course}</span>
                          )}
                        </Link>
                      </div>
                      {launchUrl && (
                        <a
                          href={launchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 mt-0.5 inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-white px-3 py-1.5 text-[11px] font-medium text-foreground/60 hover:text-accent hover:border-accent/30 transition-colors"
                        >
                          Open
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                            <path d="M5 3h8v8M13 3L6 10" />
                          </svg>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

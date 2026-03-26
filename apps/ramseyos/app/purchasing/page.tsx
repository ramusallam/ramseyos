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

        // Vendor stats across ALL materials
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

  const vendorCount = new Set(groups.filter((g) => g.vendor).map((g) => g.vendor!.id)).size;

  if (loading) {
    return (
      <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted/40">Loading purchasing…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      <header className="mb-10">
        <div className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted/50">
          <Link
            href="/"
            className="hover:text-foreground/60 transition-colors"
          >
            Today
          </Link>
          <span className="text-muted/30">/</span>
          <Link
            href="/materials"
            className="hover:text-foreground/60 transition-colors"
          >
            Materials
          </Link>
          <span className="text-muted/30">/</span>
          <span className="text-muted/70">Purchasing</span>
        </div>
        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">
          Purchasing
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          {totalCount === 0
            ? "Nothing to buy right now."
            : `${totalCount} item${totalCount === 1 ? "" : "s"} marked for purchase across your lessons.`}
        </p>

        {totalCount > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted/40">
            <span className="flex items-center gap-1.5 text-rose-400/60">
              <span className="size-1.5 rounded-full bg-rose-400" />
              {totalCount} to buy
            </span>
            {vendorCount > 0 && (
              <span className="tabular-nums">{vendorCount} source{vendorCount !== 1 ? "s" : ""}</span>
            )}
            {summary.recurringToBuy.length > 0 && (
              <span className="tabular-nums">{summary.recurringToBuy.length} recurring</span>
            )}
          </div>
        )}

        {/* Cross-links */}
        <div className="flex items-center gap-3 mt-3">
          <Link href="/materials" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Materials &rarr;
          </Link>
          <Link href="/vendors" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Sources{vendorCount > 0 && ` (${vendorCount})`} &rarr;
          </Link>
          <Link href="/lesson-plans" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Lesson Plans &rarr;
          </Link>
        </div>
      </header>

      {/* Summary cards */}
      {totalCount > 0 && (summary.vendorStats.length > 0 || summary.recurringToBuy.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {/* Top Sources */}
          {summary.vendorStats.length > 0 && (
            <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/50">
                  <rect x="2" y="3" width="12" height="10" rx="1.5" />
                  <path d="M2 7h12" />
                </svg>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Top Sources
                </h3>
              </div>
              <div className="space-y-2">
                {summary.vendorStats.map((vs) => (
                  <div key={vs.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-foreground/70">{vs.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted/50 tabular-nums">
                        {vs.totalItems} item{vs.totalItems === 1 ? "" : "s"}
                      </span>
                      {vs.toBuyItems > 0 && (
                        <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-400/20 px-1.5 py-0 text-[9px] font-medium text-rose-400/70 tabular-nums">
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
            <div className="rounded-xl border border-blue-400/15 bg-blue-500/[0.04] backdrop-blur-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-blue-400/70">
                  <path d="M12.5 6.5A5 5 0 003.5 8M3.5 9.5A5 5 0 0012.5 8" />
                  <path d="M10.5 6.5h2v-2M5.5 9.5h-2v2" />
                </svg>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-blue-400/70">
                  Recurring — Need to Buy
                </h3>
              </div>
              <div className="space-y-1.5">
                {summary.recurringToBuy.map((mat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[12px] text-foreground/70">{mat.name}</span>
                    {mat.quantity && (
                      <span className="text-[10px] text-muted/40 tabular-nums">
                        qty: {mat.quantity}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vendor groups */}
      {totalCount === 0 ? (
        <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted/30 mb-4">
            <circle cx="6" cy="13.5" r="1" fill="currentColor" />
            <circle cx="12.5" cy="13.5" r="1" fill="currentColor" />
            <path d="M1 1h2.5l1.3 7.5a1 1 0 001 .8h6.4a1 1 0 001-.8L14.5 4H4" />
          </svg>
          <p className="text-sm text-muted/60">Nothing to buy right now</p>
          <p className="text-[12px] text-muted/35 mt-1">
            Mark materials as &ldquo;Need to buy&rdquo; in your lesson plans to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.label}>
              <div className="flex items-center gap-2 mb-4">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/50">
                  <rect x="2" y="3" width="12" height="10" rx="1.5" />
                  <path d="M2 7h12" />
                </svg>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {group.label}
                </h2>
                <span className="text-[10px] tabular-nums text-muted/40">
                  {group.items.length} item{group.items.length === 1 ? "" : "s"}
                </span>
                <div className="flex-1 border-t border-border/40" />
                {group.vendor?.url && (
                  <a
                    href={group.vendor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-medium text-accent/60 hover:text-accent transition-colors"
                  >
                    Open site &rarr;
                  </a>
                )}
              </div>
              <div className="space-y-2">
                {group.items.map((item, i) => {
                  const launchUrl = item.sourceUrl || group.vendor?.url || null;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl bg-surface/50 backdrop-blur-sm border border-border/50 px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-medium text-foreground/85">
                            {item.name}
                          </span>
                          {item.recurring && (
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-blue-400 shrink-0">
                              <path d="M12.5 6.5A5 5 0 003.5 8M3.5 9.5A5 5 0 0012.5 8" />
                            </svg>
                          )}
                          {item.quantity && (
                            <span className="text-[10px] text-muted/50 tabular-nums">
                              qty: {item.quantity}
                            </span>
                          )}
                        </div>
                        {item.purchaseNotes && (
                          <p className="text-[11px] text-rose-400/60 mt-0.5">
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
                          className="text-[10px] text-muted/35 hover:text-muted/60 transition-colors mt-1.5 inline-flex items-center gap-1"
                        >
                          <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <rect x="3" y="1" width="10" height="14" rx="1.5" />
                            <path d="M5.5 5h5M5.5 8h3" />
                          </svg>
                          {item.lessonTitle || "Untitled lesson"}
                          {item.course && (
                            <span className="text-muted/25">· {item.course}</span>
                          )}
                        </Link>
                      </div>
                      {launchUrl && (
                        <a
                          href={launchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 mt-0.5 inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-foreground/60 hover:text-accent hover:border-accent/30 transition-colors"
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

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

export default function PurchasingPage() {
  const [groups, setGroups] = useState<VendorGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLessonPlans(), getActiveVendors()]).then(
      ([plans, vendors]) => {
        const buyItems: BuyItem[] = [];
        for (const plan of plans) {
          for (const mat of plan.materials) {
            if (!mat.needToBuy) continue;
            buyItems.push({
              ...mat,
              lessonId: plan.id,
              lessonTitle: plan.title,
              course: plan.course,
            });
          }
        }

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
                {group.items.map((item, i) => (
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
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

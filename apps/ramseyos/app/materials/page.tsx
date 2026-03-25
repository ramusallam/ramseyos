"use client";

import { useEffect, useState } from "react";
import { getLessonPlans, type LessonPlan, type MaterialItem } from "@/lib/lesson-plans";
import { getActiveVendors, type VendorItem } from "@/lib/vendors";
import Link from "next/link";

interface MaterialWithContext extends MaterialItem {
  lessonId: string;
  lessonTitle: string;
  course: string;
}

export default function MaterialsPage() {
  const [allMaterials, setAllMaterials] = useState<MaterialWithContext[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLessonPlans(), getActiveVendors()]).then(
      ([plans, vendorList]) => {
        setVendors(vendorList);
        const mats: MaterialWithContext[] = [];
        for (const plan of plans) {
          for (const mat of plan.materials) {
            mats.push({
              ...mat,
              lessonId: plan.id,
              lessonTitle: plan.title,
              course: plan.course,
            });
          }
        }
        setAllMaterials(mats);
        setLoading(false);
      }
    );
  }, []);

  const needToBuy = allMaterials.filter((m) => m.needToBuy);
  const favorites = allMaterials.filter((m) => m.favorite && !m.needToBuy);
  const recurring = allMaterials.filter((m) => m.recurring && !m.needToBuy && !m.favorite);
  const rest = allMaterials.filter((m) => !m.needToBuy && !m.favorite && !m.recurring);

  function resolveSource(mat: MaterialWithContext) {
    if (mat.vendorId) {
      const v = vendors.find((vn) => vn.id === mat.vendorId);
      if (v) return { name: v.name, url: v.url, isVendor: true };
    }
    if (mat.sourceName) return { name: mat.sourceName, url: mat.sourceUrl, isVendor: false };
    return null;
  }

  // Count unique vendors referenced
  const vendorCount = new Set(allMaterials.filter((m) => m.vendorId).map((m) => m.vendorId)).size;

  if (loading) {
    return (
      <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted/40">Loading materials…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-xl font-normal text-foreground tracking-tight mt-2">
          Materials
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          Supplies and materials across all lesson plans.
        </p>
        {allMaterials.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted/40">
            <span className="tabular-nums">{allMaterials.length} total</span>
            {needToBuy.length > 0 && (
              <span className="flex items-center gap-1.5 text-rose-400/60">
                <span className="size-1.5 rounded-full bg-rose-400" />
                {needToBuy.length} to buy
              </span>
            )}
            {favorites.length > 0 && (
              <span className="tabular-nums">{favorites.length} favorite{favorites.length !== 1 ? "s" : ""}</span>
            )}
            {recurring.length > 0 && (
              <span className="tabular-nums">{recurring.length} recurring</span>
            )}
          </div>
        )}

        {/* Cross-links */}
        <div className="flex items-center gap-3 mt-3">
          {needToBuy.length > 0 && (
            <Link href="/purchasing" className="text-[11px] text-rose-400/50 hover:text-rose-400/80 transition-colors">
              Purchasing &rarr;
            </Link>
          )}
          <Link href="/vendors" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Sources{vendorCount > 0 && ` (${vendorCount})`} &rarr;
          </Link>
          <Link href="/lesson-plans" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Lesson Plans &rarr;
          </Link>
        </div>
      </header>

      {allMaterials.length === 0 ? (
        <EmptyState
          message="No materials yet"
          detail="Add materials to your lesson plans to see them here."
        />
      ) : (
        <div className="space-y-10">
          {/* Need to Buy */}
          {needToBuy.length > 0 && (
            <MaterialSection
              title="Need to Buy"
              count={needToBuy.length}
              color="text-rose-400/80"
              ruleColor="border-rose-400/15"
              icon={
                <>
                  <circle cx="6" cy="13.5" r="1" fill="currentColor" />
                  <circle cx="12.5" cy="13.5" r="1" fill="currentColor" />
                  <path d="M1 1h2.5l1.3 7.5a1 1 0 001 .8h6.4a1 1 0 001-.8L14.5 4H4" />
                </>
              }
              materials={needToBuy}
              resolveSource={resolveSource}
            />
          )}

          {/* Favorites */}
          {favorites.length > 0 && (
            <MaterialSection
              title="Favorites"
              count={favorites.length}
              color="text-amber-400/80"
              ruleColor="border-amber-400/10"
              icon={
                <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12l-4.2 2.5.8-4.7L1.2 6.5l4.7-.7L8 1.5z" fill="currentColor" />
              }
              materials={favorites}
              resolveSource={resolveSource}
            />
          )}

          {/* Recurring Supplies */}
          {recurring.length > 0 && (
            <MaterialSection
              title="Recurring Supplies"
              count={recurring.length}
              color="text-blue-400/80"
              ruleColor="border-blue-400/10"
              icon={
                <>
                  <path d="M12.5 6.5A5 5 0 003.5 8M3.5 9.5A5 5 0 0012.5 8" />
                  <path d="M10.5 6.5h2v-2M5.5 9.5h-2v2" />
                </>
              }
              materials={recurring}
              resolveSource={resolveSource}
            />
          )}

          {/* All Other Materials */}
          {rest.length > 0 && (
            <MaterialSection
              title="All Materials"
              count={rest.length}
              color="text-muted"
              ruleColor="border-border/40"
              icon={
                <>
                  <rect x="2" y="2" width="12" height="12" rx="2" />
                  <path d="M5 6h6M5 9h4" />
                </>
              }
              materials={rest}
              resolveSource={resolveSource}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Shared components ── */

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  const colorMap: Record<string, string> = {
    rose: "text-rose-400/70",
    amber: "text-amber-400/70",
    blue: "text-blue-400/70",
  };
  const color = accent ? colorMap[accent] ?? "text-muted/50" : "text-muted/50";
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[13px] font-medium tabular-nums ${color}`}>{value}</span>
      <span className="text-[10px] text-muted/40">{label}</span>
    </div>
  );
}

function EmptyState({ message, detail }: { message: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-10 text-center">
      <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted/30 mb-4">
        <rect x="2" y="2" width="12" height="12" rx="2" />
        <path d="M5 6h6M5 9h4" />
      </svg>
      <p className="text-sm text-muted/60">{message}</p>
      <p className="text-[12px] text-muted/35 mt-1">{detail}</p>
    </div>
  );
}

function MaterialSection({
  title,
  count,
  color,
  ruleColor,
  icon,
  materials,
  resolveSource,
}: {
  title: string;
  count: number;
  color: string;
  ruleColor: string;
  icon: React.ReactNode;
  materials: MaterialWithContext[];
  resolveSource: (mat: MaterialWithContext) => { name: string; url: string; isVendor: boolean } | null;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={color}
        >
          {icon}
        </svg>
        <h2 className={`text-[11px] font-semibold uppercase tracking-wider ${color}`}>
          {title}
        </h2>
        <span className="text-[10px] tabular-nums text-muted/40">
          {count}
        </span>
        <div className={`flex-1 border-t ${ruleColor}`} />
      </div>
      <div className="space-y-2">
        {materials.map((mat, i) => (
          <MaterialCard key={`${title}-${i}`} mat={mat} source={resolveSource(mat)} />
        ))}
      </div>
    </section>
  );
}

function MaterialCard({
  mat,
  source,
}: {
  mat: MaterialWithContext;
  source: { name: string; url: string; isVendor: boolean } | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface/50 backdrop-blur-sm border border-border/50 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-foreground/85">
            {mat.name}
          </span>
          {mat.favorite && (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="text-amber-400 shrink-0">
              <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12l-4.2 2.5.8-4.7L1.2 6.5l4.7-.7L8 1.5z" />
            </svg>
          )}
          {mat.recurring && (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-blue-400 shrink-0">
              <path d="M12.5 6.5A5 5 0 003.5 8M3.5 9.5A5 5 0 0012.5 8" />
            </svg>
          )}
          {mat.needToBuy && (
            <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-400/20 px-1.5 py-0 text-[9px] font-medium text-rose-400/80 shrink-0">
              buy
            </span>
          )}
          {mat.quantity && (
            <span className="text-[10px] text-muted/50">
              qty: {mat.quantity}
            </span>
          )}
        </div>
        {mat.notes && (
          <p className="text-[11px] text-muted/50 mt-0.5">{mat.notes}</p>
        )}
        {mat.purchaseNotes && (
          <p className="text-[11px] text-rose-400/60 mt-0.5">{mat.purchaseNotes}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          {source && (
            source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-[10px] font-medium transition-colors ${
                  source.isVendor
                    ? "rounded-full bg-accent/6 border border-accent/12 px-2 py-0.5 text-accent/70 hover:text-accent hover:border-accent/25"
                    : "text-accent/60 hover:text-accent"
                }`}
              >
                {source.name} &rarr;
              </a>
            ) : (
              <span className="text-[10px] text-muted/40">{source.name}</span>
            )
          )}
          <Link
            href={`/lesson-plans/${mat.lessonId}`}
            className="text-[10px] text-muted/35 hover:text-muted/60 transition-colors"
          >
            {mat.lessonTitle || "Untitled lesson"}
            {mat.course && <span className="ml-1 text-muted/25">· {mat.course}</span>}
          </Link>
        </div>
      </div>
    </div>
  );
}

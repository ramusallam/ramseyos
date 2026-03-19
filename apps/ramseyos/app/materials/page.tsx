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
  const favorites = allMaterials.filter((m) => m.favorite);
  const recurring = allMaterials.filter((m) => m.recurring);

  function resolveSource(mat: MaterialWithContext) {
    if (mat.vendorId) {
      const v = vendors.find((vn) => vn.id === mat.vendorId);
      if (v) return { name: v.name, url: v.url, isVendor: true };
    }
    if (mat.sourceName) return { name: mat.sourceName, url: mat.sourceUrl, isVendor: false };
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-8 pt-10 pb-20">
        <p className="text-sm text-muted/60">Loading materials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 pt-10 pb-20">
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          Materials
        </h1>
        <p className="text-[12px] text-muted/60 mt-1">
          All materials across lesson plans
        </p>
      </header>

      {/* Need to Buy */}
      {needToBuy.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-rose-600/80 mb-3 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="13.5" r="1" fill="currentColor" />
              <circle cx="12.5" cy="13.5" r="1" fill="currentColor" />
              <path d="M1 1h2.5l1.3 7.5a1 1 0 001 .8h6.4a1 1 0 001-.8L14.5 4H4" />
            </svg>
            Need to Buy
            <span className="text-rose-400/50 font-normal">{needToBuy.length}</span>
          </h2>
          <div className="space-y-2">
            {needToBuy.map((mat, i) => (
              <MaterialCard key={`buy-${i}`} mat={mat} source={resolveSource(mat)} />
            ))}
          </div>
        </section>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/80 mb-3 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12l-4.2 2.5.8-4.7L1.2 6.5l4.7-.7L8 1.5z" />
            </svg>
            Favorites
          </h2>
          <div className="space-y-2">
            {favorites.map((mat, i) => (
              <MaterialCard key={`fav-${i}`} mat={mat} source={resolveSource(mat)} />
            ))}
          </div>
        </section>
      )}

      {/* Recurring Supplies */}
      {recurring.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/80 mb-3 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12.5 6.5A5 5 0 003.5 8M3.5 9.5A5 5 0 0012.5 8" />
              <path d="M10.5 6.5h2v-2M5.5 9.5h-2v2" />
            </svg>
            Recurring Supplies
          </h2>
          <div className="space-y-2">
            {recurring.map((mat, i) => (
              <MaterialCard key={`rec-${i}`} mat={mat} source={resolveSource(mat)} />
            ))}
          </div>
        </section>
      )}

      {/* All Materials */}
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted/70 mb-3">
          All Materials
          <span className="ml-2 text-muted/40 font-normal">{allMaterials.length}</span>
        </h2>
        {allMaterials.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-surface/40 p-8 text-center">
            <p className="text-[12px] text-muted/50">
              No materials yet. Add materials to your lesson plans to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {allMaterials.map((mat, i) => (
              <MaterialCard key={`all-${i}`} mat={mat} source={resolveSource(mat)} />
            ))}
          </div>
        )}
      </section>
    </div>
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
    <div className="flex items-start gap-3 rounded-lg bg-surface border border-border/40 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-foreground/85">
            {mat.name}
          </span>
          {mat.favorite && (
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="text-amber-400 shrink-0">
              <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12l-4.2 2.5.8-4.7L1.2 6.5l4.7-.7L8 1.5z" />
            </svg>
          )}
          {mat.recurring && (
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-blue-400 shrink-0">
              <path d="M12.5 6.5A5 5 0 003.5 8M3.5 9.5A5 5 0 0012.5 8" />
            </svg>
          )}
          {mat.needToBuy && (
            <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200/50 px-1.5 py-0 text-[9px] font-medium text-rose-600/80 shrink-0">
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
          <p className="text-[11px] text-rose-500/60 mt-0.5">{mat.purchaseNotes}</p>
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

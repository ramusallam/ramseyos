"use client";

import { useEffect, useState } from "react";
import { getActiveVendors, seedVendors, type VendorItem } from "@/lib/vendors";
import { getLessonPlans } from "@/lib/lesson-plans";
import Link from "next/link";

const CATEGORY_META: Record<string, { bg: string; text: string }> = {
  general: { bg: "bg-white/5", text: "text-gray-400" },
  science: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
};

interface VendorWithCounts extends VendorItem {
  materialCount: number;
  toBuyCount: number;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      await seedVendors();
      const [items, plans] = await Promise.all([
        getActiveVendors(),
        getLessonPlans(),
      ]);

      // Count materials per vendor
      const counts = new Map<string, { total: number; toBuy: number }>();
      for (const plan of plans) {
        for (const mat of plan.materials) {
          if (!mat.vendorId) continue;
          const c = counts.get(mat.vendorId) ?? { total: 0, toBuy: 0 };
          c.total++;
          if (mat.needToBuy) c.toBuy++;
          counts.set(mat.vendorId, c);
        }
      }

      setVendors(
        items.map((v) => ({
          ...v,
          materialCount: counts.get(v.id)?.total ?? 0,
          toBuyCount: counts.get(v.id)?.toBuy ?? 0,
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  const totalMaterials = vendors.reduce((s, v) => s + v.materialCount, 0);
  const totalToBuy = vendors.reduce((s, v) => s + v.toBuyCount, 0);

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
          <span className="text-muted/70">Sources</span>
        </div>
        <h1 className="text-xl font-normal text-foreground tracking-tight mt-2">
          Sources
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          Vendor and supplier directory for lab materials and classroom supplies.
        </p>

        {vendors.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted/40">
            <span className="tabular-nums">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""}</span>
            {totalMaterials > 0 && (
              <span className="tabular-nums">{totalMaterials} linked material{totalMaterials !== 1 ? "s" : ""}</span>
            )}
            {totalToBuy > 0 && (
              <span className="flex items-center gap-1.5 text-rose-400/60">
                <span className="size-1.5 rounded-full bg-rose-400" />
                {totalToBuy} to buy
              </span>
            )}
          </div>
        )}

        {/* Cross-links */}
        <div className="flex items-center gap-3 mt-3">
          <Link href="/materials" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Materials &rarr;
          </Link>
          {totalToBuy > 0 && (
            <Link href="/purchasing" className="text-[11px] text-rose-400/50 hover:text-rose-400/80 transition-colors">
              Purchasing &rarr;
            </Link>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted/40">Loading sources…</span>
        </div>
      ) : vendors.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted/30 mb-4">
            <rect x="2" y="3" width="12" height="10" rx="1.5" />
            <path d="M2 7h12" />
          </svg>
          <p className="text-sm text-muted/60">No sources yet</p>
          <p className="text-[12px] text-muted/35 mt-1">
            Vendors added to RamseyOS will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
}

function VendorCard({ vendor }: { vendor: VendorWithCounts }) {
  const meta = CATEGORY_META[vendor.category] ?? CATEGORY_META.general;

  return (
    <a
      href={vendor.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl bg-surface/50 backdrop-blur-sm border border-border/50 p-4 transition-all hover:border-border-strong hover:bg-surface-raised/30"
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${meta.bg} ${meta.text}`}
        >
          {vendor.category}
        </span>
        {vendor.toBuyCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-400/20 px-1.5 py-0 text-[9px] font-medium text-rose-400/70 tabular-nums">
            {vendor.toBuyCount} to buy
          </span>
        )}
      </div>
      <h3 className="text-[13px] font-medium text-foreground/90 mt-3 mb-1 group-hover:text-foreground transition-colors leading-snug">
        {vendor.name}
      </h3>
      <p className="text-[12px] text-muted/60 leading-relaxed line-clamp-2">
        {vendor.description}
      </p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[11px] text-accent/70 group-hover:text-accent transition-colors">
          Visit site &rarr;
        </span>
        {vendor.materialCount > 0 && (
          <span className="text-[10px] text-muted/40 tabular-nums">
            {vendor.materialCount} material{vendor.materialCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </a>
  );
}

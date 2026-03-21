"use client";

import { useEffect, useState } from "react";
import { getActiveVendors, seedVendors, type VendorItem } from "@/lib/vendors";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-white/5 text-gray-400",
  science: "bg-emerald-500/10 text-emerald-400",
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      await seedVendors();
      const items = await getActiveVendors();
      setVendors(items);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl px-8 pt-10 pb-20">
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-xl font-normal text-foreground mt-2">
          Materials Sources
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Vendor and supplier directory for lab materials and classroom supplies.
        </p>
      </header>

      {/* Content */}
      {loading ? (
        <p className="text-sm text-muted/60">Loading...</p>
      ) : vendors.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 shadow-card text-center">
          <p className="text-sm text-muted">No vendors yet.</p>
          <p className="text-[12px] text-muted/50 mt-1">
            Vendors added to RamseyOS will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
}

function VendorCard({ vendor }: { vendor: VendorItem }) {
  const colors =
    CATEGORY_COLORS[vendor.category] ?? "bg-white/5 text-gray-400";

  return (
    <a
      href={vendor.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-surface rounded-xl border border-border p-5 shadow-card transition-all hover:shadow-card-hover hover:border-border-strong"
    >
      <span
        className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${colors}`}
      >
        {vendor.category}
      </span>
      <h3 className="text-[14px] font-medium text-foreground/90 mt-3 mb-1 group-hover:text-foreground transition-colors">
        {vendor.name}
      </h3>
      <p className="text-[12px] text-muted leading-relaxed line-clamp-2">
        {vendor.description}
      </p>
      <span className="inline-block mt-3 text-[11px] text-accent/70 group-hover:text-accent transition-colors">
        Visit site &rarr;
      </span>
    </a>
  );
}

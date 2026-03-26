"use client";

import { useEffect, useState } from "react";
import {
  getActiveProducts,
  seedProducts,
  type Product,
  type ProductStatus,
  type ProductCategory,
} from "@/lib/products";
import {
  getActiveBuildContexts,
  seedBuildContexts,
  type BuildContext,
  type BuildContextCategory,
} from "@/lib/build-contexts";
import Link from "next/link";

/* ── Style maps ── */

const STATUS_META: Record<ProductStatus, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "active" },
  maintenance: { bg: "bg-amber-500/10", text: "text-amber-400", label: "maintenance" },
  paused: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "paused" },
  archived: { bg: "bg-zinc-500/10", text: "text-zinc-500", label: "archived" },
};

const CATEGORY_META: Record<ProductCategory, { bg: string; text: string }> = {
  app: { bg: "bg-accent-dim", text: "text-accent" },
  site: { bg: "bg-sky-500/10", text: "text-sky-400" },
  tool: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  content: { bg: "bg-violet-500/10", text: "text-violet-400" },
};

const CTX_CATEGORY_META: Record<BuildContextCategory, { bg: string; text: string; label: string }> = {
  prompt: { bg: "bg-accent-dim", text: "text-accent", label: "prompt" },
  "build-note": { bg: "bg-amber-500/10", text: "text-amber-400", label: "build note" },
  architecture: { bg: "bg-sky-500/10", text: "text-sky-400", label: "architecture" },
  runbook: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "runbook" },
};

const SPARK_NAME = "Spark Learning Inquiry Studio";

export default function ProductOpsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [contexts, setContexts] = useState<BuildContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      await Promise.all([seedProducts(), seedBuildContexts()]);
      const [p, c] = await Promise.all([
        getActiveProducts(),
        getActiveBuildContexts(),
      ]);
      setProducts(p);
      setContexts(c);
      setLoading(false);
    }
    load();
  }, []);

  const activeCount = products.filter((p) => p.status === "active").length;
  const promptCount = contexts.filter((c) => c.category === "prompt").length;
  const withRepoCount = products.filter((p) => p.repoUrl).length;

  // Build a product lookup for context cards
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Group contexts by product
  const linkedContexts = contexts.filter((c) => c.productId);
  const unlinkedContexts = contexts.filter((c) => !c.productId);

  if (loading) {
    return (
      <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted/40">Loading products…</span>
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
        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">
          Product Ops
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          Products, build context, and development operations.
        </p>

        {products.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted/40">
            <span className="tabular-nums">{products.length} product{products.length !== 1 ? "s" : ""}</span>
            {activeCount > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-400/60">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {activeCount} active
              </span>
            )}
            {contexts.length > 0 && (
              <span className="tabular-nums">{contexts.length} context{contexts.length !== 1 ? "s" : ""}</span>
            )}
            {promptCount > 0 && (
              <span className="tabular-nums">{promptCount} prompt{promptCount !== 1 ? "s" : ""}</span>
            )}
          </div>
        )}

        {/* Cross-links */}
        <div className="flex items-center gap-3 mt-3">
          <Link href="/tools" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Tools &rarr;
          </Link>
          <Link href="/lesson-plans" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Lesson Plans &rarr;
          </Link>
        </div>
      </header>

      <div className="space-y-10">
        {/* ── Products & Apps ── */}
        <section>
          <ZoneHeader
            title="Products & Apps"
            count={products.length}
            icon={
              <>
                <rect x="2" y="3" width="12" height="10" rx="1.5" />
                <path d="M2 7h12" />
              </>
            }
          />
          {products.length === 0 ? (
            <EmptyCard message="No products yet" detail="Products added to RamseyOS will appear here." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  contextCount={contexts.filter((c) => c.productId === product.id).length}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Prompts & Build Context ── */}
        <section>
          <ZoneHeader
            title="Build Context"
            count={contexts.length}
            icon={
              <>
                <rect x="3" y="1" width="10" height="14" rx="1.5" />
                <path d="M5.5 5h5M5.5 8h3" />
              </>
            }
          />
          {contexts.length === 0 ? (
            <EmptyCard message="No build context entries yet" detail="Prompts, runbooks, and build notes will appear here." />
          ) : (
            <div className="space-y-2">
              {contexts.map((ctx) => (
                <BuildContextCard
                  key={ctx.id}
                  ctx={ctx}
                  product={ctx.productId ? productMap.get(ctx.productId) ?? null : null}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Integrations ── */}
        <section>
          <ZoneHeader
            title="Integrations"
            icon={
              <>
                <circle cx="4" cy="8" r="2" />
                <circle cx="12" cy="8" r="2" />
                <path d="M6 8h4" />
              </>
            }
          />
          <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-5">
            <div className="space-y-3">
              {/* Spark integration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  <span className="text-[12px] text-foreground/70">Spark Learning</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-500/10 text-amber-400">
                    product + tool + companion
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/tools"
                    className="text-[10px] text-muted/40 hover:text-muted/60 transition-colors"
                  >
                    Launchpad
                  </Link>
                  <Link
                    href="/lesson-plans"
                    className="text-[10px] text-muted/40 hover:text-muted/60 transition-colors"
                  >
                    Lessons
                  </Link>
                </div>
              </div>
              {/* GitHub placeholder */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-muted/25" />
                  <span className="text-[12px] text-muted/50">GitHub</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-white/5 text-muted/40">
                    planned
                  </span>
                </div>
                <span className="text-[10px] text-muted/30">{withRepoCount} repo{withRepoCount !== 1 ? "s" : ""} linked</span>
              </div>
              {/* Sentry placeholder */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-muted/25" />
                  <span className="text-[12px] text-muted/50">Sentry</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-white/5 text-muted/40">
                    planned
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Product Tasks ── */}
        <section>
          <ZoneHeader
            title="Product Tasks"
            icon={<path d="M5.5 8l2 2 3-4" />}
          />
          <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-6">
            <p className="text-[13px] text-muted/50">
              Product-related tasks will surface here once task tagging is connected.
            </p>
            <Link
              href="/tasks"
              className="inline-block mt-3 text-[12px] text-accent/70 hover:text-accent transition-colors"
            >
              View all tasks &rarr;
            </Link>
          </div>
        </section>

        {/* ── Status Notes ── */}
        <section>
          <ZoneHeader
            title="Status Notes"
            icon={
              <>
                <path d="M3 3h10v2H3z" />
                <path d="M5 7h6M5 10h4" />
              </>
            }
          />
          <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-6">
            <p className="text-[13px] text-muted/50">
              Product status notes and operational updates will live here.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Shared components ── */

function ZoneHeader({
  title,
  count,
  icon,
}: {
  title: string;
  count?: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted/40"
      >
        {icon}
      </svg>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-[10px] text-muted/40 tabular-nums">{count}</span>
      )}
      <div className="flex-1 border-t border-border/40" />
    </div>
  );
}

function EmptyCard({ message, detail }: { message: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-10 text-center">
      <p className="text-sm text-muted/60">{message}</p>
      {detail && <p className="text-[12px] text-muted/35 mt-1">{detail}</p>}
    </div>
  );
}

/* ── Product Card ── */

function ProductCard({ product, contextCount }: { product: Product; contextCount: number }) {
  const status = STATUS_META[product.status];
  const category = CATEGORY_META[product.category] ?? { bg: "bg-white/5", text: "text-muted" };
  const isSpark = product.name === SPARK_NAME;

  return (
    <div
      className={`group flex flex-col rounded-xl border p-5 transition-all hover:bg-surface-raised/30 ${
        isSpark
          ? "border-amber-500/20 bg-amber-500/[0.03] hover:border-amber-500/30"
          : "border-border/50 bg-surface/50 backdrop-blur-sm hover:border-border-strong"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${category.bg} ${category.text}`}>
            {product.category}
          </span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          {isSpark && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-500/10 text-amber-400">
              core
            </span>
          )}
        </div>
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted/30 hover:text-muted/60 transition-colors"
            aria-label={`Open ${product.name}`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 2H10v5.5M10 2L3 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
      </div>

      <h3 className="text-[14px] font-medium text-foreground/90 mb-1 leading-snug">
        {product.name}
      </h3>
      <p className="text-[12px] text-muted/60 leading-relaxed line-clamp-2 mb-3">
        {product.description}
      </p>

      {product.currentFocus && (
        <div className="mt-auto pt-3 border-t border-border/30">
          <p className="text-[11px] text-muted/40 mb-0.5">Current focus</p>
          <p className="text-[12px] text-foreground/60 leading-relaxed">
            {product.currentFocus}
          </p>
        </div>
      )}

      {/* Footer: repo + context count + Spark links */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {product.repoUrl && (
          <a
            href={product.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-muted/40 hover:text-muted/70 transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 1C4.1 1 1 4.1 1 8c0 3.1 2 5.7 4.8 6.6.4.1.5-.2.5-.4v-1.3c-2 .4-2.4-1-2.4-1-.3-.8-.8-1-.8-1-.6-.4.1-.4.1-.4.7.1 1.1.7 1.1.7.6 1.1 1.6.8 2 .6.1-.4.2-.8.4-1-1.6-.2-3.2-.8-3.2-3.5 0-.8.3-1.4.7-1.9-.1-.2-.3-.9.1-1.9 0 0 .6-.2 1.9.7a6.5 6.5 0 013.4 0c1.3-.9 1.9-.7 1.9-.7.4 1 .2 1.7.1 1.9.4.5.7 1.1.7 1.9 0 2.7-1.6 3.3-3.2 3.5.2.2.4.6.4 1.2v1.8c0 .2.1.5.5.4A7 7 0 0015 8c0-3.9-3.1-7-7-7z" />
            </svg>
            repo
          </a>
        )}
        {contextCount > 0 && (
          <span className="text-[10px] text-muted/30 tabular-nums">
            {contextCount} context{contextCount !== 1 ? "s" : ""}
          </span>
        )}
        {isSpark && (
          <>
            <Link
              href="/tools"
              className="text-[10px] text-amber-400/50 hover:text-amber-400/80 transition-colors"
            >
              Launchpad
            </Link>
            <Link
              href="/lesson-plans"
              className="text-[10px] text-amber-400/50 hover:text-amber-400/80 transition-colors"
            >
              Lessons
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Build Context Card ── */

function BuildContextCard({
  ctx,
  product,
}: {
  ctx: BuildContext;
  product: Product | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = CTX_CATEGORY_META[ctx.category] ?? { bg: "bg-white/5", text: "text-muted", label: ctx.category };

  return (
    <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-4 transition-all hover:border-border-strong">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${meta.bg} ${meta.text}`}>
              {meta.label}
            </span>
            {product && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-white/5 text-muted/50">
                {product.name}
              </span>
            )}
          </div>
          <h3 className="text-[13px] font-medium text-foreground/90 leading-snug">
            {ctx.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-1 text-muted/40 hover:text-muted/70 transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M3 4.5l3 3 3-3" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-[12px] text-muted/70 leading-relaxed whitespace-pre-wrap">
            {ctx.body}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { getActiveTools, seedTools, toggleToolPinned, type ToolItem } from "@/lib/tools";
import Link from "next/link";

const CATEGORY_STYLE: Record<string, string> = {
  teaching: "bg-sky-500/10 text-sky-400",
  publishing: "bg-violet-500/10 text-violet-400",
  accessibility: "bg-emerald-500/10 text-emerald-400",
  simulation: "bg-amber-500/10 text-amber-400",
  classroom: "bg-rose-500/10 text-rose-400",
};

const CATEGORY_LABEL: Record<string, string> = {
  teaching: "Teaching",
  publishing: "Publishing",
  accessibility: "Accessibility",
  simulation: "Simulations",
  classroom: "Classroom",
};

const CATEGORY_ICON: Record<string, string> = {
  teaching: "M3 3h10v2H3zM5 7h6M5 10h4",
  publishing: "M2 2h4l1.5 3H14v8H2V2z",
  accessibility: "M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v3l2 2",
  simulation: "M2 12l4-8 3 5 3-3 2 6",
  classroom: "M8 2a6 6 0 100 12A6 6 0 008 2z",
};

const SPARK_TOOL_TITLE = "Spark Learning Inquiry Studio";

function groupByCategory(tools: ToolItem[]): [string, ToolItem[]][] {
  const map = new Map<string, ToolItem[]>();
  for (const tool of tools) {
    const group = map.get(tool.category) ?? [];
    group.push(tool);
    map.set(tool.category, group);
  }
  return Array.from(map.entries());
}

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      await seedTools();
      setTools(await getActiveTools());
      setLoading(false);
    }
    load();
  }, []);

  async function handleTogglePin(id: string, current: boolean) {
    await toggleToolPinned(id, current);
    setTools((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pinned: !current } : t))
    );
  }

  const categories = useMemo(
    () => [...new Set(tools.map((t) => t.category))],
    [tools]
  );

  // Spark is always separated out as the featured tool
  const sparkTool = useMemo(
    () => tools.find((t) => t.title === SPARK_TOOL_TITLE) ?? null,
    [tools]
  );

  const nonSparkTools = useMemo(
    () => tools.filter((t) => t.title !== SPARK_TOOL_TITLE),
    [tools]
  );

  const filtered = useMemo(() => {
    let result = nonSparkTools;
    if (activeCategory) {
      result = result.filter((t) => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [nonSparkTools, search, activeCategory]);

  const favorites = useMemo(
    () => filtered.filter((t) => t.pinned),
    [filtered]
  );
  const nonFavorites = useMemo(
    () => filtered.filter((t) => !t.pinned),
    [filtered]
  );
  const grouped = useMemo(() => groupByCategory(nonFavorites), [nonFavorites]);

  const totalCount = tools.length;
  const favCount = tools.filter((t) => t.pinned).length;

  return (
    <div className="max-w-5xl px-4 sm:px-8 pt-10 pb-20">
      {/* Header */}
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <div className="flex items-baseline gap-4 mt-2">
          <h1 className="text-xl font-normal text-foreground">
            Tools &amp; Resources
          </h1>
          {!loading && totalCount > 0 && (
            <div className="flex items-center gap-3 text-[11px] text-muted/60">
              <span className="tabular-nums">{totalCount} tools</span>
              {favCount > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span className="tabular-nums">{favCount} pinned</span>
                </>
              )}
            </div>
          )}
        </div>
        <p className="text-[13px] text-muted mt-1">
          Launch external tools and resources from one place.
        </p>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-12">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-sm text-muted/60">Loading tools…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && tools.length === 0 && (
        <div className="rounded-xl border border-border/40 bg-surface/40 p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted/30 mb-4">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <path d="M5 6h6M5 9h4" />
          </svg>
          <p className="text-sm text-muted/60">No tools or resources yet</p>
          <p className="text-[12px] text-muted/35 mt-1">
            Tools added to RamseyOS will appear here.
          </p>
        </div>
      )}

      {!loading && tools.length > 0 && (
        <div className="space-y-10">
          {/* ── Spark Learning Inquiry Studio — Featured ── */}
          {sparkTool && !activeCategory && !search.trim() && (
            <section>
              <SectionHeader
                icon="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z"
                title="Companion"
                color="text-amber-400/60"
              />
              <a
                href={sparkTool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col sm:flex-row items-start gap-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-5 sm:p-6 transition-all hover:border-amber-500/30 hover:bg-amber-500/[0.05]"
              >
                <div className="shrink-0 flex items-center justify-center size-12 rounded-lg bg-amber-500/10">
                  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                    <path d="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-medium text-foreground group-hover:text-foreground transition-colors">
                      {sparkTool.title}
                    </h3>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-muted/30 group-hover:text-muted/60 transition-colors shrink-0">
                      <path d="M4.5 2H10v5.5M10 2L3 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-[13px] text-muted/70 leading-relaxed mb-3">
                    {sparkTool.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-amber-400/60 font-medium">sparklearningstudio.ai</span>
                    <span className="text-border">·</span>
                    <Link
                      href="/lesson-plans"
                      onClick={(e) => e.stopPropagation()}
                      className="text-accent hover:text-accent/80 transition-colors"
                    >
                      Lesson Plans &rarr;
                    </Link>
                  </div>
                </div>
              </a>
            </section>
          )}

          {/* ── Search + Filter ── */}
          <div className="space-y-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools…"
              className="w-full rounded-lg border border-border/60 bg-surface/60 px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted/40 outline-none focus:border-accent/30 transition-colors"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                  activeCategory === null
                    ? "bg-accent-dim text-accent"
                    : "text-muted/50 hover:text-muted/80"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setActiveCategory(activeCategory === cat ? null : cat)
                  }
                  className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                    activeCategory === cat
                      ? CATEGORY_STYLE[cat] ?? "bg-white/5 text-muted"
                      : "text-muted/50 hover:text-muted/80"
                  }`}
                >
                  {CATEGORY_LABEL[cat] ?? cat}
                </button>
              ))}
            </div>
          </div>

          {/* No results */}
          {filtered.length === 0 && (
            <p className="text-sm text-muted/50 text-center py-8">
              No matching tools found.
            </p>
          )}

          {/* ── Favorites ── */}
          {favorites.length > 0 && (
            <section>
              <SectionHeader
                icon="M5 1.5L9 1.5L9.5 5.5L11.5 7L11.5 8.5L8 8.5L8 12.5L6 12.5L6 8.5L2.5 8.5L2.5 7L4.5 5.5L5 1.5Z"
                title="Pinned"
                count={favorites.length}
                color="text-accent/60"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {favorites.map((tool) => (
                  <ToolCard
                    key={`fav-${tool.id}`}
                    tool={tool}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Categories ── */}
          {grouped.map(([category, items]) => (
            <section key={category}>
              <SectionHeader
                icon={CATEGORY_ICON[category] ?? "M2 2h12v12H2z"}
                title={CATEGORY_LABEL[category] ?? category}
                count={items.length}
                color="text-muted/40"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Section Header ── */

function SectionHeader({
  icon,
  title,
  count,
  color = "text-muted/40",
}: {
  icon: string;
  title: string;
  count?: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={color}>
        <path d={icon} />
      </svg>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-[10px] text-muted/40 tabular-nums">{count}</span>
      )}
      <div className="flex-1 border-t border-border/40 ml-2" />
    </div>
  );
}

/* ── Tool Card ── */

function ToolCard({
  tool,
  onTogglePin,
}: {
  tool: ToolItem;
  onTogglePin: (id: string, current: boolean) => void;
}) {
  const isExternal = tool.url !== "#";

  return (
    <div className="group relative flex flex-col rounded-xl border border-border/60 bg-surface/40 p-4 transition-all hover:border-border-strong hover:bg-surface-raised/30">
      <a
        href={tool.url}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="block flex-1"
      >
        <div className="flex items-start justify-between mb-2">
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
              CATEGORY_STYLE[tool.category] ?? "bg-white/5 text-muted"
            }`}
          >
            {tool.category}
          </span>
          {isExternal && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-muted/30 group-hover:text-muted/60 transition-colors shrink-0"
            >
              <path
                d="M4.5 2H10v5.5M10 2L3 9"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <h3 className="text-[13px] font-medium text-foreground/90 mb-1 group-hover:text-foreground transition-colors leading-snug">
          {tool.title}
        </h3>
        <p className="text-[12px] text-muted/60 leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </a>

      {/* Pin button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin(tool.id, tool.pinned);
        }}
        className={`absolute bottom-3 right-3 p-1 rounded transition-colors ${
          tool.pinned
            ? "text-accent"
            : "text-muted/20 hover:text-muted/50"
        }`}
        aria-label={tool.pinned ? "Unpin from favorites" : "Pin to favorites"}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill={tool.pinned ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 1.5L9 1.5L9.5 5.5L11.5 7L11.5 8.5L8 8.5L8 12.5L6 12.5L6 8.5L2.5 8.5L2.5 7L4.5 5.5L5 1.5Z" />
        </svg>
      </button>
    </div>
  );
}

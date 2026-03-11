"use client";

import { useEffect, useMemo, useState } from "react";
import { getActiveTools, seedTools, type ToolItem } from "@/lib/tools";
import Link from "next/link";

const CATEGORY_STYLE: Record<string, string> = {
  "teaching": "bg-sky-50 text-sky-600",
  "publishing": "bg-violet-50 text-violet-600",
  "accessibility": "bg-emerald-50 text-emerald-600",
  "simulation": "bg-amber-50 text-amber-600",
  "classroom": "bg-rose-50 text-rose-600",
};

const CATEGORY_LABEL: Record<string, string> = {
  "teaching": "Teaching",
  "publishing": "Publishing",
  "accessibility": "Accessibility",
  "simulation": "Simulations",
  "classroom": "Classroom",
};

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

  const categories = useMemo(
    () => [...new Set(tools.map((t) => t.category))],
    [tools]
  );

  const filtered = useMemo(() => {
    let result = tools;
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
  }, [tools, search, activeCategory]);

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);

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
          Tools &amp; Resources
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Launch external tools and resources from one place.
        </p>
      </header>

      {/* Search + Filter */}
      {!loading && tools.length > 0 && (
        <div className="mb-8 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted/50 outline-none focus:border-accent/30 transition-colors shadow-card"
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
                    ? CATEGORY_STYLE[cat] ?? "bg-gray-50 text-muted"
                    : "text-muted/50 hover:text-muted/80"
                }`}
              >
                {CATEGORY_LABEL[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <p className="text-sm text-muted/60">Loading...</p>
      ) : tools.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 shadow-card text-center">
          <p className="text-sm text-muted">
            No tools or resources yet.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted/60 text-center py-8">
          No matching tools found.
        </p>
      ) : (
        <div className="space-y-10">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-4">
                {CATEGORY_LABEL[category] ?? category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolItem }) {
  const isExternal = tool.url !== "#";

  return (
    <a
      href={tool.url}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group bg-surface rounded-xl border border-border p-5 shadow-card transition-all hover:shadow-card-hover hover:border-border-strong"
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
            CATEGORY_STYLE[tool.category] ?? "bg-gray-50 text-muted"
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
      <h3 className="text-[14px] font-medium text-foreground/90 mb-1 group-hover:text-foreground transition-colors">
        {tool.title}
      </h3>
      <p className="text-[12px] text-muted leading-relaxed">
        {tool.description}
      </p>
    </a>
  );
}

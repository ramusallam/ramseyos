"use client";

import { Suspense, useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { globalSearch, getTypeMeta, type SearchResult } from "@/lib/search";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white/40 text-sm">Loading search...</div>}>
      <SearchInner />
    </Suspense>
  );
}

function SearchInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Run initial query from URL param
  useEffect(() => {
    if (initialQuery.length >= 2) {
      runSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    try {
      const r = await globalSearch(q);
      setResults(r);
      setHasSearched(true);
    } catch (e) {
      console.error("[search] error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runSearch(value), 300);
    },
    [runSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearch("");
        setResults([]);
        setHasSearched(false);
        inputRef.current?.focus();
      }
    },
    []
  );

  // Group results by type
  const grouped = useMemo(() => {
    const groups = new Map<SearchResult["type"], SearchResult[]>();
    for (const r of results) {
      const list = groups.get(r.type) ?? [];
      list.push(r);
      groups.set(r.type, list);
    }
    return Array.from(groups.entries());
  }, [results]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">
          Search
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          Find anything across tasks, projects, lessons, tools, and more.
        </p>
      </header>

      {/* Search input */}
      <div className="relative mb-8">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card focus-within:border-accent/30 transition-colors">
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-muted"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search everything..."
            className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted/40 outline-none"
            autoComplete="off"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setResults([]);
                setHasSearched(false);
                inputRef.current?.focus();
              }}
              className="text-[10px] text-muted hover:text-foreground/60 transition-colors border border-border rounded px-2 py-0.5"
            >
              Clear
            </button>
          )}
          <kbd className="text-[10px] text-muted font-mono border border-border rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-12 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Searching...</span>
        </div>
      )}

      {/* Empty state — no query */}
      {!loading && !hasSearched && (
        <div className="rounded-xl border border-border bg-surface backdrop-blur-sm p-12 text-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-muted/20 mb-5"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" />
          </svg>
          <p className="text-[16px] text-muted/50 font-medium">
            Search across everything
          </p>
          <p className="text-[13px] text-muted/40 mt-2">
            Tasks, projects, lesson plans, tools, products, drafts, and captures.
          </p>
        </div>
      )}

      {/* No results */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="rounded-xl border border-border bg-surface backdrop-blur-sm p-12 text-center">
          <p className="text-[16px] text-muted/50 font-medium">
            No results found
          </p>
          <p className="text-[13px] text-muted/40 mt-2">
            Try a different search term or check your spelling.
          </p>
        </div>
      )}

      {/* Results grouped by type */}
      {!loading && hasSearched && results.length > 0 && (
        <div className="space-y-6">
          {/* Result count */}
          <p className="text-[11px] text-muted tabular-nums">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </p>

          {grouped.map(([type, items]) => {
            const meta = getTypeMeta(type);
            return (
              <section key={type}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-muted tabular-nums">
                    {items.length}
                  </span>
                  <div className="flex-1 border-t border-border" />
                </div>

                {/* Items */}
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-all hover:bg-surface-raised/40 hover:border-border-strong/50"
                      >
                        {/* Type badge */}
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${meta.color} bg-white/[0.04]`}
                        >
                          {meta.label}
                        </span>

                        {/* Title + subtitle */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[14px] text-foreground/85 group-hover:text-foreground transition-colors truncate block">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="text-[11px] text-muted/50 truncate block mt-0.5">
                              {item.subtitle}
                            </span>
                          )}
                        </div>

                        {/* Status */}
                        {item.status && (
                          <span className="text-[10px] text-muted/40 shrink-0">
                            {item.status}
                          </span>
                        )}

                        {/* Arrow */}
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted/20 group-hover:text-muted/50 transition-colors shrink-0"
                        >
                          <path d="M6 4l4 4-4 4" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

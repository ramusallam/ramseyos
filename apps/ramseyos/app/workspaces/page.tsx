"use client";

import { useEffect, useState } from "react";
import { WORKSPACES, getWorkspaceSummary, type Workspace, type WorkspaceSummary } from "@/lib/workspaces";
import Link from "next/link";

export default function WorkspacesPage() {
  const schoolWorkspaces = WORKSPACES.filter((w) => w.domain === "school");
  const consultingWorkspaces = WORKSPACES.filter((w) => w.domain === "consulting");

  const [summaries, setSummaries] = useState<Record<string, WorkspaceSummary>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(WORKSPACES.map((w) => getWorkspaceSummary(w.id))).then((results) => {
      if (cancelled) return;
      const map: Record<string, WorkspaceSummary> = {};
      for (const s of results) map[s.id] = s;
      setSummaries(map);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* Header */}
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-[22px] font-semibold text-foreground tracking-tight mt-2">
          Workspaces
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Your professional domains and their active work.
        </p>
      </header>

      {/* Schools */}
      <WorkspaceDomainSection label="Schools" workspaces={schoolWorkspaces} summaries={summaries} />

      {/* Consulting */}
      <div className="mt-8">
        <WorkspaceDomainSection label="Consulting" workspaces={consultingWorkspaces} summaries={summaries} />
      </div>
    </div>
  );
}

function WorkspaceDomainSection({
  label,
  workspaces,
  summaries,
}: {
  label: string;
  workspaces: Workspace[];
  summaries: Record<string, WorkspaceSummary>;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted">
          {label}
        </h2>
        <div className="flex-1 border-t border-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {workspaces.map((w) => (
          <WorkspaceCard key={w.id} workspace={w} summary={summaries[w.id]} />
        ))}
      </div>
    </section>
  );
}

function WorkspaceCard({ workspace, summary }: { workspace: Workspace; summary?: WorkspaceSummary }) {
  const isSchool = workspace.domain === "school";

  return (
    <Link
      href={`/workspaces/${workspace.id}`}
      className="group rounded-xl border border-border bg-surface p-5 shadow-card transition-all hover:shadow-card-hover hover:border-border-strong"
    >
      <div className="flex items-start gap-3">
        {/* Color dot */}
        <span
          className={`mt-1 size-2.5 rounded-full shrink-0 ${workspace.color.replace("/10", "/60")}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-semibold text-foreground tracking-tight truncate">
              {workspace.name}
            </h3>
          </div>
          <p className="text-[12px] text-muted leading-relaxed">
            {workspace.description}
          </p>

          {/* Quick counts */}
          {summary && (
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted/70 tabular-nums">
              <span>{summary.projectCount} projects</span>
              <span className="text-muted/30">/</span>
              <span>{summary.openTaskCount} open tasks</span>
              {isSchool && summary.lessonPlanCount > 0 && (
                <>
                  <span className="text-muted/30">/</span>
                  <span>{summary.lessonPlanCount} lessons</span>
                </>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${workspace.color} ${workspace.accent}`}
            >
              {workspace.domain}
            </span>
            <span className="text-[11px] text-muted/50 group-hover:text-accent transition-colors ml-auto">
              View &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

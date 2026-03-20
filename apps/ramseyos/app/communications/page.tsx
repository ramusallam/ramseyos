"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getActiveTemplates,
  seedTemplates,
  seedTemplatePairings,
  updateTemplateFavorite,
  type TemplateItem,
} from "@/lib/templates";
import {
  getActiveGroups,
  getGroupMembers,
  seedGroups,
  type GroupItem,
  type GroupMember,
} from "@/lib/groups";

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  school: { bg: "bg-blue-50 border-blue-200/40", text: "text-blue-600/70", label: "School" },
  personal: { bg: "bg-amber-50 border-amber-200/40", text: "text-amber-600/70", label: "Personal" },
  professional: { bg: "bg-emerald-50 border-emerald-200/40", text: "text-emerald-600/70", label: "Professional" },
};

function categoryMeta(cat: string) {
  return CATEGORY_STYLES[cat] ?? { bg: "bg-gray-50 border-gray-200/40", text: "text-gray-500/70", label: cat || "Other" };
}

export default function CommunicationsPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([seedTemplates(), seedGroups()]).then(async () => {
      await seedTemplatePairings();
      const [t, g, m] = await Promise.all([
        getActiveTemplates(),
        getActiveGroups(),
        getGroupMembers(),
      ]);
      setTemplates(t);
      setGroups(g);
      setMembers(m);
      setLoading(false);
    });
  }, []);

  const toggleFavorite = useCallback(
    async (id: string) => {
      const t = templates.find((x) => x.id === id);
      if (!t) return;
      const next = !t.favorite;
      setTemplates((prev) =>
        prev.map((x) => (x.id === id ? { ...x, favorite: next } : x))
      );
      await updateTemplateFavorite(id, next);
    },
    [templates]
  );

  const favorites = templates.filter((t) => t.favorite);
  const nonFavorites = templates.filter((t) => !t.favorite);

  const grouped = new Map<string, TemplateItem[]>();
  for (const t of nonFavorites) {
    const key = t.category || "other";
    const arr = grouped.get(key) ?? [];
    arr.push(t);
    grouped.set(key, arr);
  }
  const categoryOrder = ["school", "professional", "personal"];
  const sortedCategories = Array.from(grouped.entries()).sort(
    ([a], [b]) => (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) - (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  );

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
          Communications
        </h1>
        <p className="text-[12px] text-muted/60 mt-1">
          {templates.length} template{templates.length === 1 ? "" : "s"}
        </p>
      </header>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-surface/40 p-8 text-center">
          <p className="text-[12px] text-muted/50">
            No communication templates yet.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Favorites */}
          {favorites.length > 0 && (
            <section>
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/80 mb-3 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12l-4.2 2.5.8-4.7L1.2 6.5l4.7-.7L8 1.5z" />
                </svg>
                Favorites
              </h2>
              <div className="space-y-2">
                {favorites.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    groups={groups}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          )}

          {/* By Category */}
          {sortedCategories.map(([cat, items]) => {
            const meta = categoryMeta(cat);
            return (
              <section key={cat}>
                <h2 className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${meta.text}`}>
                  {meta.label}
                  <span className="ml-2 text-muted/40 font-normal">{items.length}</span>
                </h2>
                <div className="space-y-2">
                  {items.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      groups={groups}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Groups */}
          {groups.length > 0 && (
            <section>
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60 mb-3 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="6" cy="5" r="2.5" />
                  <path d="M1.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
                  <circle cx="11.5" cy="5.5" r="2" />
                  <path d="M14.5 13c0-2 1.2-3 0-3" />
                </svg>
                Groups
                <span className="text-muted/40 font-normal">{groups.length}</span>
              </h2>
              <div className="space-y-2">
                {groups.map((g) => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    members={members.filter((m) => m.groupId === g.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template: t,
  groups,
  onToggleFavorite,
}: {
  template: TemplateItem;
  groups: GroupItem[];
  onToggleFavorite: (id: string) => void;
}) {
  const style = categoryMeta(t.category);
  const preview =
    t.body.length > 120 ? t.body.slice(0, 120).trimEnd() + "..." : t.body;
  const linkedGroups = t.linkedGroupIds
    .map((gid) => groups.find((g) => g.id === gid))
    .filter((g): g is GroupItem => !!g);

  return (
    <div className="rounded-lg bg-surface border border-border/40 px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-[14px] font-medium text-foreground/85">
              {t.title}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0 text-[9px] font-medium ${style.bg} ${style.text}`}
            >
              {t.category}
            </span>
          </div>
          {t.subject && (
            <p className="text-[11px] text-foreground/50 mb-1">
              Subject: {t.subject}
            </p>
          )}
          <p className="text-[12px] text-muted/50 leading-relaxed whitespace-pre-line">
            {preview}
          </p>
          {linkedGroups.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted/30 shrink-0">
                <circle cx="6" cy="5" r="2.5" />
                <path d="M1.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
              </svg>
              {linkedGroups.map((g) => (
                <span
                  key={g.id}
                  className="inline-flex items-center rounded-full bg-gray-50 border border-border/30 px-2 py-0 text-[9px] font-medium text-foreground/50"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite(t.id)}
          className="shrink-0 mt-0.5 p-1 rounded transition-colors hover:bg-amber-50"
          aria-label={t.favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill={t.favorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.2"
            className={t.favorite ? "text-amber-400" : "text-muted/30 hover:text-amber-300"}
          >
            <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12l-4.2 2.5.8-4.7L1.2 6.5l4.7-.7L8 1.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function GroupCard({
  group,
  members,
}: {
  group: GroupItem;
  members: GroupMember[];
}) {
  const [expanded, setExpanded] = useState(false);
  const style = categoryMeta(group.category);

  return (
    <div className="rounded-lg bg-surface border border-border/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-surface-raised/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-[14px] font-medium text-foreground/85">
              {group.name}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0 text-[9px] font-medium ${style.bg} ${style.text}`}
            >
              {group.category}
            </span>
            <span className="text-[10px] text-muted/40">
              {members.length} member{members.length === 1 ? "" : "s"}
            </span>
          </div>
          {group.description && (
            <p className="text-[11px] text-muted/45 mt-0.5">{group.description}</p>
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`shrink-0 text-muted/30 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-5 py-3">
          {members.length === 0 ? (
            <p className="text-[11px] text-muted/40">No members yet.</p>
          ) : (
            <div className="space-y-1.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 border border-border/30 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-medium text-muted/60">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] font-medium text-foreground/75">
                      {m.name}
                    </span>
                    {m.role && (
                      <span className="ml-2 text-[10px] text-muted/40">{m.role}</span>
                    )}
                  </div>
                  {m.email && (
                    <span className="text-[10px] text-muted/35 truncate max-w-[180px]">
                      {m.email}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

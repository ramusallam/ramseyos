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
import {
  getDrafts,
  seedDrafts,
  updateDraftGmailStatus,
  type DraftItem,
  type DraftStatus,
  type GmailHandoffStatus,
} from "@/lib/drafts";

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
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([seedTemplates(), seedGroups(), seedDrafts()]).then(async () => {
      await seedTemplatePairings();
      const [t, g, m, d] = await Promise.all([
        getActiveTemplates(),
        getActiveGroups(),
        getGroupMembers(),
        getDrafts(),
      ]);
      setTemplates(t);
      setGroups(g);
      setMembers(m);
      setDrafts(d);
      setLoading(false);
    });
  }, []);

  const setGmailStatus = useCallback(
    async (id: string, gmailStatus: GmailHandoffStatus) => {
      setDrafts((prev) =>
        prev.map((x) => (x.id === id ? { ...x, gmailStatus } : x))
      );
      await updateDraftGmailStatus(id, gmailStatus);
    },
    []
  );

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
          {templates.length} template{templates.length === 1 ? "" : "s"} · {drafts.length} draft{drafts.length === 1 ? "" : "s"}
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
          {/* Mail */}
          <section>
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60 mb-3 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="14" height="10" rx="1.5" />
                <path d="M1 4.5l7 4.5 7-4.5" />
              </svg>
              Mail
              <span className="text-muted/40 font-normal">{drafts.length}</span>
            </h2>

            <div className="rounded-lg border border-border/40 bg-surface/40 px-4 py-2.5 mb-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-amber-300/40" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400/70" />
              </span>
              <span className="text-[11px] text-muted/55">
                Gmail sending is not connected yet — drafts are saved locally
              </span>
            </div>

            {drafts.length === 0 ? (
              <div className="rounded-lg border border-border/30 bg-surface/30 p-6 text-center">
                <p className="text-[11px] text-muted/40">No drafts yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {drafts.map((d) => (
                  <DraftCard key={d.id} draft={d} groups={groups} templates={templates} members={members} onGmailStatus={setGmailStatus} />
                ))}
              </div>
            )}
          </section>

          {/* Gmail Handoff */}
          {drafts.some((d) => d.gmailStatus === "ready_for_gmail" || d.gmailStatus === "handed_off") && (
            <section>
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60 mb-3 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3l-8.5 8.5L2 8" />
                </svg>
                Gmail Handoff
                <span className="text-muted/40 font-normal">
                  {drafts.filter((d) => d.gmailStatus === "ready_for_gmail" || d.gmailStatus === "handed_off").length}
                </span>
              </h2>

              <div className="rounded-lg border border-border/40 bg-surface/40 px-4 py-2.5 mb-3 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-300/40" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400/70" />
                </span>
                <span className="text-[11px] text-muted/55">
                  Drafts prepared for Gmail — sending will be enabled in a future update
                </span>
              </div>

              <div className="space-y-2">
                {drafts
                  .filter((d) => d.gmailStatus === "ready_for_gmail" || d.gmailStatus === "handed_off")
                  .map((d) => (
                    <DraftCard key={`handoff-${d.id}`} draft={d} groups={groups} templates={templates} members={members} onGmailStatus={setGmailStatus} />
                  ))}
              </div>
            </section>
          )}

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

const DRAFT_STATUS_STYLES: Record<DraftStatus, { dot: string; label: string }> = {
  draft: { dot: "bg-gray-300", label: "Draft" },
  ready: { dot: "bg-blue-400", label: "Ready" },
  sent: { dot: "bg-emerald-400", label: "Sent" },
  failed: { dot: "bg-red-400", label: "Failed" },
};

function buildMailtoLink(draft: DraftItem, recipients: GroupMember[]): string {
  const to = recipients
    .filter((r) => r.email)
    .map((r) => r.email)
    .join(",");
  const params = new URLSearchParams();
  if (draft.subject) params.set("subject", draft.subject);
  if (draft.body) params.set("body", draft.body);
  const qs = params.toString();
  return `mailto:${encodeURI(to)}${qs ? `?${qs}` : ""}`;
}

const GMAIL_STATUS_STYLES: Record<GmailHandoffStatus, { dot: string; label: string }> = {
  not_prepared: { dot: "bg-gray-300", label: "Not prepared" },
  ready_for_gmail: { dot: "bg-blue-400", label: "Ready for Gmail" },
  handed_off: { dot: "bg-emerald-400", label: "Handed off" },
};

function DraftCard({
  draft: d,
  groups,
  templates,
  members,
  onGmailStatus,
}: {
  draft: DraftItem;
  groups: GroupItem[];
  templates: TemplateItem[];
  members: GroupMember[];
  onGmailStatus: (id: string, status: GmailHandoffStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = DRAFT_STATUS_STYLES[d.status] ?? DRAFT_STATUS_STYLES.draft;
  const gmail = GMAIL_STATUS_STYLES[d.gmailStatus] ?? GMAIL_STATUS_STYLES.not_prepared;
  const linkedTemplate = d.templateId
    ? templates.find((t) => t.id === d.templateId)
    : undefined;
  const linkedGroup = d.groupId
    ? groups.find((g) => g.id === d.groupId)
    : undefined;
  const recipients = linkedGroup
    ? members.filter((m) => m.groupId === linkedGroup.id)
    : [];
  const isAssembled = !!(linkedTemplate && linkedGroup);
  const preview =
    d.body.length > 100 ? d.body.slice(0, 100).trimEnd() + "..." : d.body;

  return (
    <div className="rounded-lg bg-surface border border-border/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-surface-raised/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-[14px] font-medium text-foreground/85">
              {d.subject || "Untitled draft"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-gray-50 px-2 py-0 text-[9px] font-medium text-muted/60">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            {d.gmailStatus !== "not_prepared" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/30 bg-blue-50 px-2 py-0 text-[9px] font-medium text-blue-600/60">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${gmail.dot}`} />
                {gmail.label}
              </span>
            )}
          </div>
          {!expanded && (
            <p className="text-[12px] text-muted/50 leading-relaxed">
              {preview}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2">
            {linkedTemplate ? (
              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200/30 px-2 py-0 text-[9px] font-medium text-blue-600/60">
                {linkedTemplate.title}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-50 border border-dashed border-border/40 px-2 py-0 text-[9px] font-medium text-muted/35">
                No template
              </span>
            )}
            {linkedGroup ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/30 px-2 py-0 text-[9px] font-medium text-emerald-600/60">
                {linkedGroup.name}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-50 border border-dashed border-border/40 px-2 py-0 text-[9px] font-medium text-muted/35">
                No group
              </span>
            )}
            {recipients.length > 0 && (
              <span className="text-[9px] text-muted/40 ml-1">
                {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`shrink-0 mt-1.5 text-muted/30 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-5 py-4 space-y-4">
          {!isAssembled && (
            <div className="rounded-md border border-dashed border-amber-300/50 bg-amber-50/40 px-3.5 py-2.5 flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400/70" />
              </span>
              <span className="text-[11px] text-amber-700/60">
                Incomplete — assign a template and group to fully assemble this draft
              </span>
            </div>
          )}

          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted/40 mb-1.5">Subject</p>
            <p className="text-[13px] text-foreground/80">{d.subject || "—"}</p>
          </div>

          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted/40 mb-1.5">Body</p>
            <p className="text-[12px] text-foreground/65 leading-relaxed whitespace-pre-line">{d.body}</p>
          </div>

          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted/40 mb-1.5">
              Recipients{recipients.length > 0 && <span className="font-normal ml-1">({recipients.length})</span>}
            </p>
            {recipients.length === 0 ? (
              <p className="text-[11px] text-muted/35 italic">No recipients — assign a group to derive recipients</p>
            ) : (
              <div className="space-y-1">
                {recipients.map((r) => (
                  <div key={r.id} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gray-100 border border-border/30 flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-medium text-muted/60">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-foreground/70">{r.name}</span>
                    {r.email && (
                      <span className="text-[10px] text-muted/35">{r.email}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gmail Handoff Actions */}
          <div className="border-t border-border/20 pt-3">
            <div className="flex items-center gap-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted/40">Gmail</p>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-muted/50">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${gmail.dot}`} />
                {gmail.label}
              </span>
              <div className="flex-1" />
              {d.gmailStatus === "not_prepared" && isAssembled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGmailStatus(d.id, "ready_for_gmail");
                  }}
                  className="text-[10px] font-medium text-blue-600/70 bg-blue-50 border border-blue-200/30 rounded-md px-3 py-1 hover:bg-blue-100/60 transition-colors"
                >
                  Prepare for Gmail
                </button>
              )}
              {d.gmailStatus === "not_prepared" && !isAssembled && (
                <span className="text-[10px] text-muted/35 italic">
                  Complete draft to prepare
                </span>
              )}
              {d.gmailStatus === "ready_for_gmail" && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGmailStatus(d.id, "not_prepared");
                    }}
                    className="text-[10px] font-medium text-muted/50 bg-gray-50 border border-border/30 rounded-md px-3 py-1 hover:bg-gray-100/60 transition-colors"
                  >
                    Unprepare
                  </button>
                  <a
                    href={buildMailtoLink(d, recipients)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGmailStatus(d.id, "handed_off");
                    }}
                    className="text-[10px] font-medium text-white bg-blue-500 border border-blue-600/30 rounded-md px-3 py-1 hover:bg-blue-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 11L11 5" />
                      <path d="M7 5h4v4" />
                    </svg>
                    Open in Gmail
                  </a>
                </>
              )}
              {d.gmailStatus === "handed_off" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGmailStatus(d.id, "ready_for_gmail");
                  }}
                  className="text-[10px] font-medium text-muted/50 bg-gray-50 border border-border/30 rounded-md px-3 py-1 hover:bg-gray-100/60 transition-colors"
                >
                  Re-open
                </button>
              )}
            </div>
            {d.gmailStatus === "handed_off" && (
              <div className="mt-2.5 rounded-md border border-emerald-200/40 bg-emerald-50/40 px-3.5 py-2 flex items-center gap-2">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500/70 shrink-0">
                  <path d="M14 3l-8.5 8.5L2 8" />
                </svg>
                <span className="text-[11px] text-emerald-700/60">
                  Opened in Gmail — complete sending in your mail client
                </span>
              </div>
            )}
          </div>
        </div>
      )}
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

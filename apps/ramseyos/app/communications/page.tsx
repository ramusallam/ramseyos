"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
import Link from "next/link";

/* ── Style maps ── */

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  school: { bg: "bg-blue-500/10 border-blue-400/20", text: "text-blue-400/80", label: "School" },
  personal: { bg: "bg-amber-500/10 border-amber-400/20", text: "text-amber-400/80", label: "Personal" },
  professional: { bg: "bg-emerald-500/10 border-emerald-400/20", text: "text-emerald-400/80", label: "Professional" },
};

function categoryMeta(cat: string) {
  return CATEGORY_STYLES[cat] ?? { bg: "bg-white/5 border-white/10", text: "text-muted/70", label: cat || "Other" };
}

const GMAIL_STATUS_META: Record<GmailHandoffStatus, { dot: string; label: string; color: string }> = {
  not_prepared: { dot: "bg-muted/30", label: "Draft", color: "text-muted/50" },
  ready_for_gmail: { dot: "bg-blue-400", label: "Ready to send", color: "text-blue-400/70" },
  handed_off: { dot: "bg-emerald-400", label: "Sent", color: "text-emerald-400/70" },
};

const DRAFT_STATUS_META: Record<DraftStatus, { dot: string; label: string }> = {
  draft: { dot: "bg-muted/40", label: "Draft" },
  ready: { dot: "bg-blue-400", label: "Ready" },
  sent: { dot: "bg-emerald-400", label: "Sent" },
  failed: { dot: "bg-red-400", label: "Failed" },
};

/* ── Page ── */

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
      let next = false;
      setTemplates((prev) =>
        prev.map((x) => {
          if (x.id !== id) return x;
          next = !x.favorite;
          return { ...x, favorite: next };
        })
      );
      await updateTemplateFavorite(id, next);
    },
    []
  );

  /* ── Derived ── */

  const {
    favorites,
    sortedCategories,
    handoffDrafts,
    regularDrafts,
    readyCount,
    handedOffCount,
    totalRecipients,
  } = useMemo(() => {
    const favs: TemplateItem[] = [];
    const nonFavs: TemplateItem[] = [];
    for (const t of templates) {
      if (t.favorite) favs.push(t);
      else nonFavs.push(t);
    }

    const grouped = new Map<string, TemplateItem[]>();
    for (const t of nonFavs) {
      const key = t.category || "other";
      const arr = grouped.get(key);
      if (arr) arr.push(t);
      else grouped.set(key, [t]);
    }
    const categoryOrder = ["school", "professional", "personal"];
    const sorted = Array.from(grouped.entries()).sort(
      ([a], [b]) =>
        (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
        (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
    );

    const handoff: DraftItem[] = [];
    const regular: DraftItem[] = [];
    let ready = 0;
    let handedOff = 0;
    for (const d of drafts) {
      if (d.gmailStatus === "ready_for_gmail" || d.gmailStatus === "handed_off") {
        handoff.push(d);
      } else {
        regular.push(d);
      }
      if (d.gmailStatus === "ready_for_gmail") ready++;
      if (d.gmailStatus === "handed_off") handedOff++;
    }

    const emails = new Set<string>();
    for (const m of members) {
      if (m.email) emails.add(m.email);
    }

    return {
      favorites: favs,
      sortedCategories: sorted,
      handoffDrafts: handoff,
      regularDrafts: regular,
      readyCount: ready,
      handedOffCount: handedOff,
      totalRecipients: emails.size,
    };
  }, [templates, drafts, members]);

  if (loading) {
    return (
      <div className="max-w-5xl px-4 sm:px-8 pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading communications…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* Header */}
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">
          Communications
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          Templates, groups, and drafts for students, parents, and outbound communication.
        </p>

        {/* Teaching cross-links */}
        <div className="flex items-center gap-3 mt-2">
          <Link href="/lesson-plans" className="text-[11px] text-muted hover:text-muted/60 transition-colors">
            Lesson Plans &rarr;
          </Link>
          <Link href="/tasks" className="text-[11px] text-muted hover:text-muted/60 transition-colors">
            Tasks &rarr;
          </Link>
          <Link href="/projects" className="text-[11px] text-muted hover:text-muted/60 transition-colors">
            Projects &rarr;
          </Link>
        </div>

        {/* Workflow summary */}
        <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
          <span className="tabular-nums">{templates.length} template{templates.length !== 1 ? "s" : ""}</span>
          <span className="text-border/30">·</span>
          <span className="tabular-nums">{groups.length} group{groups.length !== 1 ? "s" : ""}</span>
          <span className="text-border/30">·</span>
          <span className="tabular-nums">{totalRecipients} recipient{totalRecipients !== 1 ? "s" : ""}</span>
          {drafts.length > 0 && (
            <>
              <span className="text-border/30">·</span>
              <span className="tabular-nums">{drafts.length} draft{drafts.length !== 1 ? "s" : ""}</span>
            </>
          )}
          {readyCount > 0 && (
            <span className="flex items-center gap-1.5 text-blue-400/60">
              <span className="size-1.5 rounded-full bg-blue-400" />
              {readyCount} ready
            </span>
          )}
          {handedOffCount > 0 && (
            <span className="flex items-center gap-1.5 text-emerald-400/60">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              {handedOffCount} sent
            </span>
          )}
        </div>
      </header>

      {/* ═══ Workflow zones ═══ */}
      <div className="space-y-10">

        {/* ── Zone 1: Draft Pipeline ── */}
        <section>
          <ZoneHeader
            icon={<path d="M1 3h14v10H1zM1 4.5l7 4.5 7-4.5" />}
            title="Draft Pipeline"
            count={drafts.length}
            badge={readyCount > 0 ? `${readyCount} ready` : undefined}
            badgeColor="text-blue-400/70"
          />

          {/* Send status — calm inline */}
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="size-1.5 rounded-full bg-amber-400/50" />
            <span className="text-[10px] text-muted">
              Drafts open in your mail client when ready to send
            </span>
          </div>

          {drafts.length === 0 ? (
            <EmptyState
              icon="M1 3h14v10H1zM1 4.5l7 4.5 7-4.5"
              message="No drafts yet"
              detail="Drafts you create from templates will appear here."
            />
          ) : (
            <div className="space-y-6">
              {/* Ready-to-send drafts first */}
              {handoffDrafts.length > 0 && (
                <div>
                  <SubsectionLabel label="Ready to send" count={handoffDrafts.length} color="text-blue-400/70" lineColor="border-blue-400/10" />
                  <div className="space-y-2">
                    {handoffDrafts.map((d) => (
                      <DraftCard
                        key={d.id}
                        draft={d}
                        groups={groups}
                        templates={templates}
                        members={members}
                        onGmailStatus={setGmailStatus}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* In-progress drafts */}
              {regularDrafts.length > 0 && (
                <div>
                  {handoffDrafts.length > 0 && (
                    <SubsectionLabel label="In progress" count={regularDrafts.length} color="text-muted/50" lineColor="border-border" />
                  )}
                  <div className="space-y-2">
                    {regularDrafts.map((d) => (
                      <DraftCard
                        key={d.id}
                        draft={d}
                        groups={groups}
                        templates={templates}
                        members={members}
                        onGmailStatus={setGmailStatus}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Zone 2: Templates (what to send) ── */}
        <section>
          <ZoneHeader
            icon={<path d="M3 1h10a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1zM5 5h6M5 8h4" />}
            title="Templates"
            count={templates.length}
            badge={favorites.length > 0 ? `${favorites.length} fav` : undefined}
            badgeColor="text-amber-400/70"
          />

          {templates.length === 0 ? (
            <EmptyState
              icon="M3 1h10a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1zM5 5h6M5 8h4"
              message="No templates yet"
              detail="Communication templates will appear here."
            />
          ) : (
            <div className="space-y-6">
              {/* Favorites */}
              {favorites.length > 0 && (
                <div>
                  <SubsectionLabel
                    label="Favorites"
                    count={favorites.length}
                    color="text-amber-400/70"
                    lineColor="border-amber-400/10"
                    icon={
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="text-amber-400/80">
                        <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12l-4.2 2.5.8-4.7L1.2 6.5l4.7-.7L8 1.5z" />
                      </svg>
                    }
                  />
                  <div className="space-y-2">
                    {favorites.map((t) => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        groups={groups}
                        members={members}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* By category */}
              {sortedCategories.map(([cat, items]) => {
                const meta = categoryMeta(cat);
                return (
                  <div key={cat}>
                    <SubsectionLabel label={meta.label} count={items.length} color={meta.text} lineColor="border-border" />
                    <div className="space-y-2">
                      {items.map((t) => (
                        <TemplateCard
                          key={t.id}
                          template={t}
                          groups={groups}
                          members={members}
                          onToggleFavorite={toggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Zone 3: Groups & Recipients (who to send to) ── */}
        <section>
          <ZoneHeader
            icon={<><circle cx="6" cy="5" r="2.5" /><path d="M1.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" /><circle cx="11.5" cy="5.5" r="2" /><path d="M14.5 13c0-2 1.2-3 0-3" /></>}
            title="Groups"
            count={groups.length}
            badge={`${totalRecipients} recipients`}
            badgeColor="text-muted"
          />

          {groups.length === 0 ? (
            <EmptyState
              icon="M8 2a6 6 0 100 12A6 6 0 008 2z"
              message="No groups yet"
              detail="Recipient groups will appear here."
            />
          ) : (
            <div className="space-y-2">
              {groups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  members={members.filter((m) => m.groupId === g.id)}
                  linkedTemplates={templates.filter((t) =>
                    t.linkedGroupIds.includes(g.id)
                  )}
                  draftCount={drafts.filter((d) => d.groupId === g.id).length}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ── Shared UI ── */

function ZoneHeader({
  icon,
  title,
  count,
  badge,
  badgeColor,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  badge?: string;
  badgeColor?: string;
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
        className="text-muted"
      >
        {icon}
      </svg>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">
        {title}
      </h2>
      <span className="text-[10px] tabular-nums text-muted">
        {count}
      </span>
      {badge && (
        <span className={`text-[10px] tabular-nums ${badgeColor ?? "text-muted"}`}>
          · {badge}
        </span>
      )}
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

function SubsectionLabel({
  label,
  count,
  color,
  lineColor,
  icon,
}: {
  label: string;
  count: number;
  color: string;
  lineColor: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}>
        {label}
      </span>
      <span className="text-[10px] tabular-nums text-muted">
        {count}
      </span>
      <div className={`flex-1 border-t ${lineColor}`} />
    </div>
  );
}

function EmptyState({ icon, message, detail }: { icon: string; message: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface backdrop-blur-sm p-8 text-center">
      <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted/20 mb-3">
        <path d={icon} />
      </svg>
      <p className="text-[13px] text-muted/50">{message}</p>
      <p className="text-[11px] text-muted mt-1">{detail}</p>
    </div>
  );
}

/* ── Template card ── */

function TemplateCard({
  template: t,
  groups,
  members,
  onToggleFavorite,
}: {
  template: TemplateItem;
  groups: GroupItem[];
  members: GroupMember[];
  onToggleFavorite: (id: string) => void;
}) {
  const style = categoryMeta(t.category);
  const preview =
    t.body.length > 120 ? t.body.slice(0, 120).trimEnd() + "…" : t.body;
  const linkedGroups = t.linkedGroupIds
    .map((gid) => groups.find((g) => g.id === gid))
    .filter((g): g is GroupItem => !!g);

  // Derive total recipient count from linked groups
  const recipientCount = linkedGroups.reduce(
    (sum, g) => sum + members.filter((m) => m.groupId === g.id && m.email).length,
    0
  );

  return (
    <div className="rounded-xl bg-surface backdrop-blur-sm border border-border px-5 py-4 transition-all hover:border-border-strong/50">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-[13px] font-medium text-foreground/85">
              {t.title}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0 text-[9px] font-medium ${style.bg} ${style.text}`}
            >
              {style.label}
            </span>
          </div>
          {t.subject && (
            <p className="text-[11px] text-foreground/50 mb-1">
              <span className="text-muted">Subject:</span> {t.subject}
            </p>
          )}
          <p className="text-[12px] text-muted/45 leading-relaxed whitespace-pre-line line-clamp-2">
            {preview}
          </p>

          {/* Linked groups + recipient count */}
          {linkedGroups.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted shrink-0">
                <path d="M8 4l4 4-4 4M4 4l4 4-4 4" />
              </svg>
              {linkedGroups.map((g) => (
                <span
                  key={g.id}
                  className="inline-flex items-center rounded-full bg-white/5 border border-border px-2 py-0 text-[9px] font-medium text-foreground/50"
                >
                  {g.name}
                </span>
              ))}
              {recipientCount > 0 && (
                <span className="text-[9px] text-muted ml-0.5">
                  → {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite(t.id)}
          className="shrink-0 mt-0.5 p-1 rounded transition-colors hover:bg-amber-500/10"
          aria-label={t.favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill={t.favorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.2"
            className={t.favorite ? "text-amber-400" : "text-muted hover:text-amber-300"}
          >
            <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12l-4.2 2.5.8-4.7L1.2 6.5l4.7-.7L8 1.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── Draft card ── */

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
  const status = DRAFT_STATUS_META[d.status] ?? DRAFT_STATUS_META.draft;
  const gmail = GMAIL_STATUS_META[d.gmailStatus] ?? GMAIL_STATUS_META.not_prepared;
  const linkedTemplate = d.templateId
    ? templates.find((t) => t.id === d.templateId)
    : undefined;
  const linkedGroup = d.groupId
    ? groups.find((g) => g.id === d.groupId)
    : undefined;
  const recipients = linkedGroup
    ? members.filter((m) => m.groupId === linkedGroup.id)
    : [];
  const emailRecipients = recipients.filter((r) => r.email);
  const isAssembled = !!(linkedTemplate && linkedGroup);
  const preview =
    d.body.length > 100 ? d.body.slice(0, 100).trimEnd() + "…" : d.body;

  // Pipeline steps: template, group, content, send
  const steps = [
    { label: "Template", done: !!linkedTemplate },
    { label: "Group", done: !!linkedGroup },
    { label: "Content", done: !!(d.subject && d.body) },
    { label: "Send", done: d.gmailStatus !== "not_prepared" },
  ];
  const completedSteps = steps.filter((s) => s.done).length;

  return (
    <div className={`rounded-xl bg-surface backdrop-blur-sm border overflow-hidden transition-all ${
      d.gmailStatus === "ready_for_gmail"
        ? "border-blue-400/20"
        : d.gmailStatus === "handed_off"
          ? "border-emerald-400/20"
          : "border-border"
    }`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-surface-raised/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          {/* Title + status badges */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-medium text-foreground/85">
              {d.subject || "Untitled draft"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/5 px-2 py-0 text-[9px] font-medium text-muted/60">
              <span className={`inline-block size-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            {d.gmailStatus !== "not_prepared" && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border border-blue-400/15 bg-blue-500/10 px-2 py-0 text-[9px] font-medium ${gmail.color}`}>
                <span className={`inline-block size-1.5 rounded-full ${gmail.dot}`} />
                {gmail.label}
              </span>
            )}
          </div>

          {/* Body preview (collapsed only) */}
          {!expanded && preview && (
            <p className="text-[12px] text-muted/45 leading-relaxed mb-1.5 line-clamp-1">
              {preview}
            </p>
          )}

          {/* Assembly indicators — template → group → recipients */}
          <div className="flex items-center gap-1.5 mt-1">
            {linkedTemplate ? (
              <span className="inline-flex items-center rounded-full bg-violet-500/10 border border-violet-400/15 px-2 py-0 text-[9px] font-medium text-violet-400/70">
                {linkedTemplate.title}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/5 border border-dashed border-border px-2 py-0 text-[9px] font-medium text-muted">
                No template
              </span>
            )}
            <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted/20 shrink-0">
              <path d="M6 4l4 4-4 4" />
            </svg>
            {linkedGroup ? (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-400/15 px-2 py-0 text-[9px] font-medium text-emerald-400/70">
                {linkedGroup.name}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/5 border border-dashed border-border px-2 py-0 text-[9px] font-medium text-muted">
                No group
              </span>
            )}
            {emailRecipients.length > 0 && (
              <>
                <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted/20 shrink-0">
                  <path d="M6 4l4 4-4 4" />
                </svg>
                <span className="text-[9px] text-muted tabular-nums">
                  {emailRecipients.length} recipient{emailRecipients.length === 1 ? "" : "s"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Pipeline progress + chevron */}
        <div className="flex items-center gap-2 shrink-0 mt-1.5">
          <span className="text-[9px] text-muted tabular-nums">
            {completedSteps}/{steps.length}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Pipeline step indicators */}
          <div className="flex items-center gap-1">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-1">
                {i > 0 && <div className={`w-4 h-px ${step.done ? "bg-accent/30" : "bg-border/30"}`} />}
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                  step.done
                    ? "bg-accent/10 text-accent/70"
                    : "bg-white/5 text-muted"
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {!isAssembled && (
            <div className="rounded-lg border border-dashed border-amber-400/20 bg-amber-500/[0.06] px-3.5 py-2.5 flex items-center gap-2">
              <span className="size-1.5 shrink-0 rounded-full bg-amber-400/60" />
              <span className="text-[11px] text-amber-400/60">
                Assign a template and group to complete assembly
              </span>
            </div>
          )}

          {/* Subject */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1.5">Subject</p>
            <p className="text-[13px] text-foreground/80">{d.subject || "—"}</p>
          </div>

          {/* Body */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1.5">Body</p>
            <p className="text-[12px] text-foreground/60 leading-relaxed whitespace-pre-line">{d.body || "—"}</p>
          </div>

          {/* Recipients */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted mb-1.5">
              Recipients{emailRecipients.length > 0 && <span className="font-normal ml-1 tabular-nums">({emailRecipients.length})</span>}
            </p>
            {recipients.length === 0 ? (
              <p className="text-[11px] text-muted italic">No recipients — assign a group to derive recipients</p>
            ) : (
              <div className="space-y-1">
                {recipients.map((r) => (
                  <div key={r.id} className="flex items-center gap-2.5">
                    <div className="size-5 rounded-full bg-white/8 border border-border flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-medium text-muted/60">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-foreground/70">{r.name}</span>
                    {r.role && (
                      <span className="text-[9px] text-muted">{r.role}</span>
                    )}
                    {r.email && (
                      <span className="text-[10px] text-muted ml-auto">{r.email}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send */}
          <div className="border-t border-border/20 pt-3">
            <div className="flex items-center gap-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Send</p>
              <span className={`inline-flex items-center gap-1.5 text-[10px] ${gmail.color}`}>
                <span className={`inline-block size-1.5 rounded-full ${gmail.dot}`} />
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
                  className="text-[10px] font-medium text-blue-400/80 bg-blue-500/10 border border-blue-400/15 rounded-lg px-3 py-1 hover:bg-blue-500/15 transition-colors"
                >
                  Prepare to send
                </button>
              )}
              {d.gmailStatus === "not_prepared" && !isAssembled && (
                <span className="text-[10px] text-muted italic">
                  Complete assembly first
                </span>
              )}
              {d.gmailStatus === "ready_for_gmail" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGmailStatus(d.id, "not_prepared");
                    }}
                    className="text-[10px] font-medium text-muted/50 bg-white/5 border border-border rounded-lg px-3 py-1 hover:bg-white/8 transition-colors"
                  >
                    Reset
                  </button>
                  <a
                    href={buildMailtoLink(d, recipients)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGmailStatus(d.id, "handed_off");
                    }}
                    className="text-[10px] font-medium text-white bg-blue-500 border border-blue-600/30 rounded-lg px-3 py-1 hover:bg-blue-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 11L11 5" />
                      <path d="M7 5h4v4" />
                    </svg>
                    Send
                  </a>
                </div>
              )}
              {d.gmailStatus === "handed_off" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGmailStatus(d.id, "ready_for_gmail");
                  }}
                  className="text-[10px] font-medium text-muted/50 bg-white/5 border border-border rounded-lg px-3 py-1 hover:bg-white/8 transition-colors"
                >
                  Re-open
                </button>
              )}
            </div>
            {d.gmailStatus === "handed_off" && (
              <div className="mt-2.5 rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] px-3.5 py-2 flex items-center gap-2">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400/70 shrink-0">
                  <path d="M14 3l-8.5 8.5L2 8" />
                </svg>
                <span className="text-[11px] text-emerald-400/60">
                  Opened in mail client — finish sending there
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Group card ── */

function GroupCard({
  group,
  members,
  linkedTemplates,
  draftCount,
}: {
  group: GroupItem;
  members: GroupMember[];
  linkedTemplates: TemplateItem[];
  draftCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const style = categoryMeta(group.category);
  const emailCount = members.filter((m) => m.email).length;

  return (
    <div className="rounded-xl bg-surface backdrop-blur-sm border border-border overflow-hidden transition-all hover:border-border-strong/50">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-surface-raised/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-medium text-foreground/85">
              {group.name}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0 text-[9px] font-medium ${style.bg} ${style.text}`}
            >
              {style.label}
            </span>
            <span className="text-[10px] text-muted tabular-nums">
              {members.length} member{members.length === 1 ? "" : "s"}
            </span>
            {emailCount > 0 && emailCount < members.length && (
              <span className="text-[9px] text-muted tabular-nums">
                ({emailCount} with email)
              </span>
            )}
          </div>

          {/* Linked templates + draft count */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {linkedTemplates.length > 0 && (
              <>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted/20 shrink-0">
                  <path d="M4 4l4 4-4 4M8 4l4 4-4 4" />
                </svg>
                {linkedTemplates.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center rounded-full bg-violet-500/8 border border-violet-400/10 px-2 py-0 text-[9px] font-medium text-violet-400/55"
                  >
                    {t.title}
                  </span>
                ))}
              </>
            )}
            {draftCount > 0 && (
              <span className="text-[9px] text-blue-400/50 tabular-nums ml-1">
                {draftCount} draft{draftCount !== 1 ? "s" : ""}
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
          className={`shrink-0 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 py-3">
          {group.description && (
            <p className="text-[11px] text-muted/45 mb-3">{group.description}</p>
          )}
          {members.length === 0 ? (
            <p className="text-[11px] text-muted italic">No members yet.</p>
          ) : (
            <div className="space-y-1.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="size-6 rounded-full bg-white/8 border border-border flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-medium text-muted/60">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] font-medium text-foreground/75">
                      {m.name}
                    </span>
                    {m.role && (
                      <span className="ml-2 text-[10px] text-muted">{m.role}</span>
                    )}
                  </div>
                  {m.email && (
                    <span className="text-[10px] text-muted truncate max-w-[180px]">
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

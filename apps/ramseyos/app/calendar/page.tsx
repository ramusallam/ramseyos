"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getCalendarEvents, type CalendarEvent } from "@/lib/calendar";
import { type Timestamp } from "firebase/firestore";
import Link from "next/link";

interface ConnectionStatus {
  connected: boolean;
  lastSyncedAt: string | null;
  email: string | null;
}

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  error?: string;
}

function formatTime(ts: Timestamp): string {
  return ts.toDate().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSyncTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarContent />
    </Suspense>
  );
}

function CalendarContent() {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("connected") === "true";
  const authError = searchParams.get("error");

  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statusRes, evts] = await Promise.all([
        fetch("/api/calendar/status").then((r) => r.json()),
        getCalendarEvents(new Date()),
      ]);
      setStatus(statusRes);
      setEvents(evts);
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-sync after first connection
  useEffect(() => {
    if (justConnected && status?.connected && !syncing) {
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justConnected, status?.connected]);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
      if (data.success) {
        const evts = await getCalendarEvents(new Date());
        setEvents(evts);
        const statusRes = await fetch("/api/calendar/status").then((r) => r.json());
        setStatus(statusRes);
      }
    } catch {
      setSyncResult({ success: false, created: 0, updated: 0, total: 0, error: "Network error" });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    await fetch("/api/calendar/disconnect", { method: "POST" });
    setStatus({ connected: false, lastSyncedAt: null, email: null });
    setSyncResult(null);
  }

  async function handleSeed() {
    setSeeding(true);
    setSeedMsg(null);
    try {
      const res = await fetch("/api/calendar/seed", { method: "POST" });
      const data = await res.json();
      setSeedMsg(data.message ?? data.error ?? "Done");
      if (data.success) {
        const evts = await getCalendarEvents(new Date());
        setEvents(evts);
      }
    } catch {
      setSeedMsg("Seed failed");
    } finally {
      setSeeding(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted/40">Loading calendar…</span>
        </div>
      </div>
    );
  }

  const now = new Date();
  const isPast = (evt: CalendarEvent) => evt.endTime.toDate() < now;
  const isActive = (evt: CalendarEvent) =>
    evt.startTime.toDate() <= now && evt.endTime.toDate() > now;

  return (
    <div className="max-w-3xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">
          Calendar
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          Schedule sync and today&apos;s events.
        </p>

        {events.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted/40">
            <span className="tabular-nums">{events.length} event{events.length !== 1 ? "s" : ""} today</span>
            {status?.connected && (
              <span className="flex items-center gap-1.5 text-emerald-400/60">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Google connected
              </span>
            )}
          </div>
        )}

        {/* Cross-links */}
        <div className="flex items-center gap-3 mt-3">
          <Link href="/settings" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Settings &rarr;
          </Link>
        </div>
      </header>

      {/* Auth error */}
      {authError && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-sm p-4 mb-8">
          <p className="text-[13px] text-rose-400">
            Connection failed: {authError}
          </p>
        </div>
      )}

      <div className="space-y-8">
        {/* ── Google Calendar connection ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
              <rect x="2" y="3" width="12" height="11" rx="2" />
              <path d="M2 7h12M5 1.5v3M11 1.5v3" />
            </svg>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Google Calendar
            </h2>
            {status?.connected && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-400/70">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Connected
              </span>
            )}
            <div className="flex-1 border-t border-border/40" />
          </div>

          <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-5">
            {status?.connected ? (
              <div className="space-y-3">
                {status.email && (
                  <p className="text-[13px] text-foreground/70">{status.email}</p>
                )}
                {status.lastSyncedAt && (
                  <p className="text-[11px] text-muted/50">
                    Last synced: {formatSyncTime(status.lastSyncedAt)}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    className="inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent-dim px-3 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={syncing ? "animate-spin" : ""}
                    >
                      <path d="M2 8a6 6 0 0110.5-4M14 8a6 6 0 01-10.5 4" />
                      <path d="M14 2v4h-4M2 14v-4h4" />
                    </svg>
                    {syncing ? "Syncing…" : "Sync now"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-[11px] text-muted/40 hover:text-rose-400/70 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>

                {syncResult && (
                  <div
                    className={`rounded-lg px-3 py-2 text-[11px] ${
                      syncResult.success
                        ? "bg-emerald-500/5 text-emerald-400/80 border border-emerald-500/10"
                        : "bg-rose-500/5 text-rose-400/80 border border-rose-500/10"
                    }`}
                  >
                    {syncResult.success
                      ? `Synced ${syncResult.total} event${syncResult.total !== 1 ? "s" : ""} (${syncResult.created} new, ${syncResult.updated} updated)`
                      : `Sync failed: ${syncResult.error}`}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] text-muted/50">
                  Connect Google Calendar to sync today&apos;s events into your daily plan.
                </p>
                <a
                  href="/api/calendar/auth"
                  className="inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent-dim px-4 py-2 text-[12px] font-medium text-accent hover:bg-accent/20 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="12" height="11" rx="2" />
                    <path d="M2 7h12M5 1.5v3M11 1.5v3" />
                  </svg>
                  Connect Google Calendar
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ── Today's schedule ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 4.5v3.5l2.5 1.5" />
            </svg>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Today&apos;s Schedule
            </h2>
            <span className="text-[10px] text-muted/40 tabular-nums">
              {events.length}
            </span>
            <div className="flex-1 border-t border-border/40" />
          </div>

          {events.length === 0 ? (
            <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-10 text-center">
              <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted/30 mb-4">
                <rect x="2" y="3" width="12" height="11" rx="2" />
                <path d="M2 7h12M5 1.5v3M11 1.5v3" />
              </svg>
              <p className="text-sm text-muted/60">
                {status?.connected
                  ? "No events today. Try syncing to pull the latest."
                  : "Connect Google Calendar to see today\u2019s events."}
              </p>
              <p className="text-[12px] text-muted/35 mt-1">
                Events appear in your Daily Card automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className={`flex items-center gap-3 rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm px-4 py-3 transition-colors hover:bg-surface-raised/30 ${
                    isPast(evt) ? "opacity-30" : ""
                  } ${isActive(evt) ? "border-emerald-500/20 bg-emerald-500/[0.03]" : ""}`}
                >
                  {isActive(evt) ? (
                    <span className="size-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                  ) : (
                    <span className="size-2 shrink-0 rounded-full bg-sky-500" />
                  )}

                  <span className={`text-[11px] tabular-nums shrink-0 w-32 ${
                    isActive(evt) ? "text-emerald-400/80 font-medium" : "text-muted/60"
                  }`}>
                    {formatTime(evt.startTime)} – {formatTime(evt.endTime)}
                  </span>

                  <span className={`flex-1 text-[13px] truncate ${
                    isActive(evt) ? "text-foreground font-medium" : "text-foreground/80"
                  }`}>
                    {evt.title}
                  </span>

                  {isActive(evt) && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                      now
                    </span>
                  )}

                  {evt.source === "google" && !isActive(evt) && (
                    <span className="text-[9px] text-muted/30 shrink-0">
                      gcal
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Setup guidance (only when not connected) ── */}
        {!status?.connected && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3M8 10.5v.5" />
              </svg>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Setup
              </h2>
              <div className="flex-1 border-t border-border/40" />
            </div>
            <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-5">
              <p className="text-[12px] text-muted/50 leading-relaxed">
                Google Calendar integration requires OAuth credentials configured in your environment.
                See the project documentation for setup details.
              </p>
            </div>
          </section>
        )}

        {/* ── Test data (development) ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
              <rect x="2" y="2" width="12" height="12" rx="2" />
              <path d="M5 6h6M5 9h4" />
            </svg>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Development
            </h2>
            <div className="flex-1 border-t border-border/40" />
          </div>
          <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-5">
            <p className="text-[12px] text-muted/50 mb-3">
              Seed sample schedule events to test the Daily Card pipeline.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-foreground/60 hover:text-foreground/80 hover:bg-surface-raised transition-colors disabled:opacity-50"
              >
                {seeding ? "Seeding…" : "Seed test events"}
              </button>
              {seedMsg && (
                <span className="text-[11px] text-muted/50">{seedMsg}</span>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getCalendarEvents, type CalendarEvent } from "@/lib/calendar";
import { type Timestamp } from "firebase/firestore";

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
    const [statusRes, evts] = await Promise.all([
      fetch("/api/calendar/status").then((r) => r.json()),
      getCalendarEvents(new Date()),
    ]);
    setStatus(statusRes);
    setEvents(evts);
    setLoading(false);
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
        // Refresh status for lastSyncedAt
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

  if (loading) return null;

  const now = new Date();
  const isPast = (evt: CalendarEvent) => evt.endTime.toDate() < now;
  const isActive = (evt: CalendarEvent) =>
    evt.startTime.toDate() <= now && evt.endTime.toDate() > now;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
        <p className="text-sm text-muted mt-1">
          Google Calendar sync and today&apos;s schedule
        </p>
      </div>

      {/* Auth error */}
      {authError && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <p className="text-sm text-rose-400">
            Connection failed: {authError}
          </p>
        </div>
      )}

      {/* Connection card */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Google Calendar
          </h2>
          {status?.connected && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Connected
            </span>
          )}
        </div>

        {status?.connected ? (
          <div className="space-y-3">
            {status.email && (
              <p className="text-sm text-foreground/70">{status.email}</p>
            )}
            {status.lastSyncedAt && (
              <p className="text-[11px] text-muted">
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
                {syncing ? "Syncing..." : "Sync now"}
              </button>

              <button
                type="button"
                onClick={handleDisconnect}
                className="text-[11px] text-muted hover:text-rose-400 transition-colors"
              >
                Disconnect
              </button>
            </div>

            {/* Sync result */}
            {syncResult && (
              <div
                className={`rounded-lg px-3 py-2 text-[11px] ${
                  syncResult.success
                    ? "bg-emerald-500/5 text-emerald-400 border border-emerald-500/10"
                    : "bg-rose-500/5 text-rose-400 border border-rose-500/10"
                }`}
              >
                {syncResult.success
                  ? `Synced ${syncResult.total} events (${syncResult.created} new, ${syncResult.updated} updated)`
                  : `Sync failed: ${syncResult.error}`}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Connect your Google Calendar to sync today&apos;s events into
              RamseyOS.
            </p>
            <a
              href="/api/calendar/auth"
              className="inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent-dim px-4 py-2 text-[12px] font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="12" height="11" rx="2" />
                <path d="M2 7h12M5 1.5v3M11 1.5v3" />
              </svg>
              Connect Google Calendar
            </a>
          </div>
        )}
      </div>

      {/* Today's events */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Today&apos;s Schedule
          </h2>
          <span className="text-[11px] text-muted/60 tabular-nums">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </span>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted italic">
              {status?.connected
                ? "No events today. Try syncing to pull the latest."
                : "Connect Google Calendar to see today\u2019s events."}
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {events.map((evt) => (
              <li
                key={evt.id}
                className={`flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-raised ${
                  isPast(evt) ? "opacity-40" : ""
                }`}
              >
                {isActive(evt) ? (
                  <span className="size-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
                ) : (
                  <span className="size-2 shrink-0 rounded-full bg-sky-500" />
                )}

                <span className="text-[11px] text-muted tabular-nums shrink-0 w-32">
                  {formatTime(evt.startTime)} – {formatTime(evt.endTime)}
                </span>

                <span className="flex-1 text-[13px] text-foreground/80 truncate">
                  {evt.title}
                </span>

                {isActive(evt) && (
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                    Now
                  </span>
                )}

                {(evt.source === "google" || evt.source === "seed") && (
                  <span className="text-[9px] text-muted/40 shrink-0">
                    {evt.source}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Setup instructions (shown when not connected) */}
      {!status?.connected && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Setup
          </h3>
          <div className="text-[12px] text-muted space-y-2">
            <p>To enable Google Calendar sync, you need:</p>
            <ol className="list-decimal list-inside space-y-1 text-foreground/60">
              <li>
                A Google Cloud project with the Calendar API enabled
              </li>
              <li>
                OAuth 2.0 credentials (Web application type)
              </li>
              <li>
                Set <code className="text-accent/70 bg-accent-dim px-1 py-0.5 rounded text-[11px]">GOOGLE_CLIENT_ID</code>,{" "}
                <code className="text-accent/70 bg-accent-dim px-1 py-0.5 rounded text-[11px]">GOOGLE_CLIENT_SECRET</code>, and{" "}
                <code className="text-accent/70 bg-accent-dim px-1 py-0.5 rounded text-[11px]">GOOGLE_REDIRECT_URI</code> in{" "}
                <code className="text-accent/70 bg-accent-dim px-1 py-0.5 rounded text-[11px]">.env.local</code>
              </li>
              <li>
                Redirect URI should be{" "}
                <code className="text-accent/70 bg-accent-dim px-1 py-0.5 rounded text-[11px]">
                  https://your-domain/api/calendar/auth
                </code>
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Test seed */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Test Data
        </h3>
        <p className="text-[12px] text-muted">
          Seed realistic schedule events for today to test the full Daily Card pipeline.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-lg border border-border/40 bg-surface-raised/50 px-3 py-1.5 text-[11px] font-medium text-foreground/70 hover:bg-surface-raised hover:text-foreground/90 transition-colors disabled:opacity-50"
          >
            {seeding ? "Seeding..." : "Seed test events"}
          </button>
          {seedMsg && (
            <span className="text-[11px] text-muted">{seedMsg}</span>
          )}
        </div>
      </div>
    </div>
  );
}
